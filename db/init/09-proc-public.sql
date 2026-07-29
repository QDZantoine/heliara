-- ============================================================
-- HELIARA - Surface de lecture publique
--
-- **C'est ici que se joue la séparation entre le Read et le Write.**
--
-- Le site public n'appelle que des procédures `pub_*`, et le compte `app_read`
-- n'a le droit d'exécuter que celles-là. Trois conséquences, toutes voulues :
--
--   1. Le site public ne peut rien écrire. Pas « ne devrait pas » : il n'a pas le
--      privilège de le faire, et une injection réussie chez lui ne changerait
--      rien à cela.
--   2. Le site public ne peut pas voir un brouillon. Le filtre sur le statut est
--      **dans la procédure**, sans paramètre pour le désactiver. Les procédures
--      d'administration qui acceptent `p_status` restent hors de sa portée.
--   3. La surface d'attaque du site public tient sur cette page. Ce qui n'y
--      figure pas lui est inatteignable.
--
-- Le préfixe `pub_` n'est pas cosmétique : c'est ce qui rend l'octroi de
-- privilèges mécanique et vérifiable, et ce qui fait qu'un oubli de grant se
-- traduit par une erreur bruyante plutôt que par une fuite silencieuse.
-- ============================================================

DELIMITER $$

/**
 * Les réalisations publiées, dans l'ordre de la grille.
 *
 * Aucun paramètre de statut, et c'est le point : il n'existe pas de manière, pour
 * un appelant de cette procédure, de demander à voir un brouillon.
 */
DROP PROCEDURE IF EXISTS pub_list_case_studies$$
CREATE PROCEDURE pub_list_case_studies()
SQL SECURITY DEFINER
BEGIN
  SELECT
    c.id, c.slug, c.sector, c.year, c.badge, c.title, c.hero_title,
    c.teaser, c.summary, c.figure, c.measure, c.halo, c.accent,
    c.featured, c.wide, c.results_label,
    c.testimonial_quote, c.testimonial_name, c.testimonial_role,
    c.testimonial_initials,
    m.object_key AS hero_object_key,
    m.alt        AS hero_alt,
    m.width      AS hero_width,
    m.height     AS hero_height,
    c.position, c.published_at, c.updated_at
  FROM case_study c
  LEFT JOIN media m ON m.id = c.hero_media_id AND m.status = 'ready'
  WHERE c.status = 'published'
  ORDER BY c.position ASC, c.published_at ASC;
END$$

/**
 * Une réalisation publiée, complète, en un seul appel : cinq jeux de résultats.
 *
 * Une fiche en brouillon rend zéro ligne, exactement comme une fiche inexistante.
 * La page publique appelle donc `notFound()` dans les deux cas, sans avoir à
 * distinguer « pas encore publié » de « n'existe pas » - et sans le révéler.
 */
DROP PROCEDURE IF EXISTS pub_get_case_study$$
CREATE PROCEDURE pub_get_case_study(IN p_slug VARCHAR(120))
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  SELECT id INTO v_id
  FROM case_study
  WHERE slug = p_slug AND status = 'published'
  LIMIT 1;

  SELECT
    c.id, c.slug, c.sector, c.year, c.badge, c.title, c.hero_title,
    c.teaser, c.summary, c.figure, c.measure, c.halo, c.accent,
    c.featured, c.wide, c.results_label,
    c.testimonial_quote, c.testimonial_name, c.testimonial_role,
    c.testimonial_initials,
    m.object_key AS hero_object_key,
    m.alt        AS hero_alt,
    m.width      AS hero_width,
    m.height     AS hero_height,
    c.position, c.published_at, c.updated_at
  FROM case_study c
  LEFT JOIN media m ON m.id = c.hero_media_id AND m.status = 'ready'
  WHERE c.id = v_id;

  SELECT num, title, text, callout
  FROM case_chapter WHERE case_id = v_id ORDER BY position ASC;

  SELECT value, label
  FROM case_result WHERE case_id = v_id ORDER BY position ASC;

  SELECT label, value
  FROM case_meta WHERE case_id = v_id ORDER BY position ASC;

  SELECT text
  FROM case_lesson WHERE case_id = v_id ORDER BY position ASC;

  -- Galerie : seuls les médias effectivement téléversés.
  SELECT m.object_key, m.alt, m.width, m.height, cm.caption
  FROM case_media cm
  JOIN media m ON m.id = cm.media_id
  WHERE cm.case_id = v_id AND cm.role = 'gallery' AND m.status = 'ready'
  ORDER BY cm.position ASC;
END$$

/** Les slugs publiés, pour `generateStaticParams` et le plan du site. */
DROP PROCEDURE IF EXISTS pub_list_case_slugs$$
CREATE PROCEDURE pub_list_case_slugs()
SQL SECURITY DEFINER
BEGIN
  SELECT slug, updated_at, published_at
  FROM case_study
  WHERE status = 'published'
  ORDER BY position ASC;
END$$

/** Les secteurs représentés parmi les fiches publiées, pour la rangée de filtres. */
DROP PROCEDURE IF EXISTS pub_list_case_sectors$$
CREATE PROCEDURE pub_list_case_sectors()
SQL SECURITY DEFINER
BEGIN
  SELECT sector, COUNT(*) AS total
  FROM case_study
  WHERE status = 'published'
  GROUP BY sector
  ORDER BY MIN(position) ASC;
END$$

-- ------------------------------------------------------------
-- Articles
-- ------------------------------------------------------------

/**
 * Le flux des articles publiés, du plus récent au plus ancien.
 *
 * Sans corps : la liste n'affiche que la carte. Charger les blocs de six articles
 * pour n'en montrer aucun serait du gaspillage.
 */
DROP PROCEDURE IF EXISTS pub_list_articles$$
CREATE PROCEDURE pub_list_articles()
SQL SECURITY DEFINER
BEGIN
  SELECT
    a.slug, a.category, a.title, a.lead,
    a.author, a.author_role, a.author_initials,
    a.published_on, a.date_label, a.reading_time,
    a.featured, a.related_case_slug,
    m.object_key AS hero_object_key,
    m.alt        AS hero_alt,
    m.width      AS hero_width,
    m.height     AS hero_height,
    a.published_at, a.updated_at
  FROM article a
  LEFT JOIN media m ON m.id = a.hero_media_id AND m.status = 'ready'
  WHERE a.status = 'published'
  ORDER BY a.published_on DESC, a.published_at DESC;
END$$

/**
 * Un article publié, corps compris : deux jeux de résultats.
 * Un brouillon rend zéro ligne, comme un article inexistant.
 */
DROP PROCEDURE IF EXISTS pub_get_article$$
CREATE PROCEDURE pub_get_article(IN p_slug VARCHAR(120))
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  SELECT id INTO v_id
  FROM article
  WHERE slug = p_slug AND status = 'published'
  LIMIT 1;

  SELECT
    a.slug, a.category, a.title, a.lead,
    a.author, a.author_role, a.author_initials,
    a.published_on, a.date_label, a.reading_time,
    a.featured, a.related_case_slug,
    m.object_key AS hero_object_key,
    m.alt        AS hero_alt,
    m.width      AS hero_width,
    m.height     AS hero_height,
    a.published_at, a.updated_at
  FROM article a
  LEFT JOIN media m ON m.id = a.hero_media_id AND m.status = 'ready'
  WHERE a.id = v_id;

  SELECT kind, text, lead, items
  FROM article_block WHERE article_id = v_id ORDER BY position ASC;
END$$

/**
 * Compte une vue d'article.
 *
 * **La seule procédure d'écriture accordée au site public, et il faut en mesurer la
 * portée.**
 *
 * Le compte `app_read` n'a par ailleurs le droit d'écrire nulle part : c'est
 * l'ensemble du modèle. Ouvrir une exception ici n'est possible que parce que les
 * privilèges sont accordés **procédure par procédure** - le millimètre de surface
 * qu'on ouvre est exactement celui-ci, et pas un de plus.
 *
 * Ce que cette procédure peut faire, au pire : gonfler un compteur. Elle ne lit
 * aucun contenu, ne rend aucune ligne, n'accepte qu'un slug, et ne touche que deux
 * colonnes numériques. Un appelant hostile ne peut ni modifier un article, ni le
 * publier, ni le supprimer, ni découvrir un brouillon - un slug non publié ne
 * correspond à rien et l'appel est sans effet.
 *
 * Le risque résiduel est celui de tout compteur public : le chiffre est
 * approximatif et gonflable. C'est pourquoi il est présenté comme une indication de
 * lecture et non comme une mesure d'audience, et pourquoi l'appel est déclenché
 * côté navigateur avec un délai plutôt qu'au rendu - voir
 * `components/ressources/view-counter.tsx`.
 *
 * Une remarque de conception qui compte : le total et la ligne du jour sont écrits
 * dans la même transaction. Dénormaliser un total impose de le tenir à jour au même
 * instant que son détail, sinon les deux finissent par se contredire.
 */
DROP PROCEDURE IF EXISTS pub_count_article_view$$
CREATE PROCEDURE pub_count_article_view(IN p_slug VARCHAR(120))
SQL SECURITY DEFINER
BEGIN
  DECLARE v_id BINARY(16) DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    -- **Silencieuse en cas d'échec, et c'est délibéré.** Un compteur qui casse ne
    -- doit pas casser la lecture d'un article : l'appelant ne saura rien, et c'est
    -- préférable à une erreur remontée au visiteur pour une statistique.
  END;

  SELECT id INTO v_id
  FROM article
  WHERE slug = p_slug AND status = 'published'
  LIMIT 1;

  -- Slug inconnu ou brouillon : aucun effet, aucune erreur, rien n'est révélé.
  -- Le contrôle est une condition et non un `LEAVE`, que MariaDB n'accepte que
  -- dans un bloc étiqueté.
  IF v_id IS NOT NULL THEN
    START TRANSACTION;

    UPDATE article SET view_count = view_count + 1 WHERE id = v_id;

    INSERT INTO article_view_daily (article_id, day, views)
    VALUES (v_id, CURDATE(), 1)
    ON DUPLICATE KEY UPDATE views = views + 1;

    COMMIT;
  END IF;
END$$

/** Les slugs publiés, pour `generateStaticParams` et le plan du site. */
DROP PROCEDURE IF EXISTS pub_list_article_slugs$$
CREATE PROCEDURE pub_list_article_slugs()
SQL SECURITY DEFINER
BEGIN
  SELECT slug, published_on, updated_at
  FROM article
  WHERE status = 'published'
  ORDER BY published_on DESC;
END$$

DELIMITER ;
