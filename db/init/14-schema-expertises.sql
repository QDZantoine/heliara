-- ============================================================
-- HELIARA - Expertises : familles et services
--
-- Deux niveaux. Une **famille** regroupe des services et porte l'entrée de nav ;
-- un **service** est une page. Le hub affiche les services groupés par famille.
--
-- **Un défaut de conception corrigé au passage.** Le contenu statique fait pointer
-- chaque entrée de nav vers `/expertises/<slug de la famille>`, et cela ne
-- fonctionne que parce que trois services portent par coïncidence le même slug que
-- leur famille. Rien ne le garantissait : renommer un service cassait la nav en
-- silence. La famille désigne donc désormais **explicitement** le service vers
-- lequel sa nav mène, par `nav_service_slug`, et une contrainte l'y oblige.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS expertise_family (
  id       BINARY(16)   NOT NULL,
  slug     VARCHAR(120) NOT NULL,
  -- Le libellé court, celui de la nav. Le titre peut être plus long.
  label    VARCHAR(120) NOT NULL,
  title    VARCHAR(200) NOT NULL,
  summary  TEXT         NOT NULL,
  -- Étiquette courte du croquis : « saas », « web », « ia · api ».
  tag      VARCHAR(40)  NOT NULL DEFAULT '',
  halo     ENUM('warm', 'cool') NOT NULL DEFAULT 'warm',

  /*
    Les trois barres du croquis d'illustration, en pourcentage de largeur.

    Trois colonnes nommées plutôt qu'un tableau JSON : elles sont exactement trois,
    ne le seront jamais autrement - le croquis en dessine trois - et une colonne
    entière se contraint, là où un JSON se contenterait d'être valide.
  */
  sketch_1 TINYINT UNSIGNED NOT NULL DEFAULT 60 CHECK (sketch_1 BETWEEN 1 AND 100),
  sketch_2 TINYINT UNSIGNED NOT NULL DEFAULT 45 CHECK (sketch_2 BETWEEN 1 AND 100),
  sketch_3 TINYINT UNSIGNED NOT NULL DEFAULT 75 CHECK (sketch_3 BETWEEN 1 AND 100),

  /*
    Le service vers lequel mène l'entrée de nav de cette famille.

    Un slug et non une clé étrangère : la nav doit pouvoir désigner un service que
    l'on est en train d'écrire, et une contrainte référentielle empêcherait de
    réordonner ou de renommer sans casser. La procédure vérifie l'existence à
    l'enregistrement, ce qui donne un message clair plutôt qu'une erreur de pilote.
  */
  nav_service_slug VARCHAR(120) NULL,

  position INT UNSIGNED NOT NULL DEFAULT 0,
  created_at BIGINT UNSIGNED NOT NULL,
  updated_at BIGINT UNSIGNED NOT NULL,
  updated_by BINARY(16)       NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_family_slug (slug),
  KEY ix_family_position (position),
  CONSTRAINT fk_family_updated_by
    FOREIGN KEY (updated_by) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS expertise_service (
  id        BINARY(16)   NOT NULL,
  slug      VARCHAR(120) NOT NULL,
  -- La famille par sa clé : ici la relation est structurelle, un service sans
  -- famille n'a pas de place dans le hub.
  family_id BINARY(16)   NOT NULL,
  title     VARCHAR(200) NOT NULL,
  -- Une phrase : à qui ça sert et pourquoi.
  tagline   TEXT         NOT NULL,
  -- Le problème du visiteur, en tête de page.
  problem   TEXT         NOT NULL,
  -- Étude de cas illustrant ce service. Un slug, pour la même raison que ci-dessus.
  related_case_slug VARCHAR(120) NULL,
  cta_title VARCHAR(160) NOT NULL DEFAULT '',

  position     INT UNSIGNED NOT NULL DEFAULT 0,
  status       ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at BIGINT UNSIGNED  NULL,
  created_at   BIGINT UNSIGNED NOT NULL,
  updated_at   BIGINT UNSIGNED NOT NULL,
  created_by   BINARY(16)       NULL,
  updated_by   BINARY(16)       NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_service_slug (slug),
  KEY ix_service_family (family_id, position),
  KEY ix_service_status (status),
  -- `RESTRICT` : supprimer une famille qui porte encore des services doit échouer,
  -- pas emporter des pages publiées.
  CONSTRAINT fk_service_family
    FOREIGN KEY (family_id) REFERENCES expertise_family (id) ON DELETE RESTRICT,
  CONSTRAINT fk_service_created_by
    FOREIGN KEY (created_by) REFERENCES `user` (id) ON DELETE SET NULL,
  CONSTRAINT fk_service_updated_by
    FOREIGN KEY (updated_by) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- ------------------------------------------------------------
-- Collections d'un service
-- ------------------------------------------------------------
-- Trois tables sur le même moule que celles des réalisations : ce sont des entités
-- - un livrable, un choix technique, une objection - avec un ordre, que l'on veut
-- pouvoir compter et contraindre.

CREATE TABLE IF NOT EXISTS expertise_deliverable (
  id         BINARY(16)   NOT NULL,
  service_id BINARY(16)   NOT NULL,
  title      VARCHAR(200) NOT NULL,
  text       TEXT         NOT NULL,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_deliverable_service (service_id, position),
  CONSTRAINT fk_deliverable_service
    FOREIGN KEY (service_id) REFERENCES expertise_service (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS expertise_tech_choice (
  id         BINARY(16)   NOT NULL,
  service_id BINARY(16)   NOT NULL,
  title      VARCHAR(200) NOT NULL,
  text       TEXT         NOT NULL,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_tech_service (service_id, position),
  CONSTRAINT fk_tech_service
    FOREIGN KEY (service_id) REFERENCES expertise_service (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS expertise_faq (
  id         BINARY(16)   NOT NULL,
  service_id BINARY(16)   NOT NULL,
  question   VARCHAR(300) NOT NULL,
  answer     TEXT         NOT NULL,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_faq_service (service_id, position),
  CONSTRAINT fk_faq_service
    FOREIGN KEY (service_id) REFERENCES expertise_service (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- ------------------------------------------------------------
-- « Pourquoi du sur-mesure ? »
--
-- La section qui qualifie le visiteur plutôt que de lui vendre la prestation :
-- les signes qui indiquent qu'une plateforme spécifique se justifie, et la phrase
-- qui admet le cas contraire.
--
-- Deux colonnes de texte sur le service portent le chapô et la conclusion, parce
-- qu'il n'y en a qu'un de chaque et qu'une table pour une ligne unique ne
-- s'ordonne ni ne se requête. Les signes, eux, sont une liste ordonnée : ils ont
-- leur table, comme les livrables et les objections.
--
-- `ALTER TABLE` échoue si les colonnes existent déjà, et c'est sans conséquence :
-- `db/migrate.sh` signale l'erreur et poursuit, comme pour `08-schema-media.sql`.
-- ------------------------------------------------------------

ALTER TABLE expertise_service
  ADD COLUMN why_custom_lead    TEXT NOT NULL DEFAULT '' AFTER problem,
  ADD COLUMN why_custom_closing TEXT NOT NULL DEFAULT '' AFTER why_custom_lead;

CREATE TABLE IF NOT EXISTS expertise_why_custom (
  id         BINARY(16)   NOT NULL,
  service_id BINARY(16)   NOT NULL,
  text       VARCHAR(300) NOT NULL,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_why_service (service_id, position),
  CONSTRAINT fk_why_service
    FOREIGN KEY (service_id) REFERENCES expertise_service (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;
