-- ============================================================
-- HELIARA - Témoignages clients
--
-- La section « Ils en parlent mieux que nous » de l'accueil, entre la preuve et la
-- demande. L'Architecture UX la prévoit à cet endroit : après les faits, une voix qui
-- n'est pas celle du studio.
--
-- **Pourquoi cette collection administrable, alors qu'elle est vide.** Elle a porté
-- trois verbatims inventés, attribués à des personnes nommées avec leur fonction et
-- leur employeur, et ils ont été retirés : si un homonyme réel existe, le préjudice est
-- réel. La collection est donc repartie de zéro, et c'est précisément ce qui la rend
-- utile ici - un client qui accepte d'être cité doit pouvoir l'être sans qu'on touche au
-- dépôt, faute de quoi la citation attend un déploiement.
--
-- **`status` ne veut pas dire « brouillon », il veut dire « l'auteur a signé ».** C'est
-- le contenu le plus exposé du site : un verbatim attribué à une personne nommée chez
-- une entreprise nommée est une affirmation opposable par deux parties à la fois. Aucune
-- base ne peut vérifier qu'un accord existe, mais elle peut refuser de publier tant
-- qu'on ne l'a pas déclaré - d'où `consent_at` et `consent_note`, et le refus de
-- `publish_testimonial` sans eux.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS testimonial (
  id BINARY(16) NOT NULL,

  /*
    Le verbatim, tel qu'il a été approuvé.

    `VARCHAR(600)` et non `TEXT` : la carte en tient trois de front sur l'accueil, et
    au-delà de trois ou quatre phrases la citation cesse d'être une citation. La borne
    est basse volontairement - un paragraphe rédigé pour le client se reconnaît à sa
    longueur.

    **Les guillemets ne sont pas stockés.** La vue les pose elle-même, en chevrons
    français : les laisser à la saisie donnerait des paires droites, courbes ou absentes
    selon la personne qui recopie l'e-mail du client.
  */
  quote VARCHAR(600) NOT NULL,

  -- L'auteur, sa fonction et son employeur, tels qu'il accepte d'être cité.
  author_name VARCHAR(120) NOT NULL,
  author_role VARCHAR(200) NOT NULL,
  -- Les initiales de la pastille. Deux lettres suffisent, quatre sont la borne.
  initials    VARCHAR(4)   NOT NULL DEFAULT '',

  /*
    La trace de l'accord, et la raison d'être de cet écran.

    `consent_at` est la date à laquelle l'auteur a validé **ce texte** par écrit, et
    `consent_note` dit où cet écrit se trouve - un e-mail daté, un contrat, un fil de
    discussion. Ni l'une ni l'autre n'est affichée sur le site.

    **Deux colonnes plutôt qu'une case à cocher** : une case répond « oui » sans dire
    quand ni où, ce qui ne vaut rien le jour où l'on doit retrouver l'accord. Un champ
    libre non vide oblige à écrire quelque chose de vérifiable.

    Elles sont nullables pour permettre de saisir un verbatim reçu et pas encore validé.
    La publication, elle, les exige toutes les deux.
  */
  consent_at   BIGINT UNSIGNED  NULL,
  consent_note VARCHAR(300) NOT NULL DEFAULT '',

  /*
    La réalisation d'où vient ce témoignage, quand il y en a une.

    Facultatif et non affiché pour l'instant : il sert à retrouver le contexte d'une
    citation, et ouvre la possibilité de lier la carte à la fiche. `SET NULL` plutôt que
    `CASCADE` - supprimer une fiche de réalisation ne doit pas faire disparaître un
    verbatim que son auteur a signé.
  */
  case_study_id BINARY(16) NULL,

  position     INT UNSIGNED NOT NULL DEFAULT 0,
  status       ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at BIGINT UNSIGNED  NULL,
  created_at   BIGINT UNSIGNED NOT NULL,
  updated_at   BIGINT UNSIGNED NOT NULL,
  updated_by   BINARY(16)       NULL,

  PRIMARY KEY (id),
  /*
    Aucune clé unique sur le nom, à la différence des références clientes et de
    l'équipe : la même personne peut témoigner deux fois, sur deux projets, et rien ne
    permet de dire que la seconde citation est une erreur de saisie.
  */
  KEY ix_testimonial_position (position),
  KEY ix_testimonial_status (status),
  CONSTRAINT fk_testimonial_case
    FOREIGN KEY (case_study_id) REFERENCES case_study (id) ON DELETE SET NULL,
  CONSTRAINT fk_testimonial_updated_by
    FOREIGN KEY (updated_by) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;
