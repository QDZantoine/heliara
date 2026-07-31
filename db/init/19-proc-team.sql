-- ============================================================
-- HELIARA - L'équipe : procédures
--
-- Même moule que les références clientes, avec une collection enfant - les spécialités -
-- remplacée en bloc depuis un tableau JSON, comme partout ailleurs.
--
-- **La publication exige les deux portraits.** C'est la seule exigence que la base
-- ajoute au nom et au rôle : une carte sans portrait sombre montre un trou, et le défaut
-- ne se voit qu'en basculant le thème - donc jamais, en pratique, avant qu'un visiteur
-- ne le voie.
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Lecture
-- ------------------------------------------------------------

/** L'équipe, brouillons compris, avec ses deux portraits joints. */
DROP PROCEDURE IF EXISTS list_team_members$$
CREATE PROCEDURE list_team_members()
SQL SECURITY DEFINER
BEGIN
  SELECT
    m.id, m.name, m.role, m.initials, m.bio, m.is_partner,
    m.position, m.status, m.published_at, m.updated_at,
    m.photo_light_media_id, m.photo_dark_media_id,
    l.object_key AS light_key,
    l.alt        AS light_alt,
    l.original_name AS light_name,
    d.object_key AS dark_key,
    d.alt        AS dark_alt,
    d.original_name AS dark_name
  FROM team_member m
  LEFT JOIN media l ON l.id = m.photo_light_media_id
  LEFT JOIN media d ON d.id = m.photo_dark_media_id
  ORDER BY m.position ASC, m.created_at ASC;
END$$

/** Les spécialités de tous les membres, à répartir par l'appelant. */
DROP PROCEDURE IF EXISTS list_team_skills$$
CREATE PROCEDURE list_team_skills()
SQL SECURITY DEFINER
BEGIN
  SELECT s.member_id, s.label
  FROM team_member_skill s
  JOIN team_member m ON m.id = s.member_id
  ORDER BY m.position ASC, s.position ASC;
END$$

-- ------------------------------------------------------------
-- Écriture
-- ------------------------------------------------------------

/** Crée un membre. Le nom et le rôle suffisent : le reste se remplit ensuite. */
DROP PROCEDURE IF EXISTS create_team_member$$
CREATE PROCEDURE create_team_member(
  IN p_name     VARCHAR(120),
  IN p_role     VARCHAR(160),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
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

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_REQUIRED';
  END IF;
  IF p_role IS NULL OR TRIM(p_role) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ROLE_REQUIRED';
  END IF;

  START TRANSACTION;

  IF EXISTS (SELECT 1 FROM team_member WHERE name = TRIM(p_name)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_TAKEN';
  END IF;

  INSERT INTO team_member (
    id, name, role, bio, position, created_at, updated_at, updated_by
  ) VALUES (
    v_id, TRIM(p_name), TRIM(p_role), '',
    (SELECT IFNULL(MAX(position), 0) + 10 FROM team_member x),
    v_now, v_now, p_actor_id
  );

  CALL write_audit(
    p_actor_id, 'team_member.create', 'team_member', v_id,
    NULL, JSON_OBJECT('name', TRIM(p_name), 'role', TRIM(p_role)), p_ip
  );

  COMMIT;

  SELECT v_id AS id;
END$$

/** Remplace les champs d'un membre, portraits compris. */
DROP PROCEDURE IF EXISTS update_team_member$$
CREATE PROCEDURE update_team_member(
  IN p_id             BINARY(16),
  IN p_name           VARCHAR(120),
  IN p_role           VARCHAR(160),
  IN p_initials       VARCHAR(4),
  IN p_bio            LONGTEXT,
  IN p_is_partner     TINYINT,
  IN p_photo_light_id BINARY(16),
  IN p_photo_dark_id  BINARY(16),
  IN p_actor_id       BINARY(16),
  IN p_ip             VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before JSON;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_REQUIRED';
  END IF;
  IF p_role IS NULL OR TRIM(p_role) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ROLE_REQUIRED';
  END IF;

  START TRANSACTION;

  SELECT JSON_OBJECT(
    'name', name, 'role', role, 'initials', initials,
    'is_partner', is_partner,
    'light', HEX(photo_light_media_id), 'dark', HEX(photo_dark_media_id)
  ) INTO v_before
  FROM team_member WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEMBER_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM team_member WHERE name = TRIM(p_name) AND id <> p_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_TAKEN';
  END IF;

  -- Un média encore `pending` est un envoi interrompu : il n'a rien d'affichable.
  IF p_photo_light_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM media WHERE id = p_photo_light_id AND status = 'ready'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;
  IF p_photo_dark_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM media WHERE id = p_photo_dark_id AND status = 'ready'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;

  UPDATE team_member
  SET name                 = TRIM(p_name),
      role                 = TRIM(p_role),
      initials             = IFNULL(p_initials, ''),
      bio                  = IFNULL(p_bio, ''),
      is_partner           = IF(p_is_partner = 1, 1, 0),
      photo_light_media_id = p_photo_light_id,
      photo_dark_media_id  = p_photo_dark_id,
      updated_at           = UNIX_TIMESTAMP(),
      updated_by           = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'team_member.update', 'team_member', p_id,
    v_before,
    JSON_OBJECT(
      'name', TRIM(p_name), 'role', TRIM(p_role),
      'initials', IFNULL(p_initials, ''),
      'is_partner', IF(p_is_partner = 1, 1, 0),
      'light', HEX(p_photo_light_id), 'dark', HEX(p_photo_dark_id)
    ),
    p_ip
  );

  COMMIT;
END$$

/** Remplace les spécialités en bloc. JSON : `[{"label"}]`. */
DROP PROCEDURE IF EXISTS set_team_skills$$
CREATE PROCEDURE set_team_skills(
  IN p_member_id BINARY(16),
  IN p_items     LONGTEXT,
  IN p_actor_id  BINARY(16),
  IN p_ip        VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_items IS NULL OR NOT JSON_VALID(p_items) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_JSON';
  END IF;

  START TRANSACTION;

  IF NOT EXISTS (SELECT 1 FROM team_member WHERE id = p_member_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEMBER_NOT_FOUND';
  END IF;

  DELETE FROM team_member_skill WHERE member_id = p_member_id;

  INSERT INTO team_member_skill (id, member_id, label, position)
  SELECT GenerateKey(), p_member_id, j.label, (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      label  VARCHAR(120) PATH '$.label'
    )
  ) AS j
  -- Une puce vide est écartée plutôt que de faire échouer tout l'enregistrement : une
  -- ligne laissée en blanc dans l'écran est une hésitation, pas une erreur.
  WHERE j.label IS NOT NULL AND TRIM(j.label) <> '';

  UPDATE team_member
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_member_id;

  CALL write_audit(
    p_actor_id, 'team_member.set_skills', 'team_member', p_member_id,
    NULL, p_items, p_ip
  );

  COMMIT;
END$$

/**
 * Publie ou retire un membre.
 *
 * **Les deux portraits sont exigés.** Aucun ne tient sur les deux thèmes : publier sans
 * le portrait sombre laisse un trou que personne ne voit avant un visiteur, puisqu'on ne
 * bascule pas le thème en relisant sa fiche.
 */
DROP PROCEDURE IF EXISTS publish_team_member$$
CREATE PROCEDURE publish_team_member(
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

  SELECT status INTO v_status FROM team_member WHERE id = p_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEMBER_NOT_FOUND';
  END IF;

  IF p_publish = 1 AND EXISTS (
    SELECT 1 FROM team_member
    WHERE id = p_id
      AND (TRIM(bio) = '' OR TRIM(initials) = '')
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEMBER_INCOMPLETE';
  END IF;

  IF p_publish = 1 AND NOT EXISTS (
    SELECT 1 FROM team_member m
    JOIN media l ON l.id = m.photo_light_media_id AND l.status = 'ready'
    JOIN media d ON d.id = m.photo_dark_media_id  AND d.status = 'ready'
    WHERE m.id = p_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEMBER_NO_PORTRAIT';
  END IF;

  UPDATE team_member
  SET status       = IF(p_publish = 1, 'published', 'draft'),
      published_at = IF(p_publish = 1, IFNULL(published_at, UNIX_TIMESTAMP()), NULL),
      updated_at   = UNIX_TIMESTAMP(),
      updated_by   = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id,
    IF(p_publish = 1, 'team_member.publish', 'team_member.unpublish'),
    'team_member', p_id,
    JSON_OBJECT('status', v_status),
    JSON_OBJECT('status', IF(p_publish = 1, 'published', 'draft')),
    p_ip
  );

  COMMIT;
END$$

/**
 * Réordonne l'équipe. JSON : `[{"id":"<hex>","position":n}]`.
 *
 * **L'ordre porte plus qu'un rang** : la teinte de la pastille en est déduite à la
 * lecture, la première carte prenant le seul orange que la DA autorise par écran.
 * Réordonner change donc les couleurs, ce que l'écran annonce.
 */
DROP PROCEDURE IF EXISTS reorder_team_members$$
CREATE PROCEDURE reorder_team_members(
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

  UPDATE team_member m
  JOIN JSON_TABLE(
    p_order, '$[*]' COLUMNS (
      id       VARCHAR(32)  PATH '$.id',
      position INT UNSIGNED PATH '$.position'
    )
  ) AS j ON m.id = UNHEX(j.id)
  SET m.position   = j.position,
      m.updated_at = UNIX_TIMESTAMP(),
      m.updated_by = p_actor_id;

  CALL write_audit(
    p_actor_id, 'team_member.reorder', 'team_member', NULL,
    NULL, p_order, p_ip
  );

  COMMIT;
END$$

/** Supprime un membre. Ses spécialités partent avec, ses portraits restent. */
DROP PROCEDURE IF EXISTS delete_team_member$$
CREATE PROCEDURE delete_team_member(
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

  SELECT JSON_OBJECT('name', name, 'status', status) INTO v_before
  FROM team_member WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEMBER_NOT_FOUND';
  END IF;

  DELETE FROM team_member WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'team_member.delete', 'team_member', p_id,
    v_before, NULL, p_ip
  );

  COMMIT;
END$$

-- ------------------------------------------------------------
-- Lecture publique
-- ------------------------------------------------------------

/**
 * L'équipe publiée, dans l'ordre d'affichage, avec ses spécialités.
 *
 * Deux jeux de résultats : les personnes, puis toutes les spécialités à répartir par
 * l'appelant. Une jointure aurait dupliqué chaque personne autant de fois qu'elle a de
 * puces, pour un gain nul sur trois lignes.
 *
 * Aucun paramètre de statut : il n'existe pas de manière, pour un appelant de cette
 * procédure, de demander à voir un brouillon.
 */
DROP PROCEDURE IF EXISTS pub_list_team_members$$
CREATE PROCEDURE pub_list_team_members()
SQL SECURITY DEFINER
BEGIN
  SELECT
    m.id, m.name, m.role, m.initials, m.bio, m.is_partner, m.position,
    l.object_key AS light_key,
    l.alt        AS light_alt,
    d.object_key AS dark_key,
    d.alt        AS dark_alt
  FROM team_member m
  JOIN media l ON l.id = m.photo_light_media_id AND l.status = 'ready'
  JOIN media d ON d.id = m.photo_dark_media_id  AND d.status = 'ready'
  WHERE m.status = 'published'
  ORDER BY m.position ASC, m.created_at ASC;

  SELECT s.member_id, s.label
  FROM team_member_skill s
  JOIN team_member m ON m.id = s.member_id
  WHERE m.status = 'published'
  ORDER BY m.position ASC, s.position ASC;
END$$

DELIMITER ;
