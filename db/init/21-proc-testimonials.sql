-- ============================================================
-- HELIARA - Témoignages : procédures
--
-- Même moule que les références clientes : une table plate, sept procédures, pas de
-- collection enfant.
--
-- **La publication exige la trace de l'accord** - une date et une note qui dit où
-- l'écrit se trouve. C'est la seule exigence que la base ajoute au texte lui-même, et
-- elle ne prouve rien : elle oblige seulement à déclarer, ce qui est tout ce qu'une base
-- peut faire contre le défaut d'origine - trois verbatims inventés mis en ligne.
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Lecture
-- ------------------------------------------------------------

/** Les témoignages, brouillons compris, avec le titre de la réalisation liée. */
DROP PROCEDURE IF EXISTS list_testimonials$$
CREATE PROCEDURE list_testimonials()
SQL SECURITY DEFINER
BEGIN
  SELECT
    t.id, t.quote, t.author_name, t.author_role, t.initials,
    t.consent_at, t.consent_note, t.case_study_id,
    t.position, t.status, t.published_at, t.updated_at,
    c.title AS case_title,
    c.slug  AS case_slug
  FROM testimonial t
  LEFT JOIN case_study c ON c.id = t.case_study_id
  ORDER BY t.position ASC, t.created_at ASC;
END$$

-- ------------------------------------------------------------
-- Écriture
-- ------------------------------------------------------------

/**
 * Crée un témoignage. Le verbatim et son auteur suffisent.
 *
 * L'accord se déclare ensuite : on saisit souvent la citation à sa réception, avant
 * d'avoir demandé la validation écrite. Exiger la trace dès la création obligerait à
 * garder le texte ailleurs en attendant, c'est-à-dire dans un e-mail.
 */
DROP PROCEDURE IF EXISTS create_testimonial$$
CREATE PROCEDURE create_testimonial(
  IN p_quote       VARCHAR(600),
  IN p_author_name VARCHAR(120),
  IN p_author_role VARCHAR(200),
  IN p_actor_id    BINARY(16),
  IN p_ip          VARCHAR(45)
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

  IF p_quote IS NULL OR TRIM(p_quote) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'QUOTE_REQUIRED';
  END IF;
  IF p_author_name IS NULL OR TRIM(p_author_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'AUTHOR_REQUIRED';
  END IF;
  IF p_author_role IS NULL OR TRIM(p_author_role) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ROLE_REQUIRED';
  END IF;

  START TRANSACTION;

  INSERT INTO testimonial (
    id, quote, author_name, author_role, position, created_at, updated_at, updated_by
  ) VALUES (
    v_id, TRIM(p_quote), TRIM(p_author_name), TRIM(p_author_role),
    (SELECT IFNULL(MAX(position), 0) + 10 FROM testimonial x),
    v_now, v_now, p_actor_id
  );

  CALL write_audit(
    p_actor_id, 'testimonial.create', 'testimonial', v_id,
    NULL,
    JSON_OBJECT('author', TRIM(p_author_name), 'role', TRIM(p_author_role)),
    p_ip
  );

  COMMIT;

  SELECT v_id AS id;
END$$

/**
 * Remplace les champs d'un témoignage, trace de l'accord comprise.
 *
 * **Modifier le texte d'un témoignage publié ne le dépublie pas automatiquement**, et
 * c'est un choix : une correction de coquille ne doit pas retirer une citation du site.
 * La conséquence est que l'accord porte sur le texte tel qu'il était au moment de la
 * validation - c'est pourquoi l'ancienne valeur est journalisée en entier, et pourquoi
 * l'écran rappelle qu'une réécriture demande une nouvelle validation.
 */
DROP PROCEDURE IF EXISTS update_testimonial$$
CREATE PROCEDURE update_testimonial(
  IN p_id           BINARY(16),
  IN p_quote        VARCHAR(600),
  IN p_author_name  VARCHAR(120),
  IN p_author_role  VARCHAR(200),
  IN p_initials     VARCHAR(4),
  IN p_consent_at   BIGINT UNSIGNED,
  IN p_consent_note VARCHAR(300),
  IN p_case_id      BINARY(16),
  IN p_actor_id     BINARY(16),
  IN p_ip           VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before JSON;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_quote IS NULL OR TRIM(p_quote) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'QUOTE_REQUIRED';
  END IF;
  IF p_author_name IS NULL OR TRIM(p_author_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'AUTHOR_REQUIRED';
  END IF;
  IF p_author_role IS NULL OR TRIM(p_author_role) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ROLE_REQUIRED';
  END IF;

  START TRANSACTION;

  SELECT JSON_OBJECT(
    'quote', quote, 'author', author_name, 'role', author_role,
    'initials', initials, 'consent_at', consent_at, 'consent_note', consent_note,
    'case', HEX(case_study_id)
  ) INTO v_before
  FROM testimonial WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TESTIMONIAL_NOT_FOUND';
  END IF;

  -- Une réalisation liée doit exister : une clé étrangère orpheline ferait échouer
  -- l'écriture avec un message que personne ne peut interpréter.
  IF p_case_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM case_study WHERE id = p_case_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASE_NOT_FOUND';
  END IF;

  UPDATE testimonial
  SET quote         = TRIM(p_quote),
      author_name   = TRIM(p_author_name),
      author_role   = TRIM(p_author_role),
      initials      = IFNULL(p_initials, ''),
      consent_at    = p_consent_at,
      consent_note  = IFNULL(p_consent_note, ''),
      case_study_id = p_case_id,
      updated_at    = UNIX_TIMESTAMP(),
      updated_by    = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'testimonial.update', 'testimonial', p_id,
    v_before,
    JSON_OBJECT(
      'quote', TRIM(p_quote), 'author', TRIM(p_author_name),
      'role', TRIM(p_author_role), 'initials', IFNULL(p_initials, ''),
      'consent_at', p_consent_at, 'consent_note', IFNULL(p_consent_note, ''),
      'case', HEX(p_case_id)
    ),
    p_ip
  );

  COMMIT;
END$$

/**
 * Publie ou retire un témoignage.
 *
 * **La trace de l'accord est exigée**, et c'est toute la raison d'être de cette
 * procédure. Un verbatim attribué à une personne nommée chez une entreprise nommée
 * engage les deux : la base ne peut pas vérifier qu'un écrit existe, elle peut refuser
 * de publier tant qu'on n'a pas dit quand il a été obtenu et où il se trouve.
 *
 * Les initiales sont exigées aussi : la carte affiche une pastille, et une pastille vide
 * se lit comme un défaut de chargement.
 */
DROP PROCEDURE IF EXISTS publish_testimonial$$
CREATE PROCEDURE publish_testimonial(
  IN p_id       BINARY(16),
  IN p_publish  TINYINT,
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_status VARCHAR(20);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT status INTO v_status FROM testimonial WHERE id = p_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TESTIMONIAL_NOT_FOUND';
  END IF;

  IF p_publish = 1 AND EXISTS (
    SELECT 1 FROM testimonial
    WHERE id = p_id
      AND (consent_at IS NULL OR TRIM(consent_note) = '')
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TESTIMONIAL_NO_CONSENT';
  END IF;

  IF p_publish = 1 AND EXISTS (
    SELECT 1 FROM testimonial WHERE id = p_id AND TRIM(initials) = ''
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TESTIMONIAL_NO_INITIALS';
  END IF;

  UPDATE testimonial
  SET status       = IF(p_publish = 1, 'published', 'draft'),
      published_at = IF(p_publish = 1, IFNULL(published_at, UNIX_TIMESTAMP()), NULL),
      updated_at   = UNIX_TIMESTAMP(),
      updated_by   = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id,
    IF(p_publish = 1, 'testimonial.publish', 'testimonial.unpublish'),
    'testimonial', p_id,
    JSON_OBJECT('status', v_status),
    JSON_OBJECT('status', IF(p_publish = 1, 'published', 'draft')),
    p_ip
  );

  COMMIT;
END$$

/** Réordonne les témoignages. JSON : `[{"id":"<hex>","position":n}]`. */
DROP PROCEDURE IF EXISTS reorder_testimonials$$
CREATE PROCEDURE reorder_testimonials(
  IN p_order    LONGTEXT,
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

  IF p_order IS NULL OR NOT JSON_VALID(p_order) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_JSON';
  END IF;

  START TRANSACTION;

  UPDATE testimonial t
  JOIN JSON_TABLE(
    p_order, '$[*]' COLUMNS (
      id       VARCHAR(32)  PATH '$.id',
      position INT UNSIGNED PATH '$.position'
    )
  ) AS j ON t.id = UNHEX(j.id)
  SET t.position   = j.position,
      t.updated_at = UNIX_TIMESTAMP(),
      t.updated_by = p_actor_id;

  CALL write_audit(
    p_actor_id, 'testimonial.reorder', 'testimonial', NULL,
    NULL, p_order, p_ip
  );

  COMMIT;
END$$

/**
 * Supprime un témoignage.
 *
 * L'ancienne valeur est journalisée **en entier**, verbatim et trace d'accord compris :
 * c'est la seule trace qui restera d'une citation retirée, et le jour où un auteur
 * demande le retrait du sien, savoir ce qui était publié et depuis quand est
 * exactement ce qu'on cherche.
 */
DROP PROCEDURE IF EXISTS delete_testimonial$$
CREATE PROCEDURE delete_testimonial(
  IN p_id       BINARY(16),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before JSON;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT JSON_OBJECT(
    'quote', quote, 'author', author_name, 'role', author_role,
    'status', status, 'published_at', published_at,
    'consent_at', consent_at, 'consent_note', consent_note
  ) INTO v_before
  FROM testimonial WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TESTIMONIAL_NOT_FOUND';
  END IF;

  DELETE FROM testimonial WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'testimonial.delete', 'testimonial', p_id,
    v_before, NULL, p_ip
  );

  COMMIT;
END$$

-- ------------------------------------------------------------
-- Lecture publique
-- ------------------------------------------------------------

/**
 * Les témoignages publiés, dans l'ordre d'affichage.
 *
 * Ni la date d'accord ni la note ne sortent d'ici : ce sont des données internes, et
 * une procédure accordée au déploiement public ne doit rendre que ce qui s'affiche.
 * Le lien vers la réalisation non plus - la carte n'en fait pas encore un lien, et une
 * colonne rendue mais non consommée est exactement le mode de panne où l'on croit
 * qu'une donnée arrive quelque part.
 */
DROP PROCEDURE IF EXISTS pub_list_testimonials$$
CREATE PROCEDURE pub_list_testimonials()
SQL SECURITY DEFINER
BEGIN
  SELECT t.quote, t.author_name, t.author_role, t.initials
  FROM testimonial t
  WHERE t.status = 'published'
  ORDER BY t.position ASC, t.created_at ASC;
END$$

DELIMITER ;
