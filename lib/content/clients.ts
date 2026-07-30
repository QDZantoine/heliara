/**
 * Les références clientes du bandeau de preuve sociale.
 *
 * **Ce fichier a porté huit noms inventés** - Groupe Ardan, Voltéis Industrie, CHU
 * Rhône-Nord et cinq autres - sous le libellé « Ils nous font confiance ». Ils ont été
 * retirés : le studio n'avait alors aucune référence citable, et une section absente
 * vaut mieux qu'une section fausse.
 *
 * **Une seule condition pour ajouter une entrée : l'accord du client pour être cité.**
 * Un logo est une marque, et l'afficher sous « ils nous font confiance » est une
 * affirmation commerciale. L'accord se demande une fois et se garde par écrit.
 *
 * **Ne jamais y mettre les clients d'une marque sœur.** L'AFORP, le Cnam ou Ingetis sont
 * des références de LessonSharing, pas de Heliara : les afficher sous « Ils nous font
 * confiance » cumulerait une affirmation fausse et un usage de marque sans autorisation.
 *
 * Hexceos et LessonSharing elles-mêmes y figurent, en revanche, parce que leurs sites
 * sont des projets Heliara - ce sont donc de vraies références. La nuance tient à ce
 * qu'on a fait pour elles, pas au fait qu'elles appartiennent au même groupe.
 *
 * Le bandeau ne s'affiche pas quand la liste est vide : il n'y a rien à annoncer.
 */

export type Client = {
  /** Le nom, tel qu'il s'écrit. Sert d'alternative textuelle au logo. */
  name: string
  /**
   * Le logo, dans `public/trusts-logos/`.
   *
   * SVG de préférence - net à toutes les tailles, plus léger, et il se désature
   * proprement. À défaut, un PNG à **fond transparent** d'au moins 80 px de haut : la
   * bande l'affiche à 28 px, et un écran à deux fois la densité en réclame 56.
   *
   * Le fond transparent n'est pas une préférence esthétique : la bande pose les logos
   * sur la surface de la page, donc un fichier opaque y dessine un rectangle.
   */
  logo: string
  /**
   * La forme du logo, qui décide de sa hauteur d'affichage.
   *
   * **Une hauteur commune ne suffit pas à équilibrer des formes différentes.** Un
   * logotype horizontal affiché à 28 px de haut couvre 140 px de large ; un logo carré à
   * la même hauteur n'en couvre que 28, et se lit quatre fois plus petit à surface égale.
   * Rabbit Web s'affichait comme un lapin minuscule à côté de « Be Skilled Lab ».
   *
   * `square` donne donc plus de hauteur, pour que les deux pèsent pareil à l'œil.
   */
  shape: "wide" | "square"
  /** Le site du client. Le bandeau ne fait pas de lien : c'est une preuve, pas une pub. */
  site: string
}

/**
 * Les clients, dans l'ordre d'affichage.
 *
 * Les fichiers vivent dans `public/trusts-logos/`. Le `site` n'est pas rendu : il garde
 * la provenance de chaque logo traçable, ce qui compte le jour où il faut redemander une
 * autorisation ou remplacer un fichier.
 *
 * **Deux fichiers du dossier ne sont pas repris.** `logo-BSL.jpg` est le même logo que
 * `bsl-logo.png` en JPEG, donc sans transparence : il dessinerait un rectangle blanc sur
 * la bande. Et `logo-luundi.png` ne fait que 43 px de haut, ce qui est en dessous de ce
 * qu'un écran à deux fois la densité demande pour un affichage à 28 px - il passe, mais
 * il sera le moins net des six.
 */
export const clients: readonly Client[] = [
  {
    name: "MyDigitalSchool",
    shape: "wide",
    logo: "/trusts-logos/logo-mydigitalschool.svg",
    site: "https://www.mydigitalschool.com",
  },
  {
    name: "South Clean",
    shape: "wide",
    logo: "/trusts-logos/logo-southclean.png",
    site: "https://southclean.fr",
  },
  {
    name: "BSL Portage",
    shape: "wide",
    logo: "/trusts-logos/bsl-logo.png",
    site: "https://bslportage.fr",
  },
  {
    name: "Yoginette",
    shape: "wide",
    logo: "/trusts-logos/yoginette-logo.png",
    site: "https://yoginette.fr",
  },
  {
    name: "Rabbit Web",
    shape: "square",
    logo: "/trusts-logos/rabbit-web-logo.png",
    site: "https://rabbitweb.fr",
  },
  {
    name: "Luundi",
    shape: "wide",
    logo: "/trusts-logos/logo-luundi.png",
    site: "https://luundi.fr",
  },
  /*
    Les deux marques du groupe, et ce qui rend leur presence ici legitime.

    Elles figurent dans cette liste **parce que leurs sites sont des projets Heliara** -
    ce qui en fait de vraies references, au meme titre que les six autres. C'est
    different d'afficher les clients d'une marque soeur, qui serait faux et emprunterait
    la caution de quelqu'un d'autre : voir la note en tete de fichier, qui reste
    valable pour l'AFORP, le Cnam ou Ingetis.

    Si l'un des deux sites cessait d'etre un projet Heliara, l'entree sortirait d'ici.
  */
  {
    name: "Hexceos",
    shape: "square",
    logo: "/trusts-logos/logo-hexceos.png",
    site: "https://hexceos.fr",
  },
  {
    name: "LessonSharing",
    shape: "square",
    logo: "/trusts-logos/logo-lessonsharing.png",
    site: "https://lessonsharing.fr",
  },
]
