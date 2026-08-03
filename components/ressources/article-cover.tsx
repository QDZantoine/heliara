import Image from "next/image"

import { ArticleCardSketch } from "@/components/visuals/article-card-sketch"
import type { MediaRef } from "@/lib/media"

type ArticleCoverProps = {
  /** L'image de tête, ou `undefined` : voir le repli propre à chaque emplacement. */
  media?: MediaRef
  /**
   * Où elle s'affiche.
   *
   * `reading` : dans la colonne de lecture de l'article, sous le chapô et l'auteur.
   * `card` : la moitié visuelle de la carte « à la une » du hub des ressources.
   */
  place: "reading" | "card"
}

/**
 * L'image de tête d'un article.
 *
 * **Le champ existait, le rendu non.** Toute la chaîne était en place - la colonne
 * `article.hero_media_id`, les procédures d'écriture, les deux procédures publiques qui
 * joignent `media`, `PublicArticle.heroMedia`, et jusqu'au `MediaDropzone` de l'éditeur.
 * On pouvait donc déposer une image d'article et elle n'apparaissait **nulle part** : ni
 * sur la page, ni sur la carte, ni dans la carte de partage. Même mode de panne que
 * l'image de tête des réalisations - une donnée qui arrive jusqu'au composant et qu'il
 * ignore ne produit aucun signal.
 *
 * **Deux replis différents, et c'est voulu.**
 *
 * - `card` retombe sur `ArticleCardSketch` : la carte « à la une » est une grille à deux
 *   colonnes, sa moitié visuelle ne peut pas être vide sans déséquilibrer le bloc.
 * - `reading` ne rend **rien**. Un article sans image de tête est un article, pas un
 *   article incomplet : lui coller un croquis générique sous le chapô ajouterait du
 *   volume sans rien apprendre, juste avant le premier paragraphe - c'est-à-dire à
 *   l'endroit le plus coûteux de la page.
 *
 * **Traitement plus sobre que celui des réalisations.** `CaseCover` conserve la fenêtre
 * flottante de son croquis, parce qu'il montre une interface livrée et qu'un cadre la
 * fait lire comme un écran. Une image d'article peut être tout autre chose, un schéma
 * comme une photo : un cadre de fenêtre y mentirait sur la nature du contenu. D'où une
 * simple image bordée, aux rayons de la DA.
 */
function ArticleCover({ media, place }: ArticleCoverProps) {
  if (!media) {
    return place === "card" ? <ArticleCardSketch /> : null
  }

  if (place === "card") {
    return (
      <div className="relative min-h-52 overflow-hidden bg-inset md:min-h-75">
        <Image
          src={media.url}
          alt={media.alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          /*
            **Ancré en haut à gauche, et non centré.** Ici la boîte est une moitié de
            grille dont la hauteur vient de la colonne de texte : elle est presque carrée,
            alors qu'une capture de site est large. `object-cover` rogne donc les côtés,
            et un rognage centré coupait le début du titre de la capture - « ne équipe »
            au lieu de « Une équipe », logo compris. Une vignette doit montrer le début du
            contenu, pas son milieu.

            Le rapport réel du fichier ne peut pas servir ici, contrairement à la
            couverture de lecture : la hauteur de cette moitié est imposée par l'autre.
          */
          className="object-cover object-left-top"
        />
      </div>
    )
  }

  /*
    **La boîte prend le rapport du fichier**, et non un 16/9 imposé.

    Un rapport fixe rognait les côtés d'une capture de site - la première version coupait
    le logo du client, ce qui est précisément ce qu'une couverture doit montrer. Comme les
    dimensions sont connues (`media.width` / `media.height`, lues à l'envoi et stockées),
    autant les utiliser : l'image est entière et la boîte reste dimensionnée avant le
    chargement, donc toujours aucun décalage de mise en page.

    Le 16/9 ne sert que de repli, pour un fichier dont les dimensions n'ont pas pu être
    lues. `object-cover` reste en place pour ce seul cas.
  */
  const rapport =
    media.width && media.height ? media.width / media.height : 16 / 9

  return (
    <div
      style={{ aspectRatio: rapport }}
      className="relative overflow-hidden rounded-lg border border-line bg-inset shadow-2"
    >
      <Image
        src={media.url}
        alt={media.alt}
        fill
        sizes="(min-width: 800px) 760px, 100vw"
        // Au-dessus de la ligne de flottaison : elle suit immédiatement le titre.
        priority
        className="object-cover"
      />
    </div>
  )
}

export { ArticleCover }
