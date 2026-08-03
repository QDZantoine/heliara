-- ============================================================
-- HELIARA - Schéma : comptes, sessions, journal d'audit
--
-- Conventions, valables pour tout le schéma :
--   - identifiants en BINARY(16), produits par GenerateKey() (UUID v7)
--   - dates en BIGINT UNSIGNED, toujours des UNIX_TIMESTAMP(). Jamais de
--     DATETIME : aucun fuseau à trancher, comparaison directe en JavaScript
--   - colonnes en snake_case
--   - utf8mb4 et collation ai_ci : la recherche ignore accents et casse
--
-- Aucun secret en clair : la base ne voit que des empreintes. Le mot de passe
-- est haché en argon2id par l'application, les jetons de session et de
-- réinitialisation en SHA-256.
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Comptes d'administration
-- ------------------------------------------------------------
-- `role` est un ENUM dès maintenant alors qu'un seul rôle est utilisé :
-- distinguer un éditeur d'un administrateur plus tard ne coûtera qu'un ALTER,
-- au lieu d'une migration de données.
CREATE TABLE IF NOT EXISTS `user` (
  id                BINARY(16)    NOT NULL,
  email             VARCHAR(180)  NOT NULL,
  password_hash     VARCHAR(255)  NOT NULL,
  display_name      VARCHAR(120)  NOT NULL,
  role              ENUM('admin', 'editor') NOT NULL DEFAULT 'admin',
  -- Réservé : la vérification d'adresse n'est pas requise pour un compte créé
  -- en ligne de commande, elle le deviendra si l'on ouvre une invitation.
  email_verified    TINYINT(1)    NOT NULL DEFAULT 0,
  verify_token_hash CHAR(64)          NULL,
  verify_expires_at BIGINT UNSIGNED   NULL,
  reset_token_hash  CHAR(64)          NULL,
  reset_expires_at  BIGINT UNSIGNED   NULL,
  -- Suspendre plutôt que supprimer : le journal d'audit garde ses références.
  suspended_at      BIGINT UNSIGNED   NULL,
  last_login_at     BIGINT UNSIGNED   NULL,
  created_at        BIGINT UNSIGNED NOT NULL,
  updated_at        BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_email (email),
  KEY ix_user_reset (reset_token_hash),
  KEY ix_user_verify (verify_token_hash)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- ------------------------------------------------------------
-- Sessions
-- ------------------------------------------------------------
-- Seule l'empreinte du jeton est stockée : une fuite de la table ne permet pas
-- d'usurper une session. `ON DELETE CASCADE` fait disparaître les sessions avec
-- leur compte.
CREATE TABLE IF NOT EXISTS session (
  id            BINARY(16)      NOT NULL,
  user_id       BINARY(16)      NOT NULL,
  token_hash    CHAR(64)        NOT NULL,
  expires_at    BIGINT UNSIGNED NOT NULL,
  ip            VARCHAR(45)         NULL,
  user_agent    VARCHAR(255)        NULL,
  created_at    BIGINT UNSIGNED NOT NULL,
  last_seen_at  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_token (token_hash),
  KEY ix_session_user (user_id),
  KEY ix_session_expires (expires_at),
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

-- ------------------------------------------------------------
-- Journal d'audit
-- ------------------------------------------------------------
-- Toute écriture y laisse une trace : qui, quoi, sur quelle ressource, avec
-- l'ancienne et la nouvelle valeur. `actor_id` est `SET NULL` plutôt que
-- `CASCADE` : supprimer un compte ne doit pas effacer l'historique de ses actes.
CREATE TABLE IF NOT EXISTS audit_log (
  id            BINARY(16)      NOT NULL,
  actor_id      BINARY(16)          NULL,
  action        VARCHAR(80)     NOT NULL,
  resource_type VARCHAR(60)     NOT NULL,
  resource_id   BINARY(16)          NULL,
  old_value     LONGTEXT            NULL CHECK (old_value IS NULL OR JSON_VALID(old_value)),
  new_value     LONGTEXT            NULL CHECK (new_value IS NULL OR JSON_VALID(new_value)),
  ip            VARCHAR(45)         NULL,
  created_at    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY ix_audit_actor (actor_id),
  KEY ix_audit_resource (resource_type, resource_id),
  KEY ix_audit_created (created_at),
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_id) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;
