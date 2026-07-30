import Image from "next/image"

import { Halo } from "@/components/primitives/halo"
import { CaseCardSketch } from "@/components/visuals/case-card-sketch"
import { CaseHeroSketch } from "@/components/visuals/case-hero-sketch"
import { CaseSketch } from "@/components/visuals/case-sketch"
import { cn } from "@/lib/utils"

/**
 * Le média de tête, réduit à ce que le rendu consomme.
 *
 * Volontairement structurel et non importé de la couche d'accès : `PublicHeroMedia`
 * côté site et `CaseMediaRef` côté administration s'y conforment tous les deux, et les
 * composants restent ignorants de la provenance du contenu.
 */
export type CoverMedia = {
  url: string
  alt: string
  width: number | null
  height: number | null
}

type CaseCoverProps = {
  /** Le média de tête, ou `undefined` : la fiche retombe alors sur son croquis. */
  media?: CoverMedia
  /**
   * La teinte du halo, pour les cartes seulement.
   *
   * Le hero de la fiche n'en pose pas : sa section en porte déjà un, et la DA n'en admet
   * qu'un par écran. C'est pourquoi cette prop est facultative et non requise pour les
   * trois emplacements.
   */
  halo?: "warm" | "cool"
  accent: "brand" | "info"
  /** L'emplacement, qui décide de la boîte et du cadre. */
  place: "hero" | "card" | "home"
  /** Les cartes larges du hub ont un visuel plus haut. */
  tall?: boolean
}

/**
 * L'image de tête d'une réalisation, ou son croquis à défaut.
 *
 * **Ce composant a comblé un trou de bout en bout.** Le dépôt d'image fonctionnait -
 * MinIO, la ligne `media`, `hero_media_id`, les colonnes rendues par les procédures
 * `pub_*`, `heroMedia` construit par `lib/db/public-cases.ts` - et **rien ne le
 * consommait**. Les trois emplacements dessinaient toujours le croquis CSS. Déposer une
 * couverture n'avait donc aucun effet visible, ce qui ne se voit ni au build, ni au
 * typecheck, ni dans les journaux : la donnée arrivait jusqu'au composant, qui l'ignorait.
 * `CaseSketch` portait d'ailleurs depuis l'origine le commentaire « à remplacer par les
 * captures réelles des produits ».
 *
 * **L'image remplace le contenu de la fenêtre, pas la fenêtre.** Le halo, le cadre
 * flottant, son ombre et son débord restent : c'est la profondeur par les couches que
 * demande la DA, et c'est ce qui fait qu'une capture de site se lit comme un écran allumé
 * plutôt que comme une photo collée dans un cadre. Une couverture posée en pleine boîte
 * aurait fait perdre le geste au profit d'un simple aplat.
 *
 * **Un seul composant pour les trois emplacements**, parce que chaque boîte doit rester
 * exactement celle du croquis qu'elle remplace : une couverture plus haute que le croquis
 * décalerait la mise en page selon qu'une fiche a son image ou non. Les trois jeux de
 * classes sont donc repris tels quels des trois croquis, et se vérifient en les
 * comparant.
 *
 * **Le texte alternatif est vide**, l'administration n'ayant pas de champ pour le saisir.
 * C'est acceptable ici et pas un oubli : la couverture est adjacente au titre et au
 * résumé, qui nomment le projet: une alternative la ferait lire deux fois. Le jour où le
 * champ existe, il suffit qu'il arrive jusqu'à `media.alt`, déjà transmis.
 */
function CaseCover({
  media,
  halo = "warm",
  accent,
  place,
  tall = false,
}: CaseCoverProps) {
  if (!media) {
    if (place === "hero") {
      return <CaseHeroSketch accent={accent} />
    }
    if (place === "home") {
      return <CaseSketch halo={halo} accent={accent} />
    }
    return <CaseCardSketch halo={halo} accent={accent} tall={tall} />
  }

  /*
    Les classes de la boîte et du cadre, reprises des croquis correspondants.

    `hero` : case-hero-sketch, `h-56 md:h-80` et un cadre qui déborde de 10 sous la
    boîte - c'est ce débord qui donne l'impression que la fenêtre continue sous le pli.
    `card` : case-card-sketch, `h-45` ou `h-60`.
    `home` : case-sketch, `min-h-70` et un cadre décalé à droite, hors du cadre.
  */
  const boite = {
    hero: "relative h-56 md:h-80",
    card: cn("relative overflow-hidden bg-inset", tall ? "h-60" : "h-45"),
    home: "relative min-h-70 overflow-hidden bg-inset",
  }[place]

  const cadre = {
    hero: "absolute inset-x-0 top-0 -bottom-10 overflow-hidden rounded-t-lg border border-line bg-raised shadow-3",
    card: "absolute top-7 right-7 -bottom-4 left-7 overflow-hidden rounded-t-md border border-line bg-raised shadow-2",
    home: "absolute top-9 -right-10 -bottom-6 left-8 overflow-hidden rounded-tl-md border border-line bg-raised shadow-3",
  }[place]

  /*
    `sizes` par emplacement, pour ne pas télécharger une image de 1900 px de large dans
    une vignette de 300. Le hero occupe la colonne de lecture, les cartes une moitié de
    grille.
  */
  const sizes = {
    hero: "(min-width: 1240px) 1200px, 100vw",
    card: "(min-width: 768px) 50vw, 100vw",
    home: "(min-width: 1024px) 45vw, 100vw",
  }[place]

  return (
    <div className={boite}>
      {/*
        Pas de halo sur le hero de la fiche : la section en porte déjà un
        (`<Halo variant="hero" />`), et la DA n'en admet qu'un par écran. C'est aussi
        pourquoi `CaseHeroSketch` n'en a pas, à la différence des deux autres croquis.
      */}
      {place === "hero" ? null : <Halo variant={halo} />}
      <div className={cadre}>
        <Image
          src={media.url}
          alt={media.alt}
          fill
          sizes={sizes}
          /*
            `object-top` et non `object-center` : une capture de site commence par son
            hero, qui est ce qu'on veut montrer. Centrer une image de 1900 x 836 dans un
            cadre plus haut que large en couperait le titre.
          */
          className="object-cover object-top"
          // Au-dessus de la ligne de flottaison sur la fiche, et seulement là.
          priority={place === "hero"}
        />
      </div>
    </div>
  )
}

export { CaseCover }
