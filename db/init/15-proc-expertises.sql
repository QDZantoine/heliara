-- ============================================================
-- HELIARA - Expertises : procédures d'administration
--
-- Même moule que les réalisations et les articles. Trois collections enfants se
-- remplacent en bloc depuis un tableau JSON.
--
-- La particularité des expertises est la **famille** : elle porte l'entrée de nav du
-- site, ce qui en fait la seule collection dont une écriture peut casser la
-- navigation. D'où deux garde-fous : `nav_service_slug` doit désigner un service qui
-- existe, et une famille qui porte encore des services ne se supprime pas.
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Familles
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS list_expertise_families$$
CREATE PROCEDURE list_expertise_families()
SQL SECURITY DEFINER
BEGIN
  SELECT
    f.id, f.slug, f.label, f.title, f.summary, f.tag, f.halo,
    f.sketch_1, f.sketch_2, f.sketch_3, f.nav_service_slug,
    f.position, f.updated_at,
    (SELECT COUNT(*) FROM expertise_service s WHERE s.family_id = f.id)
      AS service_count,
    (SELECT COUNT(*) FROM expertise_service s
     WHERE s.family_id = f.id AND s.status = 'published')
      AS published_count
  FROM expertise_family f
  ORDER BY f.position ASC, f.created_at ASC;
END$$

DROP PROCEDURE IF EXISTS create_expertise_family$$
CREATE PROCEDURE create_expertise_family(
  IN p_slug     VARCHAR(120),
  IN p_label    VARCHAR(120),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id   BINARY(16);
  DECLARE v_now  BIGINT UNSIGNED;
  DECLARE v_slug VARCHAR(120);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_id = GenerateKey();
  SET v_now = UNIX_TIMESTAMP();
  SET v_slug = IFNULL(NULLIF(TRIM(IFNULL(p_slug, '')), ''), Slugify(p_label));

  IF v_slug IS NULL OR v_slug = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_REQUIRED';
  END IF;

  START TRANSACTION;

  IF EXISTS (SELECT 1 FROM expertise_family WHERE slug = v_slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  INSERT INTO expertise_family (
    id, slug, label, title, summary, position, created_at, updated_at, updated_by
  ) VALUES (
    v_id, v_slug, p_label, p_label, '',
    (SELECT IFNULL(MAX(position), 0) + 10 FROM expertise_family x),
    v_now, v_now, p_actor_id
  );

  CALL write_audit(
    p_actor_id, 'expertise_family.create', 'expertise_family', v_id,
    NULL, JSON_OBJECT('slug', v_slug, 'label', p_label), p_ip
  );

  COMMIT;

  SELECT id, slug, label FROM expertise_family WHERE id = v_id;
END$$

/**
 * Met à jour une famille.
 *
 * `nav_service_slug` est vérifié : il doit désigner un service existant, ou rien. La
 * famille porte l'entrée de nav du site, et un slug fautif y produirait un lien mort
 * sur toutes les pages - le pire endroit pour une faute de frappe.
 */
DROP PROCEDURE IF EXISTS update_expertise_family$$
CREATE PROCEDURE update_expertise_family(
  IN p_id       BINARY(16),
  IN p_slug     VARCHAR(120),
  IN p_label    VARCHAR(120),
  IN p_title    VARCHAR(200),
  IN p_summary  TEXT,
  IN p_tag      VARCHAR(40),
  IN p_halo     VARCHAR(10),
  IN p_sketch_1 TINYINT UNSIGNED,
  IN p_sketch_2 TINYINT UNSIGNED,
  IN p_sketch_3 TINYINT UNSIGNED,
  IN p_nav_slug VARCHAR(120),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before LONGTEXT;
  DECLARE v_nav    VARCHAR(120);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_nav = NULLIF(TRIM(IFNULL(p_nav_slug, '')), '');

  START TRANSACTION;

  SELECT JSON_OBJECT(
    'slug', slug, 'label', label, 'nav', nav_service_slug
  ) INTO v_before
  FROM expertise_family WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAMILY_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM expertise_family WHERE slug = p_slug AND id <> p_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  IF v_nav IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM expertise_service WHERE slug = v_nav
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAV_SERVICE_UNKNOWN';
  END IF;

  UPDATE expertise_family SET
    slug             = p_slug,
    label            = p_label,
    title            = IFNULL(NULLIF(p_title, ''), p_label),
    summary          = IFNULL(p_summary, ''),
    tag              = IFNULL(p_tag, ''),
    halo             = IFNULL(p_halo, 'warm'),
    sketch_1         = IFNULL(p_sketch_1, sketch_1),
    sketch_2         = IFNULL(p_sketch_2, sketch_2),
    sketch_3         = IFNULL(p_sketch_3, sketch_3),
    nav_service_slug = v_nav,
    updated_at       = UNIX_TIMESTAMP(),
    updated_by       = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'expertise_family.update', 'expertise_family', p_id,
    v_before, JSON_OBJECT('slug', p_slug, 'label', p_label, 'nav', v_nav), p_ip
  );

  COMMIT;
END$$

/**
 * Supprime une famille vide.
 *
 * Refuse tant qu'elle porte des services : la contrainte `RESTRICT` l'empêcherait de
 * toute façon, mais elle remonterait une erreur de pilote plutôt qu'un code métier
 * affichable. Vider une famille de ses pages publiées par accident serait un dégât
 * qu'aucun message ne rattrape.
 */
DROP PROCEDURE IF EXISTS delete_expertise_family$$
CREATE PROCEDURE delete_expertise_family(
  IN p_id       BINARY(16),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before LONGTEXT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT JSON_OBJECT('slug', slug, 'label', label, 'title', title)
  INTO v_before
  FROM expertise_family WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAMILY_NOT_FOUND';
  END IF;

  IF EXISTS (SELECT 1 FROM expertise_service WHERE family_id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAMILY_NOT_EMPTY';
  END IF;

  DELETE FROM expertise_family WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'expertise_family.delete', 'expertise_family', p_id,
    v_before, NULL, p_ip
  );

  COMMIT;
END$$

/** Réordonne les familles, donc l'ordre des entrées de nav. */
DROP PROCEDURE IF EXISTS reorder_expertise_families$$
CREATE PROCEDURE reorder_expertise_families(
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

  UPDATE expertise_family f
  JOIN JSON_TABLE(
    p_order, '$[*]' COLUMNS (
      id       VARCHAR(32)  PATH '$.id',
      position INT UNSIGNED PATH '$.position'
    )
  ) AS j ON f.id = UNHEX(j.id)
  SET f.position = j.position, f.updated_at = UNIX_TIMESTAMP(),
      f.updated_by = p_actor_id;

  CALL write_audit(
    p_actor_id, 'expertise_family.reorder', 'expertise_family', NULL,
    NULL, p_order, p_ip
  );

  COMMIT;
END$$

-- ------------------------------------------------------------
-- Services
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS list_expertise_services$$
CREATE PROCEDURE list_expertise_services(IN p_status VARCHAR(10))
SQL SECURITY DEFINER
BEGIN
  SELECT
    s.id, s.slug, s.title, s.tagline, s.related_case_slug, s.cta_title,
    s.position, s.status, s.published_at, s.updated_at,
    f.id   AS family_id,
    f.slug AS family_slug,
    f.label AS family_label,
    f.position AS family_position,
    (SELECT COUNT(*) FROM expertise_deliverable d WHERE d.service_id = s.id)
      AS deliverable_count,
    (SELECT COUNT(*) FROM expertise_faq q WHERE q.service_id = s.id)
      AS faq_count,
    u.display_name AS updated_by_name
  FROM expertise_service s
  JOIN expertise_family f ON f.id = s.family_id
  LEFT JOIN `user` u ON u.id = s.updated_by
  WHERE p_status IS NULL OR s.status = p_status
  ORDER BY f.position ASC, s.position ASC;
END$$

/** Un service complet : la fiche puis ses trois collections, en un appel. */
DROP PROCEDURE IF EXISTS get_expertise_service_full$$
CREATE PROCEDURE get_expertise_service_full(
  IN p_id   BINARY(16),
  IN p_slug VARCHAR(120)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  SELECT id INTO v_id
  FROM expertise_service
  WHERE (p_id IS NOT NULL AND id = p_id)
     OR (p_id IS NULL AND p_slug IS NOT NULL AND slug = p_slug)
  LIMIT 1;

  SELECT
    s.id, s.slug, s.title, s.tagline, s.problem,
    s.why_custom_lead, s.why_custom_closing,
    s.related_case_slug, s.cta_title,
    s.position, s.status, s.published_at, s.updated_at,
    f.id AS family_id, f.slug AS family_slug, f.label AS family_label
  FROM expertise_service s
  JOIN expertise_family f ON f.id = s.family_id
  WHERE s.id = v_id;

  SELECT title, text FROM expertise_deliverable
  WHERE service_id = v_id ORDER BY position ASC;

  SELECT title, text FROM expertise_tech_choice
  WHERE service_id = v_id ORDER BY position ASC;

  SELECT question, answer FROM expertise_faq
  WHERE service_id = v_id ORDER BY position ASC;

  SELECT text FROM expertise_why_custom
  WHERE service_id = v_id ORDER BY position ASC;
END$$

DROP PROCEDURE IF EXISTS create_expertise_service$$
CREATE PROCEDURE create_expertise_service(
  IN p_slug      VARCHAR(120),
  IN p_title     VARCHAR(200),
  IN p_family_id BINARY(16),
  IN p_actor_id  BINARY(16),
  IN p_ip        VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id   BINARY(16);
  DECLARE v_now  BIGINT UNSIGNED;
  DECLARE v_slug VARCHAR(120);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET v_id = GenerateKey();
  SET v_now = UNIX_TIMESTAMP();
  SET v_slug = IFNULL(NULLIF(TRIM(IFNULL(p_slug, '')), ''), Slugify(p_title));

  IF v_slug IS NULL OR v_slug = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_REQUIRED';
  END IF;

  START TRANSACTION;

  IF NOT EXISTS (SELECT 1 FROM expertise_family WHERE id = p_family_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAMILY_NOT_FOUND';
  END IF;

  IF EXISTS (SELECT 1 FROM expertise_service WHERE slug = v_slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  INSERT INTO expertise_service (
    id, slug, family_id, title, tagline, problem, cta_title,
    position, status, created_at, updated_at, created_by, updated_by
  ) VALUES (
    v_id, v_slug, p_family_id, p_title, '', '', '',
    (SELECT IFNULL(MAX(position), 0) + 10 FROM expertise_service x
     WHERE x.family_id = p_family_id),
    'draft', v_now, v_now, p_actor_id, p_actor_id
  );

  CALL write_audit(
    p_actor_id, 'expertise_service.create', 'expertise_service', v_id,
    NULL, JSON_OBJECT('slug', v_slug, 'title', p_title), p_ip
  );

  COMMIT;

  SELECT id, slug, title, status FROM expertise_service WHERE id = v_id;
END$$

DROP PROCEDURE IF EXISTS update_expertise_service$$
CREATE PROCEDURE update_expertise_service(
  IN p_id           BINARY(16),
  IN p_slug         VARCHAR(120),
  IN p_family_id    BINARY(16),
  IN p_title        VARCHAR(200),
  IN p_tagline      TEXT,
  IN p_problem      TEXT,
  IN p_related_case VARCHAR(120),
  IN p_cta_title    VARCHAR(160),
  IN p_actor_id     BINARY(16),
  IN p_ip           VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before LONGTEXT;
  DECLARE v_nav    VARCHAR(120) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT JSON_OBJECT('slug', slug, 'title', title) INTO v_before
  FROM expertise_service WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM expertise_service WHERE slug = p_slug AND id <> p_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  IF p_family_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM expertise_family WHERE id = p_family_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FAMILY_NOT_FOUND';
  END IF;

  /*
    Renommer un service qui porte une entrée de nav : le slug de la famille suit.

    Sans cela, changer le slug d'un service laisserait un lien mort dans la nav de
    **toutes** les pages du site, et rien ne l'aurait signalé. C'est précisément le
    défaut que `nav_service_slug` corrige, encore fallait-il le maintenir.
  */
  SELECT slug INTO v_nav FROM expertise_service WHERE id = p_id;

  UPDATE expertise_service SET
    slug              = p_slug,
    family_id         = IFNULL(p_family_id, family_id),
    title             = p_title,
    tagline           = IFNULL(p_tagline, ''),
    problem           = IFNULL(p_problem, ''),
    related_case_slug = NULLIF(TRIM(IFNULL(p_related_case, '')), ''),
    cta_title         = IFNULL(p_cta_title, ''),
    updated_at        = UNIX_TIMESTAMP(),
    updated_by        = p_actor_id
  WHERE id = p_id;

  IF v_nav IS NOT NULL AND v_nav <> p_slug THEN
    UPDATE expertise_family
    SET nav_service_slug = p_slug, updated_at = UNIX_TIMESTAMP()
    WHERE nav_service_slug = v_nav;
  END IF;

  CALL write_audit(
    p_actor_id, 'expertise_service.update', 'expertise_service', p_id,
    v_before, JSON_OBJECT('slug', p_slug, 'title', p_title), p_ip
  );

  COMMIT;
END$$

/**
 * Publie ou repasse en brouillon.
 *
 * Exigences : titre, accroche, problème, et au moins un livrable. Un service sans
 * livrable ne dit pas ce qu'on obtient, ce qui est exactement ce que la page promet.
 */
DROP PROCEDURE IF EXISTS publish_expertise_service$$
CREATE PROCEDURE publish_expertise_service(
  IN p_id       BINARY(16),
  IN p_publish  TINYINT(1),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_status VARCHAR(10) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT status INTO v_status FROM expertise_service WHERE id = p_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NOT_FOUND';
  END IF;

  IF p_publish = 1 AND EXISTS (
    SELECT 1 FROM expertise_service
    WHERE id = p_id AND (title = '' OR tagline = '' OR problem = '')
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_INCOMPLETE';
  END IF;

  IF p_publish = 1 AND (
    SELECT COUNT(*) FROM expertise_deliverable WHERE service_id = p_id
  ) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NO_DELIVERABLE';
  END IF;

  UPDATE expertise_service SET
    status       = IF(p_publish = 1, 'published', 'draft'),
    published_at = IF(p_publish = 1, IFNULL(published_at, UNIX_TIMESTAMP()),
                      published_at),
    updated_at   = UNIX_TIMESTAMP(),
    updated_by   = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id,
    IF(p_publish = 1, 'expertise_service.publish', 'expertise_service.unpublish'),
    'expertise_service', p_id,
    JSON_OBJECT('status', v_status),
    JSON_OBJECT('status', IF(p_publish = 1, 'published', 'draft')), p_ip
  );

  COMMIT;
END$$

/**
 * Supprime un service.
 *
 * Refuse s'il porte l'entrée de nav d'une famille : le lien deviendrait mort sur
 * toutes les pages. Il faut d'abord désigner un autre service.
 */
DROP PROCEDURE IF EXISTS delete_expertise_service$$
CREATE PROCEDURE delete_expertise_service(
  IN p_id       BINARY(16),
  IN p_actor_id BINARY(16),
  IN p_ip       VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before LONGTEXT;
  DECLARE v_slug   VARCHAR(120);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT slug, JSON_OBJECT(
    'slug', slug, 'title', title, 'tagline', tagline, 'status', status
  ) INTO v_slug, v_before
  FROM expertise_service WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM expertise_family WHERE nav_service_slug = v_slug
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_IS_NAV_TARGET';
  END IF;

  DELETE FROM expertise_service WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'expertise_service.delete', 'expertise_service', p_id,
    v_before, NULL, p_ip
  );

  COMMIT;
END$$

DROP PROCEDURE IF EXISTS reorder_expertise_services$$
CREATE PROCEDURE reorder_expertise_services(
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

  UPDATE expertise_service s
  JOIN JSON_TABLE(
    p_order, '$[*]' COLUMNS (
      id       VARCHAR(32)  PATH '$.id',
      position INT UNSIGNED PATH '$.position'
    )
  ) AS j ON s.id = UNHEX(j.id)
  SET s.position = j.position, s.updated_at = UNIX_TIMESTAMP(),
      s.updated_by = p_actor_id;

  CALL write_audit(
    p_actor_id, 'expertise_service.reorder', 'expertise_service', NULL,
    NULL, p_order, p_ip
  );

  COMMIT;
END$$

-- ------------------------------------------------------------
-- Collections d'un service
-- ------------------------------------------------------------

/** Remplace les livrables. JSON : `[{"title","text"}]`. */
DROP PROCEDURE IF EXISTS set_expertise_deliverables$$
CREATE PROCEDURE set_expertise_deliverables(
  IN p_service_id BINARY(16),
  IN p_items      LONGTEXT,
  IN p_actor_id   BINARY(16),
  IN p_ip         VARCHAR(45)
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

  IF NOT EXISTS (SELECT 1 FROM expertise_service WHERE id = p_service_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NOT_FOUND';
  END IF;

  DELETE FROM expertise_deliverable WHERE service_id = p_service_id;

  INSERT INTO expertise_deliverable (id, service_id, title, text, position)
  SELECT GenerateKey(), p_service_id, j.title, IFNULL(j.text, ''),
         (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      title  VARCHAR(200) PATH '$.title',
      text   TEXT         PATH '$.text'
    )
  ) AS j
  WHERE j.title IS NOT NULL AND j.title <> '';

  UPDATE expertise_service
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_service_id;

  CALL write_audit(
    p_actor_id, 'expertise_service.set_deliverables', 'expertise_service',
    p_service_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

/** Remplace les choix techniques. JSON : `[{"title","text"}]`. */
DROP PROCEDURE IF EXISTS set_expertise_tech_choices$$
CREATE PROCEDURE set_expertise_tech_choices(
  IN p_service_id BINARY(16),
  IN p_items      LONGTEXT,
  IN p_actor_id   BINARY(16),
  IN p_ip         VARCHAR(45)
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

  IF NOT EXISTS (SELECT 1 FROM expertise_service WHERE id = p_service_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NOT_FOUND';
  END IF;

  DELETE FROM expertise_tech_choice WHERE service_id = p_service_id;

  INSERT INTO expertise_tech_choice (id, service_id, title, text, position)
  SELECT GenerateKey(), p_service_id, j.title, IFNULL(j.text, ''),
         (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      title  VARCHAR(200) PATH '$.title',
      text   TEXT         PATH '$.text'
    )
  ) AS j
  WHERE j.title IS NOT NULL AND j.title <> '';

  UPDATE expertise_service
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_service_id;

  CALL write_audit(
    p_actor_id, 'expertise_service.set_tech', 'expertise_service',
    p_service_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

/**
 * Remplace la section « Pourquoi du sur-mesure ? ».
 *
 * Un seul appel pour les trois pièces - le chapô, les signes, la conclusion - parce
 * qu'elles n'ont aucun sens séparément : un chapô sans signe annonce une liste vide,
 * et des signes sans conclusion laissent le visiteur sans réponse. Les enregistrer en
 * deux procédures aurait permis un état intermédiaire affichable et faux.
 *
 * JSON attendu : `{"lead": "...", "closing": "...", "signals": ["...", "..."]}`.
 * Une liste vide efface la section, qui est facultative.
 */
DROP PROCEDURE IF EXISTS set_expertise_why_custom$$
CREATE PROCEDURE set_expertise_why_custom(
  IN p_service_id BINARY(16),
  IN p_payload    LONGTEXT,
  IN p_actor_id   BINARY(16),
  IN p_ip         VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_payload IS NULL OR NOT JSON_VALID(p_payload) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_JSON';
  END IF;

  START TRANSACTION;

  IF NOT EXISTS (SELECT 1 FROM expertise_service WHERE id = p_service_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NOT_FOUND';
  END IF;

  UPDATE expertise_service
  SET why_custom_lead    = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.lead')), ''),
      why_custom_closing = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.closing')), ''),
      updated_at         = UNIX_TIMESTAMP(),
      updated_by         = p_actor_id
  WHERE id = p_service_id;

  DELETE FROM expertise_why_custom WHERE service_id = p_service_id;

  INSERT INTO expertise_why_custom (id, service_id, text, position)
  SELECT GenerateKey(), p_service_id, j.text, (j.rank - 1) * 10
  FROM JSON_TABLE(
    JSON_EXTRACT(p_payload, '$.signals'), '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      text   VARCHAR(300) PATH '$'
    )
  ) AS j
  WHERE j.text IS NOT NULL AND j.text <> '';

  CALL write_audit(
    p_actor_id, 'expertise_service.set_why_custom', 'expertise_service',
    p_service_id, NULL, p_payload, p_ip
  );

  COMMIT;
END$$

/** Remplace la FAQ d'objections. JSON : `[{"question","answer"}]`. */
DROP PROCEDURE IF EXISTS set_expertise_faq$$
CREATE PROCEDURE set_expertise_faq(
  IN p_service_id BINARY(16),
  IN p_items      LONGTEXT,
  IN p_actor_id   BINARY(16),
  IN p_ip         VARCHAR(45)
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

  IF NOT EXISTS (SELECT 1 FROM expertise_service WHERE id = p_service_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SERVICE_NOT_FOUND';
  END IF;

  DELETE FROM expertise_faq WHERE service_id = p_service_id;

  INSERT INTO expertise_faq (id, service_id, question, answer, position)
  SELECT GenerateKey(), p_service_id, j.question, IFNULL(j.answer, ''),
         (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank`   FOR ORDINALITY,
      question VARCHAR(300) PATH '$.question',
      answer   TEXT         PATH '$.answer'
    )
  ) AS j
  WHERE j.question IS NOT NULL AND j.question <> '';

  UPDATE expertise_service
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_service_id;

  CALL write_audit(
    p_actor_id, 'expertise_service.set_faq', 'expertise_service',
    p_service_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

DELIMITER ;
