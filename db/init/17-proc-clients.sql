-- ============================================================
-- HELIARA - Références clientes : procédures
--
-- Une collection plate, donc un CRUD court : créer, modifier, publier, réordonner,
-- supprimer. Pas de collection enfant, pas de slug - une référence n'a pas de page.
--
-- **La publication n'exige qu'un logo**, ce que la clé étrangère garantit déjà, et un
-- média effectivement téléversé. Elle ne vérifie **pas** l'autorisation du client :
-- aucune base ne peut le faire. C'est l'écran qui le rappelle, et le sens du statut
-- `draft` - voir le schéma.
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Lecture
-- ------------------------------------------------------------

/** Toutes les références, brouillons compris, avec leurs deux logos joints. */
DROP PROCEDURE IF EXISTS list_client_references$$
CREATE PROCEDURE list_client_references()
SQL SECURITY DEFINER
BEGIN
  SELECT
    c.id, c.name, c.shape, c.site, c.position, c.status,
    c.published_at, c.updated_at,
    c.logo_media_id, c.logo_dark_media_id,
    l.object_key AS logo_key,
    l.alt        AS logo_alt,
    l.mime_type  AS logo_mime,
    l.original_name AS logo_name,
    d.object_key AS dark_key,
    d.alt        AS dark_alt,
    d.mime_type  AS dark_mime,
    d.original_name AS dark_name
  FROM client_reference c
  JOIN media l ON l.id = c.logo_media_id
  LEFT JOIN media d ON d.id = c.logo_dark_media_id
  ORDER BY c.position ASC, c.created_at ASC;
END$$

-- ------------------------------------------------------------
-- Écriture
-- ------------------------------------------------------------

/**
 * Crée une référence. Le nom et le logo suffisent : la forme et le site s'ajustent
 * ensuite, et une référence sans site reste traçable par son nom.
 */
DROP PROCEDURE IF EXISTS create_client_reference$$
CREATE PROCEDURE create_client_reference(
  IN p_name          VARCHAR(120),
  IN p_logo_media_id BINARY(16),
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

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_REQUIRED';
  END IF;

  START TRANSACTION;

  IF EXISTS (SELECT 1 FROM client_reference WHERE name = TRIM(p_name)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_TAKEN';
  END IF;

  -- Un média encore `pending` est un envoi interrompu : il n'a rien d'affichable.
  IF NOT EXISTS (
    SELECT 1 FROM media WHERE id = p_logo_media_id AND status = 'ready'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;

  INSERT INTO client_reference (
    id, name, logo_media_id, position, created_at, updated_at, updated_by
  ) VALUES (
    v_id, TRIM(p_name), p_logo_media_id,
    (SELECT IFNULL(MAX(position), 0) + 10 FROM client_reference x),
    v_now, v_now, p_actor_id
  );

  CALL write_audit(
    p_actor_id, 'client_reference.create', 'client_reference', v_id,
    NULL, JSON_OBJECT('name', TRIM(p_name)), p_ip
  );

  COMMIT;

  SELECT v_id AS id;
END$$

/** Remplace les champs d'une référence. Les deux logos y compris. */
DROP PROCEDURE IF EXISTS update_client_reference$$
CREATE PROCEDURE update_client_reference(
  IN p_id                BINARY(16),
  IN p_name              VARCHAR(120),
  IN p_logo_media_id     BINARY(16),
  IN p_logo_dark_media_id BINARY(16),
  IN p_shape             VARCHAR(10),
  IN p_site              VARCHAR(300),
  IN p_actor_id          BINARY(16),
  IN p_ip                VARCHAR(45)
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

  START TRANSACTION;

  SELECT JSON_OBJECT(
    'name', name, 'shape', shape, 'site', site,
    'logo', HEX(logo_media_id), 'dark', HEX(logo_dark_media_id)
  ) INTO v_before
  FROM client_reference WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CLIENT_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM client_reference WHERE name = TRIM(p_name) AND id <> p_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_TAKEN';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM media WHERE id = p_logo_media_id AND status = 'ready'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;

  -- La variante sombre est facultative, mais si elle est fournie elle doit exister.
  IF p_logo_dark_media_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM media WHERE id = p_logo_dark_media_id AND status = 'ready'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;

  UPDATE client_reference
  SET name               = TRIM(p_name),
      logo_media_id      = p_logo_media_id,
      logo_dark_media_id = p_logo_dark_media_id,
      shape              = IFNULL(NULLIF(p_shape, ''), 'wide'),
      site               = IFNULL(p_site, ''),
      updated_at         = UNIX_TIMESTAMP(),
      updated_by         = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'client_reference.update', 'client_reference', p_id,
    v_before,
    JSON_OBJECT(
      'name', TRIM(p_name), 'shape', IFNULL(NULLIF(p_shape, ''), 'wide'),
      'site', IFNULL(p_site, ''),
      'logo', HEX(p_logo_media_id), 'dark', HEX(p_logo_dark_media_id)
    ),
    p_ip
  );

  COMMIT;
END$$

/**
 * Publie ou retire une référence.
 *
 * `p_publish = 1` exige un logo effectivement téléversé - la clé étrangère garantit
 * sa présence, pas son état. Rien ici ne peut vérifier l'autorisation du client :
 * c'est une pièce écrite, pas une donnée.
 */
DROP PROCEDURE IF EXISTS publish_client_reference$$
CREATE PROCEDURE publish_client_reference(
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

  SELECT status INTO v_status FROM client_reference WHERE id = p_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CLIENT_NOT_FOUND';
  END IF;

  IF p_publish = 1 AND NOT EXISTS (
    SELECT 1 FROM client_reference c
    JOIN media m ON m.id = c.logo_media_id AND m.status = 'ready'
    WHERE c.id = p_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CLIENT_INCOMPLETE';
  END IF;

  UPDATE client_reference
  SET status       = IF(p_publish = 1, 'published', 'draft'),
      published_at = IF(p_publish = 1, IFNULL(published_at, UNIX_TIMESTAMP()), NULL),
      updated_at   = UNIX_TIMESTAMP(),
      updated_by   = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id,
    IF(p_publish = 1, 'client_reference.publish', 'client_reference.unpublish'),
    'client_reference', p_id,
    JSON_OBJECT('status', v_status),
    JSON_OBJECT('status', IF(p_publish = 1, 'published', 'draft')),
    p_ip
  );

  COMMIT;
END$$

/** Réordonne la bande. JSON : `[{"id":"<hex>","position":n}]`. */
DROP PROCEDURE IF EXISTS reorder_client_references$$
CREATE PROCEDURE reorder_client_references(
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

  UPDATE client_reference c
  JOIN JSON_TABLE(
    p_order, '$[*]' COLUMNS (
      id       VARCHAR(32)  PATH '$.id',
      position INT UNSIGNED PATH '$.position'
    )
  ) AS j ON c.id = UNHEX(j.id)
  SET c.position   = j.position,
      c.updated_at = UNIX_TIMESTAMP(),
      c.updated_by = p_actor_id;

  CALL write_audit(
    p_actor_id, 'client_reference.reorder', 'client_reference', NULL,
    NULL, p_order, p_ip
  );

  COMMIT;
END$$

/** Supprime une référence. Ses médias restent : ils peuvent servir ailleurs. */
DROP PROCEDURE IF EXISTS delete_client_reference$$
CREATE PROCEDURE delete_client_reference(
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
  FROM client_reference WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CLIENT_NOT_FOUND';
  END IF;

  DELETE FROM client_reference WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'client_reference.delete', 'client_reference', p_id,
    v_before, NULL, p_ip
  );

  COMMIT;
END$$

-- ------------------------------------------------------------
-- Lecture publique
-- ------------------------------------------------------------

/**
 * Les références publiées, dans l'ordre de la bande.
 *
 * Aucun paramètre de statut, et c'est le point : il n'existe pas de manière, pour un
 * appelant de cette procédure, de demander à voir une référence non autorisée.
 */
DROP PROCEDURE IF EXISTS pub_list_client_references$$
CREATE PROCEDURE pub_list_client_references()
SQL SECURITY DEFINER
BEGIN
  SELECT
    c.name, c.shape, c.site,
    l.object_key AS logo_key,
    l.alt        AS logo_alt,
    d.object_key AS dark_key,
    d.alt        AS dark_alt
  FROM client_reference c
  JOIN media l ON l.id = c.logo_media_id AND l.status = 'ready'
  LEFT JOIN media d ON d.id = c.logo_dark_media_id AND d.status = 'ready'
  WHERE c.status = 'published'
  ORDER BY c.position ASC, c.created_at ASC;
END$$

DELIMITER ;
