/**
 * La référence d'un média, réduite à ce qu'un rendu consomme.
 *
 * **Écrite ici plutôt que dans un composant** parce que trois formes s'y conforment sans
 * se connaître : `PublicHeroMedia` du site public, `CaseMediaRef` de l'administration, et
 * l'entrée de galerie. Les vues restent ignorantes de la provenance du contenu, ce qui
 * est la règle que suivent déjà `CaseStudyView` et `ArticleReadingView` en décrivant leur
 * propre type d'entrée.
 *
 * `width` et `height` sont nullables : une image envoyée dont on n'a pas pu lire les
 * dimensions reste affichable, et c'est `fill` qui la dimensionne.
 */
export type MediaRef = {
  url: string
  alt: string
  width: number | null
  height: number | null
}

/** Une image de galerie : une référence, plus sa légende facultative. */
export type MediaWithCaption = MediaRef & { caption?: string }
