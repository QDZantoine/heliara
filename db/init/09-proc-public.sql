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

DELIMITER ;
