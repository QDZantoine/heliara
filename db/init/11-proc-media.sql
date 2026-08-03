-- ============================================================
-- HELIARA - Médias : procédures
--
-- Le téléversement se fait en deux temps, et c'est ce qui rend le modèle sûr :
--
--   1. `create_media` enregistre la ligne en `pending` et rend son identifiant.
--      L'application signe alors une URL de dépôt vers MinIO.
--   2. Le navigateur envoie l'octet **directement à MinIO**, sans traverser
--      l'application, puis `confirm_media` passe la ligne en `ready`.
--
-- Un envoi abandonné laisse donc une ligne `pending`, repérable et purgeable, mais
-- jamais une image cassée dans une page : rien ne lit un média qui n'est pas
-- `ready`.
-- ============================================================

DELIMITER $$

/**
 * Réserve une ligne de média avant le dépôt.
 *
 * Si un fichier de même empreinte est déjà présent et prêt, sa ligne est rendue
 * telle quelle : on ne stocke pas deux fois le même octet, et le navigateur n'a
 * alors rien à envoyer. `p_checksum` peut être NULL, auquel cas la déduplication
 * ne s'applique pas.
 */
DROP PROCEDURE IF EXISTS create_media$$
CREATE PROCEDURE create_media(
  IN p_object_key    VARCHAR(400),
  IN p_bucket        VARCHAR(80),
  IN p_mime_type     VARCHAR(120),
  IN p_byte_size     BIGINT UNSIGNED,
  IN p_width         INT UNSIGNED,
  IN p_height        INT UNSIGNED,
  IN p_alt           VARCHAR(300),
  IN p_original_name VARCHAR(300),
  IN p_checksum      CHAR(64),
  IN p_actor_id      BINARY(16),
  IN p_ip            VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id       BINARY(16) DEFAULT NULL;
  DECLARE v_existing BINARY(16) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  IF p_checksum IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM media
    WHERE checksum = p_checksum AND status = 'ready'
    LIMIT 1;
  END IF;

  IF v_existing IS NOT NULL THEN
    SET v_id = v_existing;
  ELSE
    SET v_id = GenerateKey();

    INSERT INTO media (
      id, object_key, bucket, mime_type, byte_size, width, height,
      alt, original_name, checksum, status, created_at, created_by
    ) VALUES (
      v_id, p_object_key, p_bucket, p_mime_type, p_byte_size,
      p_width, p_height, IFNULL(p_alt, ''), p_original_name, p_checksum,
      'pending', UNIX_TIMESTAMP(), p_actor_id
    );

    CALL write_audit(
      p_actor_id, 'media.create', 'media', v_id,
      NULL, JSON_OBJECT('key', p_object_key, 'size', p_byte_size), p_ip
    );
  END IF;

  COMMIT;

  -- `status` dit à l'appelant s'il reste un octet à envoyer : `ready` signifie que
  -- le fichier était déjà là.
  SELECT id, object_key, bucket, mime_type, byte_size, width, height,
         alt, original_name, status
  FROM media WHERE id = v_id;
END$$

/**
 * Confirme un dépôt abouti. C'est le seul chemin vers `ready`, donc rien ne peut
 * être affiché avant que l'octet soit effectivement en place.
 *
 * Les dimensions sont acceptées ici parce qu'elles ne sont connues qu'après
 * lecture du fichier par le navigateur.
 */
DROP PROCEDURE IF EXISTS confirm_media$$
CREATE PROCEDURE confirm_media(
  IN p_id        BINARY(16),
  IN p_width     INT UNSIGNED,
  IN p_height    INT UNSIGNED,
  IN p_byte_size BIGINT UNSIGNED,
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

  START TRANSACTION;

  IF NOT EXISTS (SELECT 1 FROM media WHERE id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;

  UPDATE media SET
    status    = 'ready',
    width     = IFNULL(p_width, width),
    height    = IFNULL(p_height, height),
    byte_size = IFNULL(p_byte_size, byte_size)
  WHERE id = p_id;

  CALL write_audit(p_actor_id, 'media.confirm', 'media', p_id, NULL, NULL, p_ip);

  COMMIT;

  SELECT id, object_key, bucket, mime_type, byte_size, width, height,
         alt, original_name, status
  FROM media WHERE id = p_id;
END$$

/** Change le texte alternatif. Le seul champ éditable après coup. */
DROP PROCEDURE IF EXISTS set_media_alt$$
CREATE PROCEDURE set_media_alt(
  IN p_id       BINARY(16),
  IN p_alt      VARCHAR(300),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before VARCHAR(300);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT alt INTO v_before FROM media WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;

  UPDATE media SET alt = IFNULL(p_alt, '') WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'media.set_alt', 'media', p_id,
    JSON_OBJECT('alt', v_before), JSON_OBJECT('alt', IFNULL(p_alt, '')), p_ip
  );

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS get_media$$
CREATE PROCEDURE get_media(IN p_id BINARY(16))
SQL SECURITY DEFINER
BEGIN
  SELECT id, object_key, bucket, mime_type, byte_size, width, height,
         alt, original_name, checksum, status, created_at
  FROM media WHERE id = p_id;
END$$

/** La médiathèque, du plus récent au plus ancien. Seuls les médias en place. */
DROP PROCEDURE IF EXISTS list_media$$
CREATE PROCEDURE list_media(
  IN p_limit  INT,
  IN p_offset INT
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_limit  INT;
  DECLARE v_offset INT;

  SET v_limit = LEAST(GREATEST(IFNULL(p_limit, 60), 1), 200);
  SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);

  SELECT m.id, m.object_key, m.bucket, m.mime_type, m.byte_size,
         m.width, m.height, m.alt, m.original_name, m.created_at,
         -- Un média utilisé quelque part ne doit pas se supprimer sans qu'on le
         -- sache : le compte d'usages est rendu avec la liste.
         (SELECT COUNT(*) FROM case_media cm WHERE cm.media_id = m.id)
           + (SELECT COUNT(*) FROM case_study c WHERE c.hero_media_id = m.id)
           AS usage_count
  FROM media m
  WHERE m.status = 'ready'
  ORDER BY m.created_at DESC
  LIMIT v_limit OFFSET v_offset;
END$$

/**
 * Supprime un média.
 *
 * Refuse si le média est encore employé : la contrainte `RESTRICT` de `case_media`
 * l'empêcherait de toute façon, mais elle remonterait une erreur de pilote plutôt
 * qu'un code métier affichable. La clé d'objet est rendue, pour que l'appelant
 * sache quoi retirer de MinIO.
 */
DROP PROCEDURE IF EXISTS delete_media$$
CREATE PROCEDURE delete_media(
  IN p_id       BINARY(16),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_key   VARCHAR(400) DEFAULT NULL;
  DECLARE v_usage INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT object_key INTO v_key FROM media WHERE id = p_id;

  IF v_key IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_NOT_FOUND';
  END IF;

  /*
    **Les sept references, et non deux.**

    Ce compte ne portait que sur `case_media` et `case_study.hero_media_id`, a l'epoque ou
    c'etaient les seuls usages d'un media. Cinq usages sont apparus depuis, et cinq sur
    sept sont en `ON DELETE SET NULL` : la suppression passait donc, et **vidait le contenu
    en silence** - le portrait d'une personne publiee, la couverture d'un article, la
    variante sombre d'un logo. Une fiche d'equipe se retrouvait publiee sans portrait, etat
    que `publish_team_member` refuse de creer mais qui existait deja en base.

    Les deux references en `RESTRICT` auraient leve une erreur de cle etrangere, illisible
    pour l'appelant. Les compter ici donne `MEDIA_IN_USE`, que la couche d'acces traduit.

    **A tenir a jour** : toute nouvelle colonne qui reference `media` s'ajoute ici. La
    requete de information_schema qui les liste est dans le journal du depot.
  */
  SELECT (SELECT COUNT(*) FROM case_media       WHERE media_id            = p_id)
       + (SELECT COUNT(*) FROM case_study       WHERE hero_media_id       = p_id)
       + (SELECT COUNT(*) FROM article          WHERE hero_media_id       = p_id)
       + (SELECT COUNT(*) FROM client_reference WHERE logo_media_id       = p_id)
       + (SELECT COUNT(*) FROM client_reference WHERE logo_dark_media_id  = p_id)
       + (SELECT COUNT(*) FROM team_member      WHERE photo_light_media_id = p_id)
       + (SELECT COUNT(*) FROM team_member      WHERE photo_dark_media_id  = p_id)
    INTO v_usage;

  IF v_usage > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'MEDIA_IN_USE';
  END IF;

  DELETE FROM media WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'media.delete', 'media', p_id,
    JSON_OBJECT('key', v_key), NULL, p_ip
  );

  COMMIT;

  SELECT v_key AS object_key;
END$$

/**
 * Remplace la galerie d'une réalisation.
 * JSON : `[{"mediaId": "hex", "caption": "…"}]`, dans l'ordre voulu.
 */
DROP PROCEDURE IF EXISTS set_case_gallery$$
CREATE PROCEDURE set_case_gallery(
  IN p_case_id  BINARY(16),
  IN p_items    LONGTEXT,
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

  IF p_items IS NULL OR NOT JSON_VALID(p_items) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_JSON';
  END IF;

  START TRANSACTION;

  IF NOT EXISTS (SELECT 1 FROM case_study WHERE id = p_case_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASE_NOT_FOUND';
  END IF;

  DELETE FROM case_media WHERE case_id = p_case_id AND role = 'gallery';

  INSERT INTO case_media (id, case_id, media_id, role, caption, position)
  SELECT GenerateKey(), p_case_id, UNHEX(j.media_id), 'gallery',
         NULLIF(TRIM(IFNULL(j.caption, '')), ''), (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank`   FOR ORDINALITY,
      media_id VARCHAR(32)  PATH '$.mediaId',
      caption  VARCHAR(300) PATH '$.caption'
    )
  ) AS j
  -- Un identifiant qui ne correspond à aucun média prêt est ignoré plutôt que de
  -- faire échouer tout l'enregistrement sur une seule ligne fautive.
  JOIN media m ON m.id = UNHEX(j.media_id) AND m.status = 'ready';

  UPDATE case_study
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_case_id;

  CALL write_audit(
    p_actor_id, 'case.set_gallery', 'case_study', p_case_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

/** La galerie d'une réalisation, pour l'écran d'édition. */
DROP PROCEDURE IF EXISTS list_case_gallery$$
CREATE PROCEDURE list_case_gallery(IN p_case_id BINARY(16))
SQL SECURITY DEFINER
BEGIN
  SELECT m.id, m.object_key, m.mime_type, m.width, m.height, m.alt,
         m.original_name, cm.caption, cm.position
  FROM case_media cm
  JOIN media m ON m.id = cm.media_id
  WHERE cm.case_id = p_case_id AND cm.role = 'gallery'
  ORDER BY cm.position ASC;
END$$

DELIMITER ;
