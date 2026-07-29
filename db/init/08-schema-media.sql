-- ============================================================
-- HELIARA - Médias
--
-- La base ne stocke que des métadonnées : l'octet vit dans MinIO. Le téléversement
-- se fait par URL présignée, donc le fichier ne traverse jamais l'application.
--
-- `checksum` est l'empreinte SHA-256 du contenu, calculée par le navigateur avant
-- l'envoi. Elle sert à reconnaître un fichier déjà présent plutôt qu'à en stocker
-- deux copies, et à vérifier qu'un téléversement n'a pas été tronqué.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS media (
  id            BINARY(16)      NOT NULL,
  -- Clé de l'objet dans le seau, préfixe compris : `public/2026/<id>.webp`.
  object_key    VARCHAR(400)    NOT NULL,
  bucket        VARCHAR(80)     NOT NULL,
  mime_type     VARCHAR(120)    NOT NULL,
  byte_size     BIGINT UNSIGNED NOT NULL,
  width         INT UNSIGNED        NULL,
  height        INT UNSIGNED        NULL,
  -- Texte alternatif. Vide et non NULL par défaut : une image décorative porte
  -- légitimement un alt vide, et l'on veut distinguer « décoratif » de « oublié ».
  alt           VARCHAR(300)    NOT NULL DEFAULT '',
  original_name VARCHAR(300)    NOT NULL,
  checksum      CHAR(64)            NULL,
  -- État du téléversement. Une ligne est créée avant l'envoi, puis confirmée :
  -- un envoi abandonné laisse une ligne `pending`, repérable et purgeable.
  status        ENUM('pending', 'ready') NOT NULL DEFAULT 'pending',
  created_at    BIGINT UNSIGNED NOT NULL,
  created_by    BINARY(16)          NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_key (object_key),
  KEY ix_media_checksum (checksum),
  KEY ix_media_created (created_at),
  KEY ix_media_status (status),
  CONSTRAINT fk_media_created_by
    FOREIGN KEY (created_by) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- ------------------------------------------------------------
-- Galerie d'une réalisation
-- ------------------------------------------------------------
-- `role` distingue le visuel de hero des images de galerie. Le hero pourrait vivre
-- dans `case_study.hero_media_id` seul, mais le passer aussi par cette table
-- permet de lui donner une légende comme aux autres.
CREATE TABLE IF NOT EXISTS case_media (
  id       BINARY(16)   NOT NULL,
  case_id  BINARY(16)   NOT NULL,
  media_id BINARY(16)   NOT NULL,
  role     ENUM('hero', 'gallery') NOT NULL DEFAULT 'gallery',
  caption  VARCHAR(300)     NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_case_media (case_id, media_id, role),
  KEY ix_case_media_case (case_id, position),
  CONSTRAINT fk_case_media_case
    FOREIGN KEY (case_id) REFERENCES case_study (id) ON DELETE CASCADE,
  -- `RESTRICT` et non `CASCADE` : supprimer un média encore utilisé doit échouer
  -- plutôt que de vider une galerie sans le dire.
  CONSTRAINT fk_case_media_media
    FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE RESTRICT
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- La contrainte sur `case_study.hero_media_id` n'a pu être posée qu'ici, la table
-- `media` n'existant pas encore au moment du 06.
ALTER TABLE case_study
  ADD CONSTRAINT fk_case_hero_media
  FOREIGN KEY (hero_media_id) REFERENCES media (id) ON DELETE SET NULL;
