-- ============================================================
-- HELIARA - Références clientes
--
-- Le bandeau « Ils nous font confiance » de l'accueil. Une table plate : un nom, un
-- ou deux logos, une forme, un site.
--
-- **Pourquoi cette collection avant les autres.** C'est le contenu non administrable
-- qui change le plus souvent - un client de plus, un logo refait, une autorisation
-- retirée - et le seul dont la modification demandait jusqu'ici de toucher au dépôt
-- et de redéployer pour une image.
--
-- **`status` ne veut pas dire « brouillon » ici, il veut dire « pas encore
-- autorisé ».** La seule condition pour afficher une référence est l'accord écrit du
-- client : un logo est une marque, et l'afficher sous « ils nous font confiance » est
-- une affirmation commerciale. Une entrée saisie mais pas encore autorisée reste donc
-- `draft`, visible dans l'administration et absente du site.
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS client_reference (
  id   BINARY(16)   NOT NULL,
  name VARCHAR(120) NOT NULL,

  /*
    Le logo, et sa seconde variante.

    Deux colonnes plutôt qu'une, parce qu'une **marque monochrome** a besoin des deux :
    un logo noir disparaît sur l'encre, un logo blanc sur le blanc. Les deux images
    sont rendues et le CSS en masque une - le thème est une classe sur `<html>`, donc
    échanger la source demanderait du JavaScript.

    `logo_dark_media_id` est nul dans le cas courant : un logo en couleur se lit sur
    les deux fonds. Ne jamais fabriquer la seconde variante en inversant la première,
    `invert` produisant une couleur que la marque n'a pas.

    `ON DELETE RESTRICT` sur la variante claire : supprimer le média d'une référence
    affichée la laisserait sans logo, donc sans rien à montrer. `SET NULL` sur la
    sombre, dont l'absence est un cas normal.
  */
  logo_media_id      BINARY(16) NOT NULL,
  logo_dark_media_id BINARY(16)     NULL,

  /*
    La forme du fichier, qui décide de sa hauteur d'affichage.

    Une hauteur commune ne suffit pas à équilibrer des formes différentes : un
    logotype horizontal à 28 px de haut couvre 140 px de large, un carré n'en couvre
    que 28 - quatre fois moins de surface pour la même consigne. `square` reçoit donc
    plus de hauteur.

    **Elle suit le fichier, pas la marque.** Hexceos est passé de `square` à `wide` en
    changeant de fichier : le PNG était un carré de 96 px, le SVG fait 774 x 242.
  */
  shape ENUM('wide', 'square') NOT NULL DEFAULT 'wide',

  /*
    Le site du client. Il n'est pas rendu - la bande ne fait pas de lien, c'est une
    preuve et non une publicité - mais il garde la provenance de chaque logo
    traçable, ce qui compte le jour où il faut redemander une autorisation ou
    remplacer un fichier.
  */
  site VARCHAR(300) NOT NULL DEFAULT '',

  position     INT UNSIGNED NOT NULL DEFAULT 0,
  status       ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at BIGINT UNSIGNED  NULL,
  created_at   BIGINT UNSIGNED NOT NULL,
  updated_at   BIGINT UNSIGNED NOT NULL,
  updated_by   BINARY(16)       NULL,

  PRIMARY KEY (id),
  -- Le nom identifie la référence : deux entrées du même client afficheraient deux
  -- fois le même logo dans la bande.
  UNIQUE KEY uq_client_name (name),
  KEY ix_client_position (position),
  KEY ix_client_status (status),
  CONSTRAINT fk_client_logo
    FOREIGN KEY (logo_media_id) REFERENCES media (id) ON DELETE RESTRICT,
  CONSTRAINT fk_client_logo_dark
    FOREIGN KEY (logo_dark_media_id) REFERENCES media (id) ON DELETE SET NULL,
  CONSTRAINT fk_client_updated_by
    FOREIGN KEY (updated_by) REFERENCES `user` (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_uca1400_ai_ci;
