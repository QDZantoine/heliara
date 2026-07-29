-- ============================================================
-- HELIARA - Réalisations : procédures
--
-- Toutes en `SQL SECURITY DEFINER`, comme le reste : c'est ce qui permet à
-- `app_exec` de travailler sans aucun droit de table.
--
-- Les collections enfants se remplacent en bloc, à partir d'un tableau JSON lu
-- par `JSON_TABLE`. Un formulaire d'édition renvoie de toute façon la liste
-- complète et réordonnée : chercher à réconcilier ligne par ligne coûterait plus
-- cher et se tromperait davantage. Le remplacement est transactionnel, donc jamais
-- à moitié fait.
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Lecture
-- ------------------------------------------------------------

/**
 * Liste des réalisations, pour la grille publique comme pour l'administration.
 *
 * `p_status` filtre l'état : 'published' pour le site, NULL pour tout voir depuis
 * l'administration. Le compte des collections enfants évite d'avoir à les charger
 * pour afficher une liste.
 */
DROP PROCEDURE IF EXISTS list_case_studies$$
CREATE PROCEDURE list_case_studies(IN p_status VARCHAR(10))
SQL SECURITY DEFINER
BEGIN
  SELECT
    c.id, c.slug, c.sector, c.year, c.badge, c.title, c.hero_title,
    c.teaser, c.summary, c.figure, c.measure, c.halo, c.accent,
    c.featured, c.wide, c.results_label,
    c.testimonial_quote, c.testimonial_name, c.testimonial_role,
    c.testimonial_initials, c.hero_media_id,
    c.position, c.status, c.published_at, c.created_at, c.updated_at,
    (SELECT COUNT(*) FROM case_chapter x WHERE x.case_id = c.id) AS chapter_count,
    (SELECT COUNT(*) FROM case_result  x WHERE x.case_id = c.id) AS result_count,
    u.display_name AS updated_by_name
  FROM case_study c
  LEFT JOIN `user` u ON u.id = c.updated_by
  WHERE p_status IS NULL OR c.status = p_status
  ORDER BY c.position ASC, c.created_at ASC;
END$$

/**
 * Une réalisation complète, **en un seul appel** : cinq jeux de résultats, la
 * fiche puis ses quatre collections, dans l'ordre.
 *
 * L'alternative - cinq allers-retours - multiplierait la latence par cinq pour
 * une page qui les affiche tous ensemble de toute façon.
 *
 * `p_slug` ou `p_id`, l'un des deux. Le site public interroge par slug,
 * l'administration par identifiant.
 */
DROP PROCEDURE IF EXISTS get_case_study_full$$
CREATE PROCEDURE get_case_study_full(
  IN p_id   BINARY(16),
  IN p_slug VARCHAR(120)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  SELECT id INTO v_id
  FROM case_study
  WHERE (p_id IS NOT NULL AND id = p_id)
     OR (p_id IS NULL AND p_slug IS NOT NULL AND slug = p_slug)
  LIMIT 1;

  -- 1. la fiche. Zéro ligne si elle n'existe pas, et les quatre jeux suivants
  --    seront vides : l'appelant n'a qu'un test à faire.
  SELECT
    c.id, c.slug, c.sector, c.year, c.badge, c.title, c.hero_title,
    c.teaser, c.summary, c.figure, c.measure, c.halo, c.accent,
    c.featured, c.wide, c.results_label,
    c.testimonial_quote, c.testimonial_name, c.testimonial_role,
    c.testimonial_initials, c.hero_media_id,
    c.position, c.status, c.published_at, c.created_at, c.updated_at
  FROM case_study c
  WHERE c.id = v_id;

  -- 2. chapitres
  SELECT id, num, title, text, callout, position
  FROM case_chapter WHERE case_id = v_id ORDER BY position ASC;

  -- 3. résultats
  SELECT id, value, label, position
  FROM case_result WHERE case_id = v_id ORDER BY position ASC;

  -- 4. métadonnées de fiche
  SELECT id, label, value, position
  FROM case_meta WHERE case_id = v_id ORDER BY position ASC;

  -- 5. enseignements
  SELECT id, text, position
  FROM case_lesson WHERE case_id = v_id ORDER BY position ASC;
END$$

/** Les slugs publiés, pour `generateStaticParams`. */
DROP PROCEDURE IF EXISTS list_case_slugs$$
CREATE PROCEDURE list_case_slugs()
SQL SECURITY DEFINER
BEGIN
  SELECT slug, updated_at
  FROM case_study
  WHERE status = 'published'
  ORDER BY position ASC;
END$$

/** Les secteurs représentés parmi les réalisations publiées, pour les filtres. */
DROP PROCEDURE IF EXISTS list_case_sectors$$
CREATE PROCEDURE list_case_sectors()
SQL SECURITY DEFINER
BEGIN
  SELECT sector, COUNT(*) AS total
  FROM case_study
  WHERE status = 'published'
  GROUP BY sector
  ORDER BY MIN(position) ASC;
END$$

-- ------------------------------------------------------------
-- Écriture
-- ------------------------------------------------------------

/**
 * Crée une réalisation en brouillon.
 *
 * Le slug est dérivé du titre s'il n'est pas fourni, et son unicité est vérifiée
 * ici : une contrainte suffirait à empêcher le doublon, mais elle remonterait une
 * erreur de pilote plutôt qu'un code métier affichable sous le champ.
 *
 * La position est placée après la dernière, avec un pas de 10.
 */
DROP PROCEDURE IF EXISTS create_case_study$$
CREATE PROCEDURE create_case_study(
  IN p_slug     VARCHAR(120),
  IN p_title    VARCHAR(200),
  IN p_sector   VARCHAR(80),
  IN p_year     VARCHAR(9),
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
  SET v_slug = NULLIF(TRIM(IFNULL(p_slug, '')), '');
  SET v_slug = IFNULL(v_slug, Slugify(p_title));

  IF v_slug IS NULL OR v_slug = '' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_REQUIRED';
  END IF;

  START TRANSACTION;

  IF EXISTS (SELECT 1 FROM case_study WHERE slug = v_slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  INSERT INTO case_study (
    id, slug, sector, year, badge, title, hero_title, teaser, summary,
    figure, measure, position, status, created_at, updated_at,
    created_by, updated_by
  ) VALUES (
    v_id, v_slug, p_sector, p_year, '', p_title, p_title, '', '',
    '', '',
    (SELECT IFNULL(MAX(position), 0) + 10 FROM case_study c),
    'draft', v_now, v_now, p_actor_id, p_actor_id
  );

  CALL write_audit(
    p_actor_id, 'case.create', 'case_study', v_id,
    NULL, JSON_OBJECT('slug', v_slug, 'title', p_title), p_ip
  );

  COMMIT;

  SELECT id, slug, title, status, position FROM case_study WHERE id = v_id;
END$$

/**
 * Met à jour la fiche. Ne touche à aucune collection enfant : elles ont leurs
 * propres procédures, ce qui permet d'enregistrer un onglet du formulaire sans
 * réécrire les autres.
 *
 * L'ancienne valeur est capturée avant l'écriture, pour que le journal d'audit
 * porte un avant et un après.
 */
DROP PROCEDURE IF EXISTS update_case_study$$
CREATE PROCEDURE update_case_study(
  IN p_id            BINARY(16),
  IN p_slug          VARCHAR(120),
  IN p_sector        VARCHAR(80),
  IN p_year          VARCHAR(9),
  IN p_badge         VARCHAR(160),
  IN p_title         VARCHAR(200),
  IN p_hero_title    VARCHAR(300),
  IN p_teaser        TEXT,
  IN p_summary       TEXT,
  IN p_figure        VARCHAR(40),
  IN p_measure       VARCHAR(160),
  IN p_halo          VARCHAR(10),
  IN p_accent        VARCHAR(10),
  IN p_featured      TINYINT(1),
  IN p_wide          TINYINT(1),
  IN p_results_label VARCHAR(160),
  IN p_t_quote       TEXT,
  IN p_t_name        VARCHAR(120),
  IN p_t_role        VARCHAR(160),
  IN p_t_initials    VARCHAR(4),
  IN p_hero_media_id BINARY(16),
  IN p_actor_id      BINARY(16),
  IN p_ip            VARCHAR(45)
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

  SELECT JSON_OBJECT(
    'slug', slug, 'title', title, 'sector', sector, 'year', year,
    'figure', figure, 'featured', featured, 'wide', wide
  ) INTO v_before
  FROM case_study WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASE_NOT_FOUND';
  END IF;

  IF EXISTS (SELECT 1 FROM case_study WHERE slug = p_slug AND id <> p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  UPDATE case_study SET
    slug                 = p_slug,
    sector               = p_sector,
    year                 = p_year,
    badge                = IFNULL(p_badge, ''),
    title                = p_title,
    hero_title           = IFNULL(p_hero_title, p_title),
    teaser               = IFNULL(p_teaser, ''),
    summary              = IFNULL(p_summary, ''),
    figure               = IFNULL(p_figure, ''),
    measure              = IFNULL(p_measure, ''),
    halo                 = IFNULL(p_halo, 'warm'),
    accent               = IFNULL(p_accent, 'brand'),
    featured             = IFNULL(p_featured, 0),
    wide                 = IFNULL(p_wide, 0),
    results_label        = IFNULL(NULLIF(p_results_label, ''), 'Résultats'),
    -- Un témoignage vide est stocké NULL et non chaîne vide : « absent » et
    -- « rempli avec du vide » ne doivent pas se confondre à la lecture.
    testimonial_quote    = NULLIF(TRIM(IFNULL(p_t_quote, '')), ''),
    testimonial_name     = NULLIF(TRIM(IFNULL(p_t_name, '')), ''),
    testimonial_role     = NULLIF(TRIM(IFNULL(p_t_role, '')), ''),
    testimonial_initials = NULLIF(TRIM(IFNULL(p_t_initials, '')), ''),
    hero_media_id        = p_hero_media_id,
    updated_at           = UNIX_TIMESTAMP(),
    updated_by           = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'case.update', 'case_study', p_id,
    v_before,
    JSON_OBJECT(
      'slug', p_slug, 'title', p_title, 'sector', p_sector, 'year', p_year,
      'figure', p_figure, 'featured', IFNULL(p_featured, 0),
      'wide', IFNULL(p_wide, 0)
    ),
    p_ip
  );

  COMMIT;
END$$

/**
 * Publie ou repasse en brouillon.
 *
 * `published_at` n'est posé qu'à la première publication : une republication ne
 * doit pas rajeunir la date affichée. Une dépublication la conserve, pour que
 * republier ne la réinvente pas non plus.
 */
DROP PROCEDURE IF EXISTS publish_case_study$$
CREATE PROCEDURE publish_case_study(
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

  SELECT status INTO v_status FROM case_study WHERE id = p_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASE_NOT_FOUND';
  END IF;

  -- Publier une fiche vide serait publier une page cassée : les champs que la
  -- page publique lit sans garde sont exigés ici.
  --
  -- `figure` et `measure` n'en font **pas** partie, volontairement : toute mission
  -- ne se résume pas à un chiffre, et en réclamer un pousserait à en inventer.
  -- Les cartes du site savent se passer du bloc chiffré.
  IF p_publish = 1 AND EXISTS (
    SELECT 1 FROM case_study
    WHERE id = p_id
      AND (title = '' OR summary = '' OR teaser = '' OR sector = '')
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASE_INCOMPLETE';
  END IF;

  IF p_publish = 1 AND (
    SELECT COUNT(*) FROM case_chapter WHERE case_id = p_id
  ) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASE_NO_CHAPTER';
  END IF;

  UPDATE case_study SET
    status       = IF(p_publish = 1, 'published', 'draft'),
    published_at = IF(p_publish = 1, IFNULL(published_at, UNIX_TIMESTAMP()),
                      published_at),
    updated_at   = UNIX_TIMESTAMP(),
    updated_by   = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, IF(p_publish = 1, 'case.publish', 'case.unpublish'),
    'case_study', p_id,
    JSON_OBJECT('status', v_status),
    JSON_OBJECT('status', IF(p_publish = 1, 'published', 'draft')),
    p_ip
  );

  COMMIT;
END$$

/**
 * Supprime une réalisation. Les collections enfants partent en cascade.
 *
 * La trace d'audit garde une copie de la fiche : c'est le seul endroit où elle
 * subsistera, et cela permet de savoir ce qui a disparu.
 */
DROP PROCEDURE IF EXISTS delete_case_study$$
CREATE PROCEDURE delete_case_study(
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

  SELECT JSON_OBJECT(
    'slug', slug, 'title', title, 'sector', sector, 'year', year,
    'status', status, 'teaser', teaser, 'summary', summary
  ) INTO v_before
  FROM case_study WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CASE_NOT_FOUND';
  END IF;

  DELETE FROM case_study WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'case.delete', 'case_study', p_id, v_before, NULL, p_ip
  );

  COMMIT;
END$$

/**
 * Réordonne la grille à partir d'un tableau JSON `[{"id": "hex", "position": n}]`.
 *
 * Tout en une transaction : un réordonnancement à moitié appliqué laisserait la
 * grille dans un ordre que personne n'a demandé.
 */
DROP PROCEDURE IF EXISTS reorder_case_studies$$
CREATE PROCEDURE reorder_case_studies(
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

  UPDATE case_study c
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
    p_actor_id, 'case.reorder', 'case_study', NULL, NULL, p_order, p_ip
  );

  COMMIT;
END$$

-- ------------------------------------------------------------
-- Collections enfants : remplacement en bloc
-- ------------------------------------------------------------
-- Chacune suit le même moule : on vide, on réinsère depuis le JSON, on
-- journalise, le tout dans une transaction. La position vient du rang dans le
-- tableau, jamais d'un champ à tenir à jour côté client.

/** Remplace les chapitres. JSON : `[{"num","title","text","callout"}]`. */
DROP PROCEDURE IF EXISTS set_case_chapters$$
CREATE PROCEDURE set_case_chapters(
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

  DELETE FROM case_chapter WHERE case_id = p_case_id;

  INSERT INTO case_chapter (id, case_id, num, title, text, callout, position)
  SELECT
    GenerateKey(), p_case_id,
    -- À défaut de numéro fourni, on numérote sur le rang : « 01 », « 02 »…
    IFNULL(NULLIF(j.num, ''), LPAD(j.rank, 2, '0')),
    j.title, j.text, NULLIF(TRIM(IFNULL(j.callout, '')), ''),
    (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank`  FOR ORDINALITY,
      num     VARCHAR(4)   PATH '$.num',
      title   VARCHAR(200) PATH '$.title',
      text    TEXT         PATH '$.text',
      callout TEXT         PATH '$.callout'
    )
  ) AS j
  WHERE j.title IS NOT NULL AND j.title <> '';

  UPDATE case_study
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_case_id;

  CALL write_audit(
    p_actor_id, 'case.set_chapters', 'case_study', p_case_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

/** Remplace les résultats. JSON : `[{"value","label"}]`. */
DROP PROCEDURE IF EXISTS set_case_results$$
CREATE PROCEDURE set_case_results(
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

  DELETE FROM case_result WHERE case_id = p_case_id;

  INSERT INTO case_result (id, case_id, value, label, position)
  SELECT GenerateKey(), p_case_id, j.value, j.label, (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      value  VARCHAR(40)  PATH '$.value',
      label  VARCHAR(200) PATH '$.label'
    )
  ) AS j
  WHERE j.value IS NOT NULL AND j.value <> '';

  UPDATE case_study
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_case_id;

  CALL write_audit(
    p_actor_id, 'case.set_results', 'case_study', p_case_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

/** Remplace les métadonnées de fiche. JSON : `[{"label","value"}]`. */
DROP PROCEDURE IF EXISTS set_case_meta$$
CREATE PROCEDURE set_case_meta(
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

  DELETE FROM case_meta WHERE case_id = p_case_id;

  INSERT INTO case_meta (id, case_id, label, value, position)
  SELECT GenerateKey(), p_case_id, j.label, j.value, (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      label  VARCHAR(120) PATH '$.label',
      value  VARCHAR(300) PATH '$.value'
    )
  ) AS j
  WHERE j.label IS NOT NULL AND j.label <> '';

  UPDATE case_study
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_case_id;

  CALL write_audit(
    p_actor_id, 'case.set_meta', 'case_study', p_case_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

/** Remplace les enseignements. JSON : `["texte", ...]` ou `[{"text"}]`. */
DROP PROCEDURE IF EXISTS set_case_lessons$$
CREATE PROCEDURE set_case_lessons(
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

  DELETE FROM case_lesson WHERE case_id = p_case_id;

  INSERT INTO case_lesson (id, case_id, text, position)
  SELECT GenerateKey(), p_case_id, j.text, (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      text   TEXT PATH '$.text'
    )
  ) AS j
  WHERE j.text IS NOT NULL AND j.text <> '';

  UPDATE case_study
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_case_id;

  CALL write_audit(
    p_actor_id, 'case.set_lessons', 'case_study', p_case_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

DELIMITER ;
