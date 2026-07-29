-- ============================================================
-- HELIARA - Réalisations
--
-- Le modèle reprend exactement le type `CaseStudy` de `lib/content/cases.ts` :
-- la bascule du site public ne changera pas la forme des données, seulement leur
-- source.
--
-- **Une table par collection enfant, jamais un JSON opaque.** Un chapitre, un
-- résultat, une leçon sont des lignes : chaque champ reste requêtable,
-- contraignable et réordonnable. Un tableau JSON serait plus court à écrire et
-- impossible à interroger.
--
-- Le témoignage fait exception et vit en colonnes sur `case_study` : il est en
-- relation un à un, une table de quatre colonnes pour une seule ligne
-- n'apporterait qu'une jointure.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS case_study (
  id              BINARY(16)      NOT NULL,
  slug            VARCHAR(120)    NOT NULL,
  sector          VARCHAR(80)     NOT NULL,
  year            VARCHAR(9)      NOT NULL,
  -- Étiquette du hero : secteur · type de produit.
  badge           VARCHAR(160)    NOT NULL,
  -- Titre court, pour les cartes de listing.
  title           VARCHAR(200)    NOT NULL,
  -- Titre du hero : le résultat est dans le titre.
  hero_title      VARCHAR(300)    NOT NULL,
  -- Résumé long, carte de l'accueil.
  teaser          TEXT            NOT NULL,
  -- Résumé court, carte du hub.
  summary         TEXT            NOT NULL,
  figure          VARCHAR(40)     NOT NULL,
  measure         VARCHAR(160)    NOT NULL,
  halo            ENUM('warm', 'cool')   NOT NULL DEFAULT 'warm',
  accent          ENUM('brand', 'info')  NOT NULL DEFAULT 'brand',
  -- Mis en avant sur l'accueil.
  featured        TINYINT(1)      NOT NULL DEFAULT 0,
  -- Carte large dans la grille du hub.
  wide            TINYINT(1)      NOT NULL DEFAULT 0,
  results_label   VARCHAR(160)    NOT NULL DEFAULT 'Résultats',

  -- Témoignage, un à un et facultatif.
  testimonial_quote     TEXT          NULL,
  testimonial_name      VARCHAR(120)  NULL,
  testimonial_role      VARCHAR(160)  NULL,
  testimonial_initials  VARCHAR(4)    NULL,

  -- Média de hero. La table `media` arrive à l'étape suivante : la contrainte de
  -- clé étrangère sera ajoutée par migration à ce moment-là, pas maintenant, pour
  -- que ce fichier reste jouable seul.
  hero_media_id   BINARY(16)          NULL,

  -- Ordre d'affichage dans la grille. Volontairement espacé de 10 en 10 à la
  -- création : insérer entre deux voisins ne demande alors pas de tout renuméroter.
  position        INT UNSIGNED    NOT NULL DEFAULT 0,
  status          ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at    BIGINT UNSIGNED     NULL,

  created_at      BIGINT UNSIGNED NOT NULL,
  updated_at      BIGINT UNSIGNED NOT NULL,
  created_by      BINARY(16)          NULL,
  updated_by      BINARY(16)          NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_case_slug (slug),
  KEY ix_case_status (status, position),
  KEY ix_case_featured (featured),
  KEY ix_case_sector (sector),
  CONSTRAINT fk_case_created_by
    FOREIGN KEY (created_by) REFERENCES `user` (id) ON DELETE SET NULL,
  CONSTRAINT fk_case_updated_by
    FOREIGN KEY (updated_by) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- ------------------------------------------------------------
-- Collections enfants
-- ------------------------------------------------------------
-- Toutes suivent le même moule : clé étrangère en `ON DELETE CASCADE`, colonne
-- `position` pour l'ordre, et un index sur (case_id, position). Supprimer une
-- réalisation emporte donc tout ce qui la compose, sans procédure de nettoyage.

CREATE TABLE IF NOT EXISTS case_chapter (
  id       BINARY(16)   NOT NULL,
  case_id  BINARY(16)   NOT NULL,
  -- Numéro affiché, « 01 » et non 1 : c'est une étiquette, pas un compteur.
  num      VARCHAR(4)   NOT NULL,
  title    VARCHAR(200) NOT NULL,
  text     TEXT         NOT NULL,
  -- Encadré de décision structurante, filet orange à gauche.
  callout  TEXT             NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_chapter_case (case_id, position),
  CONSTRAINT fk_chapter_case
    FOREIGN KEY (case_id) REFERENCES case_study (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS case_result (
  id       BINARY(16)   NOT NULL,
  case_id  BINARY(16)   NOT NULL,
  value    VARCHAR(40)  NOT NULL,
  label    VARCHAR(200) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_result_case (case_id, position),
  CONSTRAINT fk_result_case
    FOREIGN KEY (case_id) REFERENCES case_study (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS case_meta (
  id       BINARY(16)   NOT NULL,
  case_id  BINARY(16)   NOT NULL,
  label    VARCHAR(120) NOT NULL,
  value    VARCHAR(300) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_meta_case (case_id, position),
  CONSTRAINT fk_meta_case
    FOREIGN KEY (case_id) REFERENCES case_study (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS case_lesson (
  id       BINARY(16)   NOT NULL,
  case_id  BINARY(16)   NOT NULL,
  text     TEXT         NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_lesson_case (case_id, position),
  CONSTRAINT fk_lesson_case
    FOREIGN KEY (case_id) REFERENCES case_study (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;
