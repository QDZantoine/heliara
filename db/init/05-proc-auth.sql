-- ============================================================
-- HELIARA - Authentification
--
-- La base ne connaît que des empreintes. Elle ne hache rien elle-même et ne
-- compare aucun mot de passe : `get_user_for_login` rend l'empreinte stockée, et
-- c'est l'application qui la vérifie en argon2id. Deux raisons : argon2 n'existe
-- pas côté MariaDB, et la comparaison doit se faire en temps constant, ce que la
-- couche applicative garantit.
--
-- Toute écriture est transactionnelle, avec `EXIT HANDLER` pour `ROLLBACK` puis
-- `RESIGNAL`. Les erreurs métier remontent en `SQLSTATE '45000'`, que
-- `lib/db/call.ts` traduit en erreur typée.
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Comptes
-- ------------------------------------------------------------

/**
 * Crée un compte. Renvoie la ligne créée.
 * Erreur métier si l'adresse est déjà prise.
 */
DROP PROCEDURE IF EXISTS create_user$$
CREATE PROCEDURE create_user(
  IN p_email         VARCHAR(180),
  IN p_password_hash VARCHAR(255),
  IN p_display_name  VARCHAR(120),
  IN p_role          VARCHAR(10),
  IN p_actor_id      BINARY(16),
  IN p_ip            VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id  BINARY(16);
  DECLARE v_now BIGINT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_id = GenerateKey();
  SET v_now = UNIX_TIMESTAMP();

  START TRANSACTION;

  IF EXISTS (SELECT 1 FROM `user` WHERE email = p_email) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'EMAIL_ALREADY_USED';
  END IF;

  INSERT INTO `user` (
    id, email, password_hash, display_name, role,
    email_verified, created_at, updated_at
  ) VALUES (
    v_id, p_email, p_password_hash, p_display_name, IFNULL(p_role, 'admin'),
    1, v_now, v_now
  );

  -- Le premier compte est son propre acteur : il n'existe personne pour le créer.
  CALL write_audit(
    IFNULL(p_actor_id, v_id), 'user.create', 'user', v_id,
    NULL, JSON_OBJECT('email', p_email, 'role', IFNULL(p_role, 'admin')), p_ip
  );

  COMMIT;

  SELECT id, email, display_name, role, created_at
  FROM `user`
  WHERE id = v_id;
END$$

/**
 * Ce qu'il faut pour tenter une connexion, empreinte comprise.
 *
 * La procédure ne juge rien : elle rend aussi les comptes suspendus, à charge de
 * l'application de vérifier l'empreinte **avant** de regarder la suspension.
 * L'ordre importe : refuser tôt sur un compte suspendu révélerait son existence
 * à qui ne connaît pas le mot de passe.
 *
 * Renvoie zéro ligne sur une adresse inconnue. L'appelant doit alors consommer
 * un temps de calcul équivalent, sans quoi la durée de la réponse dirait si
 * l'adresse existe.
 */
DROP PROCEDURE IF EXISTS get_user_for_login$$
CREATE PROCEDURE get_user_for_login(IN p_email VARCHAR(180))
SQL SECURITY DEFINER
BEGIN
  SELECT id, email, password_hash, display_name, role, suspended_at
  FROM `user`
  WHERE email = p_email;
END$$

/** Le compte derrière une session, sans son empreinte de mot de passe. */
DROP PROCEDURE IF EXISTS get_user$$
CREATE PROCEDURE get_user(IN p_id BINARY(16))
SQL SECURITY DEFINER
BEGIN
  SELECT id, email, display_name, role, suspended_at, last_login_at, created_at
  FROM `user`
  WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS list_users$$
CREATE PROCEDURE list_users()
SQL SECURITY DEFINER
BEGIN
  SELECT id, email, display_name, role, suspended_at, last_login_at, created_at
  FROM `user`
  ORDER BY created_at ASC;
END$$

/** Change l'empreinte du mot de passe et révoque toutes les sessions. */
DROP PROCEDURE IF EXISTS set_user_password$$
CREATE PROCEDURE set_user_password(
  IN p_id            BINARY(16),
  IN p_password_hash VARCHAR(255),
  IN p_actor_id      BINARY(16),
  IN p_ip            VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  IF NOT EXISTS (SELECT 1 FROM `user` WHERE id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'USER_NOT_FOUND';
  END IF;

  UPDATE `user`
  SET password_hash    = p_password_hash,
      reset_token_hash = NULL,
      reset_expires_at = NULL,
      updated_at       = UNIX_TIMESTAMP()
  WHERE id = p_id;

  -- Un mot de passe changé invalide tout ce qui a été ouvert avec l'ancien.
  DELETE FROM session WHERE user_id = p_id;

  CALL write_audit(
    p_actor_id, 'user.password_change', 'user', p_id, NULL, NULL, p_ip
  );

  COMMIT;
END$$

/** Suspend ou réactive un compte. Suspendre révoque aussi ses sessions. */
DROP PROCEDURE IF EXISTS set_user_suspended$$
CREATE PROCEDURE set_user_suspended(
  IN p_id        BINARY(16),
  IN p_suspended TINYINT(1),
  IN p_actor_id  BINARY(16),
  IN p_ip        VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_now BIGINT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_now = UNIX_TIMESTAMP();

  START TRANSACTION;

  IF NOT EXISTS (SELECT 1 FROM `user` WHERE id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'USER_NOT_FOUND';
  END IF;

  -- Le dernier administrateur actif ne peut pas être suspendu : la porte se
  -- refermerait sur tout le monde.
  IF p_suspended = 1 AND (
    SELECT COUNT(*) FROM `user`
    WHERE role = 'admin' AND suspended_at IS NULL AND id <> p_id
  ) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LAST_ADMIN';
  END IF;

  UPDATE `user`
  SET suspended_at = IF(p_suspended = 1, v_now, NULL),
      updated_at   = v_now
  WHERE id = p_id;

  IF p_suspended = 1 THEN
    DELETE FROM session WHERE user_id = p_id;
  END IF;

  CALL write_audit(
    p_actor_id,
    IF(p_suspended = 1, 'user.suspend', 'user.restore'),
    'user', p_id, NULL, NULL, p_ip
  );

  COMMIT;
END$$

-- ------------------------------------------------------------
-- Sessions
-- ------------------------------------------------------------

/**
 * Ouvre une session. `p_token_hash` est le SHA-256 du jeton, que seul le
 * navigateur détient en clair.
 *
 * Les sessions expirées du compte sont purgées au passage : l'entretien se fait
 * au fil de l'eau, sans tâche planifiée à surveiller.
 */
DROP PROCEDURE IF EXISTS create_session$$
CREATE PROCEDURE create_session(
  IN p_user_id    BINARY(16),
  IN p_token_hash CHAR(64),
  IN p_expires_at BIGINT UNSIGNED,
  IN p_ip         VARCHAR(45),
  IN p_user_agent VARCHAR(255)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id  BINARY(16);
  DECLARE v_now BIGINT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_id = GenerateKey();
  SET v_now = UNIX_TIMESTAMP();

  START TRANSACTION;

  IF NOT EXISTS (
    SELECT 1 FROM `user` WHERE id = p_user_id AND suspended_at IS NULL
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'USER_NOT_ACTIVE';
  END IF;

  DELETE FROM session WHERE user_id = p_user_id AND expires_at <= v_now;

  INSERT INTO session (
    id, user_id, token_hash, expires_at, ip, user_agent,
    created_at, last_seen_at
  ) VALUES (
    v_id, p_user_id, p_token_hash, p_expires_at, p_ip, p_user_agent,
    v_now, v_now
  );

  UPDATE `user` SET last_login_at = v_now WHERE id = p_user_id;

  CALL write_audit(p_user_id, 'session.create', 'session', v_id, NULL, NULL, p_ip);

  COMMIT;

  SELECT id, user_id, expires_at, created_at FROM session WHERE id = v_id;
END$$

/**
 * La session et son compte, en un appel, **si elle est encore valable**.
 *
 * Le filtre sur l'expiration et sur la suspension est ici et non côté
 * application : c'est ce qui garantit qu'aucun appelant ne peut l'oublier. Zéro
 * ligne signifie « pas de session », sans autre distinction à faire.
 */
DROP PROCEDURE IF EXISTS get_session$$
CREATE PROCEDURE get_session(IN p_token_hash CHAR(64))
SQL SECURITY DEFINER
BEGIN
  SELECT
    s.id          AS session_id,
    s.expires_at,
    s.created_at  AS session_created_at,
    u.id          AS user_id,
    u.email,
    u.display_name,
    u.role
  FROM session s
  JOIN `user` u ON u.id = s.user_id
  WHERE s.token_hash = p_token_hash
    AND s.expires_at > UNIX_TIMESTAMP()
    AND u.suspended_at IS NULL;
END$$

/**
 * Prolonge une session active et note son passage.
 * Sans effet sur une session expirée : elle ne doit pas pouvoir ressusciter.
 */
DROP PROCEDURE IF EXISTS touch_session$$
CREATE PROCEDURE touch_session(
  IN p_token_hash CHAR(64),
  IN p_expires_at BIGINT UNSIGNED
)
SQL SECURITY DEFINER
BEGIN
  UPDATE session
  SET last_seen_at = UNIX_TIMESTAMP(),
      expires_at   = GREATEST(expires_at, IFNULL(p_expires_at, expires_at))
  WHERE token_hash = p_token_hash
    AND expires_at > UNIX_TIMESTAMP();
END$$

/** Ferme une session. Silencieuse si le jeton est inconnu : la déconnexion est idempotente. */
DROP PROCEDURE IF EXISTS delete_session$$
CREATE PROCEDURE delete_session(IN p_token_hash CHAR(64))
SQL SECURITY DEFINER
BEGIN
  DELETE FROM session WHERE token_hash = p_token_hash;
END$$

/** Ferme toutes les sessions d'un compte. */
DROP PROCEDURE IF EXISTS delete_user_sessions$$
CREATE PROCEDURE delete_user_sessions(
  IN p_user_id  BINARY(16),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  DELETE FROM session WHERE user_id = p_user_id;
  CALL write_audit(
    p_actor_id, 'session.revoke_all', 'user', p_user_id, NULL, NULL, p_ip
  );
  COMMIT;
END$$

/** Purge globale des sessions expirées. Appelée à la connexion, pas planifiée. */
DROP PROCEDURE IF EXISTS purge_sessions$$
CREATE PROCEDURE purge_sessions()
SQL SECURITY DEFINER
BEGIN
  DELETE FROM session WHERE expires_at <= UNIX_TIMESTAMP();
END$$

-- ------------------------------------------------------------
-- Réinitialisation de mot de passe
-- ------------------------------------------------------------

/**
 * Enregistre une demande de réinitialisation.
 *
 * Ne signale **pas** une adresse inconnue : la réponse doit être la même dans
 * les deux cas, sinon le formulaire devient un outil d'énumération de comptes.
 * L'appelant ne peut donc pas savoir si un envoi est attendu, et c'est voulu.
 */
DROP PROCEDURE IF EXISTS create_password_reset$$
CREATE PROCEDURE create_password_reset(
  IN p_email      VARCHAR(180),
  IN p_token_hash CHAR(64),
  IN p_expires_at BIGINT UNSIGNED,
  IN p_ip         VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT id INTO v_id
  FROM `user`
  WHERE email = p_email AND suspended_at IS NULL;

  IF v_id IS NOT NULL THEN
    UPDATE `user`
    SET reset_token_hash = p_token_hash,
        reset_expires_at = p_expires_at,
        updated_at       = UNIX_TIMESTAMP()
    WHERE id = v_id;

    CALL write_audit(
      v_id, 'user.reset_request', 'user', v_id, NULL, NULL, p_ip
    );
  END IF;

  COMMIT;

  -- Zéro ligne si l'adresse est inconnue : l'appelant n'en apprend rien de plus
  -- qu'il n'y a personne à qui écrire.
  SELECT id, email, display_name FROM `user` WHERE id = v_id;
END$$

/**
 * Consomme un jeton de réinitialisation et pose le nouveau mot de passe.
 * Le jeton est effacé et toutes les sessions sont révoquées, dans la même
 * transaction : il ne peut pas servir deux fois.
 */
DROP PROCEDURE IF EXISTS reset_password$$
CREATE PROCEDURE reset_password(
  IN p_token_hash    CHAR(64),
  IN p_password_hash VARCHAR(255),
  IN p_ip            VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT id INTO v_id
  FROM `user`
  WHERE reset_token_hash = p_token_hash
    AND reset_expires_at > UNIX_TIMESTAMP()
    AND suspended_at IS NULL;

  IF v_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RESET_TOKEN_INVALID';
  END IF;

  UPDATE `user`
  SET password_hash    = p_password_hash,
      reset_token_hash = NULL,
      reset_expires_at = NULL,
      updated_at       = UNIX_TIMESTAMP()
  WHERE id = v_id;

  DELETE FROM session WHERE user_id = v_id;

  CALL write_audit(v_id, 'user.reset_confirm', 'user', v_id, NULL, NULL, p_ip);

  COMMIT;

  SELECT id, email, display_name FROM `user` WHERE id = v_id;
END$$

DELIMITER ;

DELIMITER $$

/**
 * Supprime un compte.
 *
 * Le journal d'audit conserve ses actes : `audit_log.actor_id` est en
 * `ON DELETE SET NULL`, donc l'historique reste mais n'est plus attribué. C'est le
 * compromis choisi - on ne réécrit pas le passé, on ne garde pas de compte fantôme.
 *
 * Refuse de retirer le dernier administrateur actif : la porte se refermerait sur
 * tout le monde. Suspendre reste préférable dans l'usage courant, la suppression
 * étant réservée à un compte créé par erreur et aux jeux de test.
 */
DROP PROCEDURE IF EXISTS delete_user$$
CREATE PROCEDURE delete_user(
  IN p_id       BINARY(16),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_email VARCHAR(180) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT email INTO v_email FROM `user` WHERE id = p_id;

  IF v_email IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'USER_NOT_FOUND';
  END IF;

  IF (
    SELECT COUNT(*) FROM `user`
    WHERE role = 'admin' AND suspended_at IS NULL AND id <> p_id
  ) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'LAST_ADMIN';
  END IF;

  -- La trace est écrite avant la suppression : après, `actor_id` serait déjà nul
  -- si l'acteur se supprimait lui-même.
  CALL write_audit(
    p_actor_id, 'user.delete', 'user', p_id,
    JSON_OBJECT('email', v_email), NULL, p_ip
  );

  DELETE FROM `user` WHERE id = p_id;

  COMMIT;
END$$

DELIMITER ;
