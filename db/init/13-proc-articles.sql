-- ============================================================
-- HELIARA - Articles : procédures d'administration
--
-- Même moule que les réalisations : `SQL SECURITY DEFINER`, transactions avec
-- `ROLLBACK` puis `RESIGNAL`, erreurs métier en `SQLSTATE '45000'`, journal d'audit
-- sur toute écriture, et remplacement des blocs en bloc depuis un tableau JSON.
--
-- Les procédures de lecture publique vivent dans `09-proc-public.sql`, seul endroit
-- dont `app_read` a le droit d'exécuter quoi que ce soit.
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- Lecture d'administration
-- ------------------------------------------------------------

/**
 * Liste des articles. `p_status` à NULL pour tout voir, brouillons compris.
 * L'ordre est celui du flux public : les plus récents d'abord.
 */
DROP PROCEDURE IF EXISTS list_articles$$
CREATE PROCEDURE list_articles(IN p_status VARCHAR(10))
SQL SECURITY DEFINER
BEGIN
  SELECT
    a.id, a.slug, a.category, a.title, a.lead,
    a.author, a.author_role, a.author_initials,
    a.published_on, a.date_label, a.reading_time,
    a.featured, a.related_case_slug, a.hero_media_id,
    a.position, a.status, a.published_at, a.created_at, a.updated_at,
    a.view_count,
    (SELECT COUNT(*) FROM article_block b WHERE b.article_id = a.id) AS block_count,
    u.display_name AS updated_by_name
  FROM article a
  LEFT JOIN `user` u ON u.id = a.updated_by
  WHERE p_status IS NULL OR a.status = p_status
  ORDER BY a.published_on DESC, a.created_at DESC;
END$$

/**
 * Un article complet : la fiche puis ses blocs, deux jeux de résultats en un appel.
 * Par identifiant ou par slug - l'administration adresse par slug, pour que l'URL
 * reste lisible.
 */
DROP PROCEDURE IF EXISTS get_article_full$$
CREATE PROCEDURE get_article_full(
  IN p_id   BINARY(16),
  IN p_slug VARCHAR(120)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  SELECT id INTO v_id
  FROM article
  WHERE (p_id IS NOT NULL AND id = p_id)
     OR (p_id IS NULL AND p_slug IS NOT NULL AND slug = p_slug)
  LIMIT 1;

  SELECT
    a.id, a.slug, a.category, a.title, a.lead,
    a.author, a.author_role, a.author_initials,
    a.published_on, a.date_label, a.reading_time,
    a.featured, a.related_case_slug, a.hero_media_id,
    a.position, a.status, a.published_at, a.view_count, a.updated_at
  FROM article a
  WHERE a.id = v_id;

  SELECT id, kind, text, lead, items, position
  FROM article_block WHERE article_id = v_id ORDER BY position ASC;
END$$

-- ------------------------------------------------------------
-- Écriture
-- ------------------------------------------------------------

/**
 * Crée un article en brouillon.
 *
 * `published_on` et `date_label` sont posés sur le jour courant : neuf fois sur
 * dix c'est la bonne valeur, et une date fausse se remarque mieux qu'une date
 * absente. Le libellé français est fabriqué par l'appelant, MariaDB ne sachant pas
 * formater un mois en français sans dépendre de sa locale.
 */
DROP PROCEDURE IF EXISTS create_article$$
CREATE PROCEDURE create_article(
  IN p_slug       VARCHAR(120),
  IN p_title      VARCHAR(300),
  IN p_category   VARCHAR(30),
  IN p_date_label VARCHAR(60),
  IN p_actor_id   BINARY(16),
  IN p_ip         VARCHAR(45)
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

  IF EXISTS (SELECT 1 FROM article WHERE slug = v_slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  INSERT INTO article (
    id, slug, category, title, lead,
    author, author_role, author_initials,
    published_on, date_label, position, status,
    created_at, updated_at, created_by, updated_by
  ) VALUES (
    v_id, v_slug, IFNULL(p_category, 'Guide'), p_title, '',
    '', '', '',
    CURDATE(), IFNULL(p_date_label, ''),
    (SELECT IFNULL(MAX(position), 0) + 10 FROM article x),
    'draft', v_now, v_now, p_actor_id, p_actor_id
  );

  CALL write_audit(
    p_actor_id, 'article.create', 'article', v_id,
    NULL, JSON_OBJECT('slug', v_slug, 'title', p_title), p_ip
  );

  COMMIT;

  SELECT id, slug, title, status, position FROM article WHERE id = v_id;
END$$

/** Met à jour la fiche. Les blocs ont leur propre procédure. */
DROP PROCEDURE IF EXISTS update_article$$
CREATE PROCEDURE update_article(
  IN p_id             BINARY(16),
  IN p_slug           VARCHAR(120),
  IN p_category       VARCHAR(30),
  IN p_title          VARCHAR(300),
  IN p_lead           TEXT,
  IN p_author         VARCHAR(120),
  IN p_author_role    VARCHAR(160),
  IN p_author_initials VARCHAR(4),
  -- Assez large pour qu'une valeur fautive **atteigne** `STR_TO_DATE` et y soit
  -- rejetée, plutôt que d'échouer sur la longueur du paramètre : la procédure doit
  -- dégrader vers « on garde la date précédente », pas lever.
  IN p_published_on   VARCHAR(40),
  IN p_date_label     VARCHAR(60),
  IN p_reading_time   VARCHAR(20),
  IN p_featured       TINYINT(1),
  IN p_related_case   VARCHAR(120),
  IN p_hero_media_id  BINARY(16),
  IN p_actor_id       BINARY(16),
  IN p_ip             VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_before LONGTEXT;
  DECLARE v_date   DATE DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  /*
    La forme de la date est vérifiée **avant** la conversion.

    `IFNULL(STR_TO_DATE(...), colonne)` paraît suffire, mais ne protège de rien : en
    mode strict, MariaDB lève sur une entrée illisible au lieu de rendre `NULL`. Le
    filtre par expression régulière est donc ce qui permet à une faute de frappe de
    dégrader vers « on garde la date précédente » plutôt que de faire échouer tout
    l'enregistrement.

    Une date bien formée mais inexistante - 2026-02-30 - passerait ce filtre et
    lèverait dans la conversion. C'est accepté : le schéma zod la refuse en amont par
    un aller-retour de normalisation, et une erreur bruyante sur une valeur absurde
    envoyée en direct vaut mieux qu'un silence.
  */
  IF p_published_on REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    SET v_date = STR_TO_DATE(p_published_on, '%Y-%m-%d');
  END IF;

  START TRANSACTION;

  SELECT JSON_OBJECT(
    'slug', slug, 'title', title, 'category', category,
    'author', author, 'featured', featured
  ) INTO v_before
  FROM article WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ARTICLE_NOT_FOUND';
  END IF;

  IF EXISTS (SELECT 1 FROM article WHERE slug = p_slug AND id <> p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLUG_TAKEN';
  END IF;

  UPDATE article SET
    slug              = p_slug,
    category          = IFNULL(p_category, category),
    title             = p_title,
    lead              = IFNULL(p_lead, ''),
    author            = IFNULL(p_author, ''),
    author_role       = IFNULL(p_author_role, ''),
    author_initials   = IFNULL(p_author_initials, ''),
    published_on      = IFNULL(v_date, published_on),
    date_label        = IFNULL(p_date_label, ''),
    reading_time      = IFNULL(p_reading_time, ''),
    -- `IFNULL(p_featured, featured)` et non `IFNULL(p_featured, 0)` : la mise en
    -- avant a sa propre procédure, parce qu'elle est exclusive et se joue sur
    -- plusieurs lignes. Passer `NULL` ici doit donc **préserver** la valeur, pas
    -- l'effacer - sinon enregistrer la fiche retirerait l'article de l'accueil.
    featured          = IFNULL(p_featured, featured),
    related_case_slug = NULLIF(TRIM(IFNULL(p_related_case, '')), ''),
    hero_media_id     = p_hero_media_id,
    updated_at        = UNIX_TIMESTAMP(),
    updated_by        = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'article.update', 'article', p_id,
    v_before,
    JSON_OBJECT(
      'slug', p_slug, 'title', p_title, 'category', p_category,
      'author', p_author, 'featured', IFNULL(p_featured, 0)
    ),
    p_ip
  );

  COMMIT;
END$$

/**
 * Remplace les blocs du corps.
 * JSON : `[{"kind","text","lead","items"}]`, dans l'ordre voulu.
 *
 * Un bloc dont le type est inconnu, ou dont le contenu attendu est vide, est écarté
 * plutôt que de faire échouer tout l'enregistrement : une ligne fautive ne doit pas
 * coûter le reste du travail.
 */
DROP PROCEDURE IF EXISTS set_article_blocks$$
CREATE PROCEDURE set_article_blocks(
  IN p_article_id BINARY(16),
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

  IF NOT EXISTS (SELECT 1 FROM article WHERE id = p_article_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ARTICLE_NOT_FOUND';
  END IF;

  DELETE FROM article_block WHERE article_id = p_article_id;

  INSERT INTO article_block (id, article_id, kind, text, lead, items, position)
  SELECT
    GenerateKey(), p_article_id, j.kind,
    NULLIF(TRIM(IFNULL(j.text, '')), ''),
    NULLIF(TRIM(IFNULL(j.lead, '')), ''),
    -- `items` n'a de sens que pour un `numbered` : ailleurs on stocke NULL, pour
    -- que la forme en base dise le type sans avoir à l'interpréter.
    IF(j.kind = 'numbered', NULLIF(j.items, ''), NULL),
    (j.rank - 1) * 10
  FROM JSON_TABLE(
    p_items, '$[*]' COLUMNS (
      `rank` FOR ORDINALITY,
      kind   VARCHAR(20) PATH '$.kind',
      text   TEXT        PATH '$.text',
      lead   TEXT        PATH '$.lead',
      items  LONGTEXT    PATH '$.items'
    )
  ) AS j
  WHERE j.kind IN ('paragraph', 'heading', 'callout', 'numbered')
    AND (
      -- Un bloc de texte vide n'a rien à afficher ; un `numbered` sans entrée non plus.
      (j.kind <> 'numbered' AND TRIM(IFNULL(j.text, '')) <> '')
      OR (j.kind = 'numbered' AND JSON_VALID(IFNULL(j.items, ''))
          AND JSON_LENGTH(j.items) > 0)
    );

  UPDATE article
  SET updated_at = UNIX_TIMESTAMP(), updated_by = p_actor_id
  WHERE id = p_article_id;

  CALL write_audit(
    p_actor_id, 'article.set_blocks', 'article', p_article_id, NULL, p_items, p_ip
  );

  COMMIT;
END$$

/**
 * Publie ou repasse en brouillon.
 *
 * Exigences de publication : titre, chapô, auteur et au moins un bloc. La date
 * lisible en fait partie - une carte de flux sans date paraît négligée. Le temps de
 * lecture n'est pas exigé : il est utile, pas indispensable.
 */
DROP PROCEDURE IF EXISTS publish_article$$
CREATE PROCEDURE publish_article(
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

  SELECT status INTO v_status FROM article WHERE id = p_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ARTICLE_NOT_FOUND';
  END IF;

  IF p_publish = 1 AND EXISTS (
    SELECT 1 FROM article
    WHERE id = p_id
      AND (title = '' OR lead = '' OR author = '' OR date_label = ''
           OR published_on IS NULL)
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ARTICLE_INCOMPLETE';
  END IF;

  IF p_publish = 1 AND (
    SELECT COUNT(*) FROM article_block WHERE article_id = p_id
  ) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ARTICLE_NO_BLOCK';
  END IF;

  UPDATE article SET
    status       = IF(p_publish = 1, 'published', 'draft'),
    published_at = IF(p_publish = 1, IFNULL(published_at, UNIX_TIMESTAMP()),
                      published_at),
    updated_at   = UNIX_TIMESTAMP(),
    updated_by   = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, IF(p_publish = 1, 'article.publish', 'article.unpublish'),
    'article', p_id,
    JSON_OBJECT('status', v_status),
    JSON_OBJECT('status', IF(p_publish = 1, 'published', 'draft')),
    p_ip
  );

  COMMIT;
END$$

/** Supprime un article. Ses blocs partent en cascade, l'audit garde une copie. */
DROP PROCEDURE IF EXISTS delete_article$$
CREATE PROCEDURE delete_article(
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
    'slug', slug, 'title', title, 'category', category,
    'author', author, 'status', status, 'lead', lead
  ) INTO v_before
  FROM article WHERE id = p_id;

  IF v_before IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ARTICLE_NOT_FOUND';
  END IF;

  DELETE FROM article WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'article.delete', 'article', p_id, v_before, NULL, p_ip
  );

  COMMIT;
END$$

/**
 * Ne laisse qu'un seul article mis en avant.
 *
 * Le flux public affiche **un** article en tête et exclut celui-là de la grille :
 * deux mises en avant en feraient disparaître une, sans que personne comprenne
 * pourquoi. La contrainte est portée ici et non par un index unique partiel, que
 * MariaDB ne connaît pas.
 */
DROP PROCEDURE IF EXISTS set_article_featured$$
CREATE PROCEDURE set_article_featured(
  IN p_id       BINARY(16),
  IN p_featured TINYINT(1),
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

  IF NOT EXISTS (SELECT 1 FROM article WHERE id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ARTICLE_NOT_FOUND';
  END IF;

  IF p_featured = 1 THEN
    UPDATE article SET featured = 0, updated_at = UNIX_TIMESTAMP()
    WHERE featured = 1 AND id <> p_id;
  END IF;

  UPDATE article
  SET featured = IFNULL(p_featured, 0),
      updated_at = UNIX_TIMESTAMP(),
      updated_by = p_actor_id
  WHERE id = p_id;

  CALL write_audit(
    p_actor_id, 'article.set_featured', 'article', p_id,
    NULL, JSON_OBJECT('featured', IFNULL(p_featured, 0)), p_ip
  );

  COMMIT;
END$$

DELIMITER ;

DELIMITER $$

/**
 * Les vues d'un article : total, et détail des trente derniers jours.
 *
 * Deux jeux de résultats. Le total vient de la colonne dénormalisée, le détail de
 * l'agrégat quotidien : le premier est instantané, le second dit si l'article est
 * lu maintenant. Un total seul ne distinguerait pas un article populaire d'un
 * article ancien.
 */
DROP PROCEDURE IF EXISTS get_article_views$$
CREATE PROCEDURE get_article_views(IN p_id BINARY(16))
SQL SECURITY DEFINER
BEGIN
  SELECT view_count,
         (SELECT IFNULL(SUM(views), 0) FROM article_view_daily d
          WHERE d.article_id = p_id AND d.day >= CURDATE() - INTERVAL 30 DAY)
           AS views_30d,
         (SELECT IFNULL(SUM(views), 0) FROM article_view_daily d
          WHERE d.article_id = p_id AND d.day >= CURDATE() - INTERVAL 7 DAY)
           AS views_7d
  FROM article WHERE id = p_id;

  SELECT day, views
  FROM article_view_daily
  WHERE article_id = p_id AND day >= CURDATE() - INTERVAL 30 DAY
  ORDER BY day ASC;
END$$

DELIMITER ;
