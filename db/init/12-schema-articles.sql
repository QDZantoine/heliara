-- ============================================================
-- HELIARA - Ressources : articles
--
-- Le modèle reprend le type `Article` de `lib/content/articles.ts`, corps en blocs
-- typés compris. Les blocs restent des blocs et ne deviennent pas du HTML : c'est
-- ce qui permet à `callout` de porter un chapô distinct de son texte, et à
-- `numbered` d'afficher une grille numérotée. Un unique champ HTML ne saurait
-- exprimer ni l'un ni l'autre.
--
-- **L'exception JSON assumée.** La règle du projet est « une table par collection
-- enfant, jamais un JSON opaque ». Elle vise les collections dont les éléments sont
-- des entités - un chapitre, un résultat - que l'on veut requêter, contraindre et
-- réordonner. Les entrées d'un bloc `numbered` n'en sont pas : elles n'ont pas
-- d'identité, ne sont jamais lues séparément du bloc qui les porte, et disparaissent
-- avec lui. Elles sont la **charge** d'un bloc, pas une collection. D'où
-- `article_block.items`, en JSON validé.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS article (
  id               BINARY(16)   NOT NULL,
  slug             VARCHAR(120) NOT NULL,
  category         ENUM('Guide', 'Analyse', 'Retour d''expérience', 'Veille')
                                NOT NULL DEFAULT 'Guide',
  title            VARCHAR(300) NOT NULL,
  -- Chapô : la promesse de l'article, en une phrase ou deux.
  lead             TEXT         NOT NULL,

  author           VARCHAR(120) NOT NULL,
  author_role      VARCHAR(160) NOT NULL,
  author_initials  VARCHAR(4)   NOT NULL,

  /*
    Deux dates, et ce n'est pas une redondance.

    `published_on` est la date de rédaction, en ISO : elle sert au tri, aux
    métadonnées et au plan du site. `date_label` est ce qui s'affiche, en français
    - « 12 juillet 2026 ». Les dériver l'une de l'autre en SQL demanderait de
    formater une date en français dans MariaDB, ce qui dépend de la locale du
    serveur ; les stocker toutes deux laisse la formulation à la personne qui écrit.

    Ni l'une ni l'autre n'est un `BIGINT` : ce ne sont pas des instants mais des
    jours, et une date de publication d'article n'a pas d'heure. `published_at`,
    lui, est bien un instant Unix - celui de la mise en ligne.
  */
  published_on     DATE             NULL,
  date_label       VARCHAR(60)  NOT NULL DEFAULT '',

  reading_time     VARCHAR(20)  NOT NULL DEFAULT '',
  featured         TINYINT(1)   NOT NULL DEFAULT 0,

  -- Rebond de fin d'article : aucune impasse. Le slug plutôt qu'une clé étrangère,
  -- pour qu'un article puisse pointer une réalisation encore en brouillon sans
  -- empêcher sa propre publication.
  related_case_slug VARCHAR(120)    NULL,

  hero_media_id    BINARY(16)       NULL,

  position         INT UNSIGNED NOT NULL DEFAULT 0,
  status           ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at     BIGINT UNSIGNED  NULL,
  created_at       BIGINT UNSIGNED NOT NULL,
  updated_at       BIGINT UNSIGNED NOT NULL,
  created_by       BINARY(16)       NULL,
  updated_by       BINARY(16)       NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_article_slug (slug),
  KEY ix_article_status (status, published_on),
  KEY ix_article_category (category),
  KEY ix_article_featured (featured),
  CONSTRAINT fk_article_created_by
    FOREIGN KEY (created_by) REFERENCES `user` (id) ON DELETE SET NULL,
  CONSTRAINT fk_article_updated_by
    FOREIGN KEY (updated_by) REFERENCES `user` (id) ON DELETE SET NULL,
  CONSTRAINT fk_article_hero_media
    FOREIGN KEY (hero_media_id) REFERENCES media (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS article_block (
  id         BINARY(16)   NOT NULL,
  article_id BINARY(16)   NOT NULL,
  kind       ENUM('paragraph', 'heading', 'callout', 'numbered') NOT NULL,
  -- Le corps du bloc. Vide pour `numbered`, qui porte tout dans `items`.
  text       TEXT             NULL,
  -- Chapô d'un `callout` : la phrase mise en exergue avant son explication.
  lead       TEXT             NULL,
  -- Entrées d'un `numbered` : `[{"num","title","text"}]`. Voir la note d'en-tête.
  items      LONGTEXT         NULL
             CHECK (items IS NULL OR JSON_VALID(items)),
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_block_article (article_id, position),
  CONSTRAINT fk_block_article
    FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- ------------------------------------------------------------
-- Comptage des vues
-- ------------------------------------------------------------
-- Deux niveaux, et le second n'est pas un luxe : un total depuis toujours est une
-- métrique faible - il ne dit pas si l'article est lu **aujourd'hui**. Le total
-- vit sur `article` parce que la liste d'administration l'affiche pour chaque
-- ligne et qu'un `SUM` par ligne serait payé à chaque chargement ; le détail par
-- jour vit à part, où il peut servir une tendance sans alourdir la fiche.
--
-- Contrepartie assumée du total dénormalisé : il faut l'incrémenter en même temps
-- que la ligne du jour. Les deux écritures sont dans la même procédure et la même
-- transaction, donc elles ne peuvent pas divorcer.

ALTER TABLE article
  ADD COLUMN view_count BIGINT UNSIGNED NOT NULL DEFAULT 0
  AFTER published_at;

CREATE TABLE IF NOT EXISTS article_view_daily (
  article_id BINARY(16)      NOT NULL,
  -- Le jour, pas l'instant : c'est une agrégation, pas un évènement.
  day        DATE            NOT NULL,
  views      BIGINT UNSIGNED NOT NULL DEFAULT 0,
  -- Clé composée et non clé technique : il n'y a qu'une ligne par article et par
  -- jour, et c'est cette unicité qui rend l'`ON DUPLICATE KEY UPDATE` possible.
  PRIMARY KEY (article_id, day),
  KEY ix_view_day (day),
  CONSTRAINT fk_view_article
    FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;
