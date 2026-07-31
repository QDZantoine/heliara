-- ============================================================
-- HELIARA - L'équipe
--
-- Les personnes de `/a-propos`, dont les associés que `/contact` présente sous « Vos
-- interlocuteurs ».
--
-- **Une seule table pour deux listes.** Le contenu statique en portait deux, `partners`
-- et `team`, la seconde étant `[...partners, ...]`. Les dédoubler en base aurait rendu
-- possible qu'une personne figure dans l'une et pas dans l'autre, ou deux fois avec des
-- textes divergents. `is_partner` distingue les deux usages sans dupliquer la personne.
--
-- **Ce que ce drapeau engage.** La page de contact promet une réponse d'un associé sous
-- 48 heures et affiche cette liste. Le lever pour quelqu'un qui ne répond pas aux
-- messages rendrait la promesse fausse - c'est une affirmation, pas un rang honorifique.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS team_member (
  id       BINARY(16)   NOT NULL,
  name     VARCHAR(120) NOT NULL,
  -- La fonction, telle qu'elle s'écrit sur la carte.
  role     VARCHAR(160) NOT NULL,
  -- Les initiales de la pastille. Deux lettres suffisent, quatre sont la borne.
  initials VARCHAR(4)   NOT NULL DEFAULT '',
  -- Le parcours, en trois ou quatre phrases : ce qui rend le rôle crédible.
  bio      TEXT         NOT NULL,

  /*
    Les deux portraits, et pourquoi les deux sont nécessaires.

    Aucun ne tient sur les deux thèmes : un détourage sur blanc posé sur une carte encre
    devient un pavé lumineux, et le fond orange sur une carte claire écrase tout le reste
    de la page. La carte affiche donc le premier en thème clair, le second en sombre.

    **Nullables pour permettre un brouillon**, exigés à la publication : une carte sans
    portrait en thème sombre montrerait un trou, et le défaut ne se verrait qu'en
    basculant le thème. La procédure `publish_team_member` refuse s'il en manque un.
  */
  photo_light_media_id BINARY(16) NULL,
  photo_dark_media_id  BINARY(16) NULL,

  /*
    **Aucune colonne `accent`, et c'est une décision.**

    La teinte de la pastille était un champ du contenu statique, avec trois valeurs :
    orange de marque, bleu d'information, encre. Or la DA n'autorise **qu'un seul geste
    orange par écran** : sur une grille de cartes, il n'existe donc qu'une seule
    répartition correcte, et les données existantes la suivaient exactement - orange,
    bleu, encre, dans l'ordre d'affichage.

    Un champ dont une seule valeur est juste n'est pas un réglage, c'est une occasion de
    se tromper. La teinte est donc **déduite de la position** à la lecture, ce qui rend
    deux oranges impossibles par construction plutôt que par vigilance.
  */

  -- Les associés, ceux qui répondent aux messages de contact. Voir l'en-tête.
  is_partner   TINYINT(1)   NOT NULL DEFAULT 0,

  position     INT UNSIGNED NOT NULL DEFAULT 0,
  status       ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at BIGINT UNSIGNED  NULL,
  created_at   BIGINT UNSIGNED NOT NULL,
  updated_at   BIGINT UNSIGNED NOT NULL,
  updated_by   BINARY(16)       NULL,

  PRIMARY KEY (id),
  -- Le nom identifie la personne : deux fiches du même nom seraient une erreur de saisie,
  -- jamais une intention.
  UNIQUE KEY uq_member_name (name),
  KEY ix_member_position (position),
  KEY ix_member_status (status),
  CONSTRAINT fk_member_photo_light
    FOREIGN KEY (photo_light_media_id) REFERENCES media (id) ON DELETE SET NULL,
  CONSTRAINT fk_member_photo_dark
    FOREIGN KEY (photo_dark_media_id) REFERENCES media (id) ON DELETE SET NULL,
  CONSTRAINT fk_member_updated_by
    FOREIGN KEY (updated_by) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;

/*
  Les spécialités, en puces sur la carte.

  Une table enfant et non un JSON, comme les signes de la section sur-mesure : la règle du
  projet réserve le JSON aux charges d'un bloc, et une spécialité se réordonne. Quatre au
  plus se lisent ; la procédure ne l'impose pas, l'écran le rappelle.
*/
CREATE TABLE IF NOT EXISTS team_member_skill (
  id        BINARY(16)   NOT NULL,
  member_id BINARY(16)   NOT NULL,
  label     VARCHAR(120) NOT NULL,
  position  INT UNSIGNED NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  KEY ix_skill_member (member_id, position),
  CONSTRAINT fk_skill_member
    FOREIGN KEY (member_id) REFERENCES team_member (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;
