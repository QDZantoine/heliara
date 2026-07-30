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
 * **Ne jamais y mettre une marque sœur.** Hexceos et LessonSharing ne sont pas des
 * clientes de Heliara : ce sont des marques du même groupe. Elles ont leur place dans
 * `siblingBrands` ci-dessous, sous un libellé qui dit ce qu'elles sont, et l'endossement
 * de groupe vit de toute façon dans le pied de page et sur `/le-groupe`.
 *
 * Le bandeau ne s'affiche pas quand la liste est vide : il n'y a rien à annoncer.
 */

export type Client = {
  /** Le nom, tel qu'il s'écrit. Sert d'alternative textuelle au logo. */
  name: string
  /**
   * Le logo, dans `public/logos/clients/`.
   *
   * SVG de préférence - il reste net à toutes les tailles et pèse moins. À défaut, un
   * PNG à fond transparent d'au moins 240 px de haut.
   */
  logo: string
  /** Le site du client. Le bandeau ne fait pas de lien : c'est une preuve, pas une pub. */
  site: string
}

/**
 * Les clients, dans l'ordre d'affichage.
 *
 * À compléter avec les logos, une fois récupérés et l'accord obtenu. Les sites sont
 * notés dès maintenant pour que la provenance de chaque logo reste traçable.
 */
export const clients: readonly Client[] = [
  // {
  //   name: "Be Skilled Lab",
  //   logo: "/logos/clients/be-skilled-lab.svg",
  //   site: "https://be-skilledlab.fr",
  // },
  // {
  //   name: "Yoginette",
  //   logo: "/logos/clients/yoginette.svg",
  //   site: "https://yoginette.fr",
  // },
  // {
  //   name: "DK Clim",
  //   logo: "/logos/clients/dk-clim.svg",
  //   site: "https://dk-clim.fr",
  // },
  // {
  //   name: "BSL Portage",
  //   logo: "/logos/clients/bsl-portage.svg",
  //   site: "https://bslportage.fr",
  // },
  // {
  //   name: "South Clean",
  //   logo: "/logos/clients/south-clean.svg",
  //   site: "https://southclean.fr",
  // },
  // {
  //   name: "Luundi",
  //   logo: "/logos/clients/luundi.svg",
  //   site: "https://luundi.fr",
  // },
  // {
  //   name: "Rabbit Web",
  //   logo: "/logos/clients/rabbit-web.svg",
  //   site: "https://rabbitweb.fr",
  // },
]

/**
 * Les deux marques sœurs, **si l'on choisit de les montrer**.
 *
 * Séparées des clients parce qu'elles n'en sont pas, et que le libellé du bandeau ne
 * peut pas couvrir les deux. Leur inclusion demande un titre distinct - « Adossé à un
 * groupe » plutôt que « Ils nous font confiance » - et déroge à la règle qui réserve
 * l'endossement de groupe au pied de page, à `/le-groupe` et à une ligne sur
 * `/a-propos`. Le choix est donc explicite, pas un effet de bord.
 */
export const siblingBrands: readonly Client[] = [
  {
    name: "Hexceos",
    logo: "/logos/logo-hexceos.png",
    site: "https://hexceos.fr",
  },
  {
    name: "LessonSharing",
    logo: "/logos/logo-lessonsharing.png",
    site: "https://lessonsharing.fr",
  },
]
