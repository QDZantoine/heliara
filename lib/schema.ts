import { siteOrigin } from "@/lib/origin"
import { absoluteUrl } from "@/lib/seo"
import {
  phoneE164,
  serviceAreas,
  site,
  socialProfiles,
  whatsapp,
  whatsappE164,
  whatsappUrl,
} from "@/lib/site"

/**
 * Les données structurées, schema.org.
 *
 * **Ce qu'elles apportent, et à qui.** Aux moteurs classiques, la compréhension de
 * l'entité et des résultats enrichis. Aux moteurs générateurs de réponses, quelque
 * chose de plus direct : un modèle qui doit citer « le studio Heliara » a besoin de
 * savoir que c'est une organisation, ce qu'elle fait, où elle se trouve et quels
 * contenus lui appartiennent. Une page bien écrite le laisse deviner ; un graphe le
 * dit.
 *
 * **Deux principes tenus partout.**
 *
 * 1. **Des `@id` stables, et un seul graphe par page.** L'organisation est
 *    `https://heliara.fr/#organization` sur toutes les pages, et les autres nœuds la
 *    référencent au lieu de la recopier. Sans cela, chaque page décrirait une
 *    organisation qui pourrait être une autre, et rien ne relierait un article à son
 *    éditeur.
 * 2. **Rien qui ne soit vrai et déjà sur la page.** Les deux numéros y sont depuis
 *    qu'ils sont réels - la ligne du studio sur `/contact` et dans les mentions
 *    légales, le mobile WhatsApp dans la bulle de chaque page ; l'adresse postale
 *    n'y est pas, les mentions légales la portant encore en « à compléter », et
 *    aucune note d'avis n'est inventée. Une donnée structurée qui contredit la page est un
 *    motif d'action manuelle, et une donnée fausse reprise par un modèle est pire :
 *    elle se propage.
 */

type Node = Record<string, unknown>

/*
  Des fonctions et non des constantes : `siteOrigin()` lit l'environnement, et une
  constante de module figerait la valeur au premier import. Les `@id` doivent suivre
  l'origine réellement servie, sans quoi le graphe d'une préproduction se déclarerait
  comme celui de la production.
*/
export const organizationId = () => `${siteOrigin()}/#organization`
export const websiteId = () => `${siteOrigin()}/#website`

/** Un graphe complet, prêt à être sérialisé. */
export function graph(nodes: Node[]) {
  return { "@context": "https://schema.org", "@graph": nodes }
}

/**
 * L'organisation, décrite une fois pour tout le site.
 *
 * `knowsAbout` est alimenté par les familles d'expertise **réellement publiées** et
 * non par une liste de mots-clés : c'est ce qui en fait un signal plutôt qu'un
 * bourrage. Il répond à la question qu'un moteur générateur se pose pour décider s'il
 * cite le studio - « sur quoi cette organisation est-elle compétente ».
 */
export function organizationNode(knowsAbout: string[] = []): Node {
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: site.name,
    url: siteOrigin(),
    description: site.description,
    slogan: site.baseline,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logos/logo-brand-heliara-orange.png"),
      caption: `Logo ${site.name}`,
    },
    email: site.email,
    /*
      Le numéro annoncé est celui du studio, en E.164 : c'est la forme qu'attend
      schema.org, et c'est le numéro que montrent `/contact` et les mentions légales.
      Le mobile WhatsApp est déclaré plus bas, comme point de contact et non comme
      téléphone de l'organisation - deux numéros à la même hauteur laisseraient un
      moteur choisir le mauvais.
    */
    telephone: phoneE164,
    /*
      Les zones d'intervention, telles que le pied de page les annonce sur chaque
      écran : quatre villes, puis la France entière pour le travail à distance.

      **Des `City` et non des `Place` avec adresse.** Le studio n'a pas d'agence dans
      chacune, et `areaServed` dit précisément ce qu'on veut dire - le territoire
      desservi - sans rien affirmer sur un établissement. Une `PostalAddress` ou un
      `LocalBusiness` par ville serait faux, et c'est le premier motif de sanction en
      référencement local.

      Pas d'adresse postale non plus pour l'organisation, les mentions légales la
      portant encore en « à compléter ».
    */
    areaServed: [
      ...serviceAreas.map((city) => ({ "@type": "City", name: city })),
      { "@type": "Country", name: "France" },
    ],
    knowsLanguage: "fr-FR",
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
    // Omis quand la liste est vide : un `sameAs` vide n'apporte rien et un `sameAs`
    // inventé relierait l'entité à un compte qui n'est pas le sien.
    ...(socialProfiles.length > 0 ? { sameAs: [...socialProfiles] } : {}),
    /*
      Deux canaux, décrits séparément parce qu'ils ne se joignent pas de la même façon.
      `name` les distingue - deux `ContactPoint` de même `contactType` sans nom
      laisseraient un moteur en confondre les numéros.

      **Le canal WhatsApp n'entre ici que parce que la bulle est sur chaque page.** Un
      point de contact balisé mais absent de l'écran est un écart signalable, au même
      titre qu'une FAQ balisée qu'on ne montre pas.
    */
    contactPoint: [
      {
        "@type": "ContactPoint",
        name: "Studio",
        contactType: "sales",
        email: site.email,
        telephone: phoneE164,
        availableLanguage: "fr",
        url: absoluteUrl("/contact"),
      },
      {
        "@type": "ContactPoint",
        name: whatsapp.label,
        contactType: "sales",
        telephone: whatsappE164,
        availableLanguage: "fr",
        url: whatsappUrl,
      },
    ],
  }
}

/**
 * Le site.
 *
 * **Pas de `SearchAction`**, volontairement : le site n'a pas de recherche interne, et
 * en déclarer une ferait pointer un moteur vers une URL qui répondrait 404.
 */
export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    url: siteOrigin(),
    name: site.name,
    description: site.description,
    inLanguage: "fr-FR",
    publisher: { "@id": organizationId() },
  }
}

/**
 * Le fil d'Ariane.
 *
 * Les éléments **reprennent exactement** le fil affiché par `<Breadcrumb>` : Google
 * demande que le balisage corresponde au contenu visible, et un fil balisé plus
 * profond que celui qu'on montre est un écart signalable.
 */
export function breadcrumbNode(
  items: { label: string; path?: string }[]
): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      // Le dernier élément est la page courante : sans `item`, comme le veut la
      // spécification.
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  }
}

/** « 18 min » devient « PT18M », la seule forme que schema.org accepte. */
export function isoDuration(readingTime: string): string | undefined {
  const minutes = readingTime.match(/(\d+)\s*min/i)
  if (minutes) {
    return `PT${minutes[1]}M`
  }
  const hours = readingTime.match(/(\d+)\s*h/i)
  return hours ? `PT${hours[1]}H` : undefined
}

export function articleNode({
  path,
  title,
  description,
  publishedAt,
  modifiedAt,
  author,
  authorRole,
  section,
  readingTime,
  imageUrl,
}: {
  path: string
  title: string
  description: string
  publishedAt: string
  modifiedAt?: string
  /**
   * Le nom de l'auteur, **quand c'est une personne**.
   *
   * Omis pour un article signé du studio : le nœud retombe alors sur l'organisation
   * par son `@id`, ce qui est exactement ce qu'il faut dire. Un `Person` nommé
   * « L'équipe Heliara » décrirait une personne qui n'existe pas, et c'est le genre
   * d'entité qu'un moteur reprend telle quelle.
   */
  author?: string
  authorRole?: string
  section?: string
  readingTime?: string
  imageUrl?: string
}): Node {
  const url = absoluteUrl(path)
  const duration = readingTime ? isoDuration(readingTime) : undefined

  return {
    "@type": "Article",
    "@id": `${url}#article`,
    isPartOf: { "@id": websiteId() },
    mainEntityOfPage: url,
    url,
    headline: title,
    description,
    datePublished: publishedAt,
    // `dateModified` n'est pas du remplissage : c'est ce qui distingue un contenu
    // tenu à jour d'un contenu abandonné, pour un moteur comme pour un modèle.
    ...(modifiedAt ? { dateModified: modifiedAt } : {}),
    inLanguage: "fr-FR",
    ...(section ? { articleSection: section } : {}),
    ...(duration ? { timeRequired: duration } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    author: author
      ? {
          "@type": "Person",
          name: author,
          ...(authorRole ? { jobTitle: authorRole } : {}),
          worksFor: { "@id": organizationId() },
        }
      : { "@id": organizationId() },
    publisher: { "@id": organizationId() },
  }
}

/**
 * Une réalisation.
 *
 * `Article` et non `CreativeWork` : c'est un texte publié, daté, signé par le studio,
 * et `Article` est ce que les moteurs savent lire. `about` porte le secteur, qui est
 * l'entrée par laquelle on cherche une référence - « une plateforme métier dans
 * l'industrie » plutôt que le nom du projet.
 */
export function caseStudyNode({
  path,
  title,
  heroTitle,
  description,
  sector,
  year,
  modifiedAt,
  imageUrl,
  results,
}: {
  path: string
  title: string
  heroTitle?: string
  description: string
  sector: string
  year?: string
  modifiedAt?: string
  imageUrl?: string
  results?: { value: string; label: string }[]
}): Node {
  const url = absoluteUrl(path)

  return {
    "@type": "Article",
    "@id": `${url}#case-study`,
    isPartOf: { "@id": websiteId() },
    mainEntityOfPage: url,
    url,
    headline: heroTitle?.trim() || title,
    alternativeHeadline: title,
    description,
    inLanguage: "fr-FR",
    ...(modifiedAt ? { dateModified: modifiedAt } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    about: { "@type": "Thing", name: sector },
    ...(year ? { temporalCoverage: year } : {}),
    // Les résultats mesurés, tels qu'affichés. C'est la partie citable d'une étude
    // de cas, et la seule qu'un modèle puisse reprendre sans la reformuler.
    ...(results && results.length > 0
      ? {
          mentions: results.map((one) => ({
            "@type": "Thing",
            name: `${one.value} ${one.label}`.trim(),
          })),
        }
      : {}),
    author: { "@id": organizationId() },
    publisher: { "@id": organizationId() },
  }
}

/**
 * L'offre du studio, vue d'ensemble, pour l'accueil.
 *
 * **`Service` et non `ProfessionalService`, et c'est le point à ne pas défaire.**
 * `ProfessionalService` est un sous-type de `LocalBusiness` : le déclarer affirme un
 * établissement, avec l'adresse et les horaires qui vont avec. Or l'établissement
 * immatriculé n'est pas dans les villes d'intervention, et la page dit noir sur blanc
 * qu'il n'y a pas d'agence dans chacune. Un `LocalBusiness` sans adresse est au mieux
 * ignoré, au pire une affirmation fausse - et c'est le premier motif de sanction en
 * référencement local.
 *
 * `Service` dit exactement ce qui est vrai : voici la prestation, voici qui la rend,
 * voici où elle est rendue. Le jour où un établissement existe dans l'Hérault, c'est
 * `LocalBusiness` qu'il faudra ajouter, avec une adresse réelle.
 *
 * **`areaServed` reprend la même liste que le pied de page et le hero**, et cette
 * section-là est désormais affichée : le balisage ne dit rien de plus que l'écran.
 *
 * Le catalogue est alimenté par les familles **réellement publiées**, celles que la
 * grille de l'accueil montre juste en dessous.
 */
export function studioServiceNode(families: string[] = []): Node {
  return {
    "@type": "Service",
    "@id": `${siteOrigin()}/#offre`,
    name: "Conception et développement de produits numériques sur mesure",
    description: site.description,
    provider: { "@id": organizationId() },
    inLanguage: "fr-FR",
    isPartOf: { "@id": websiteId() },
    areaServed: [
      ...serviceAreas.map((city) => ({ "@type": "City", name: city })),
      { "@type": "Country", name: "France" },
    ],
    ...(families.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Familles de produits",
            itemListElement: families.map((family) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: family },
            })),
          },
        }
      : {}),
  }
}

/**
 * Un service d'expertise.
 *
 * Les livrables deviennent un `OfferCatalog` : ce sont bien les prestations que le
 * service comprend, et c'est la propriété que schema.org prévoit pour les énumérer.
 */
export function serviceNode({
  path,
  title,
  tagline,
  problem,
  familyLabel,
  deliverables,
}: {
  path: string
  title: string
  tagline: string
  problem?: string
  familyLabel: string
  deliverables?: { title: string; text: string }[]
}): Node {
  const url = absoluteUrl(path)

  return {
    "@type": "Service",
    "@id": `${url}#service`,
    url,
    name: title,
    // La description reprend l'accroche, puis le problème s'il y en a un : c'est
    // exactement ce que la page dit en tête, dans le même ordre.
    description: [tagline, problem].filter(Boolean).join(" "),
    serviceType: familyLabel,
    provider: { "@id": organizationId() },
    areaServed: { "@type": "Country", name: "France" },
    inLanguage: "fr-FR",
    ...(deliverables && deliverables.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Ce que nous livrons",
            itemListElement: deliverables.map((one) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: one.title,
                ...(one.text ? { description: one.text } : {}),
              },
            })),
          },
        }
      : {}),
  }
}

/**
 * Les objections d'une page d'expertise, en questions-réponses.
 *
 * **Deux réserves assumées.** Google a restreint le résultat enrichi FAQ aux sites
 * publics de santé et d'administration en 2023 : ce nœud n'apporte donc plus de
 * vignette dans les résultats. Et une page d'expertise n'est pas une page de FAQ, ce
 * qui rend `FAQPage` un peu large pour ce qu'elle est.
 *
 * Il est conservé pour la raison qui reste valable : des paires question-réponse
 * explicites sont ce qu'un moteur générateur reprend le plus volontiers, parce qu'il
 * n'a rien à reformuler. Le contenu balisé est mot pour mot celui de la page, qui est
 * la condition pour que ce ne soit pas un abus.
 */
export function faqNode(
  path: string,
  faq: { question: string; answer: string }[]
): Node {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    inLanguage: "fr-FR",
    mainEntity: faq.map((one) => ({
      "@type": "Question",
      name: one.question,
      acceptedAnswer: { "@type": "Answer", text: one.answer },
    })),
  }
}

/** Une page de section : listing, hub, page fixe. */
/**
 * Une page fixe qui n'est ni un listing ni un contenu daté : `/methode`, `/contact`,
 * `/a-propos`, `/le-groupe`.
 *
 * **Elles n'avaient aucun nœud de page**, seulement l'organisation et le site posés par
 * le chrome. Rien ne disait donc qu'une adresse précise traitait de tel sujet, et un
 * moteur générateur n'avait aucun `@id` à citer pour « la méthode de Heliara ». Le
 * `@type` est resserré quand schema.org en propose un plus juste - `ContactPage`,
 * `AboutPage` -, ce qui est exactement l'information qu'une machine ne peut pas déduire
 * du gabarit.
 */
export function webPageNode({
  path,
  title,
  description,
  type = "WebPage",
  about,
}: {
  path: string
  title: string
  description: string
  type?: "WebPage" | "ContactPage" | "AboutPage"
  /** Le sujet de la page, quand c'est l'organisation elle-même. */
  about?: boolean
}): Node {
  const url = absoluteUrl(path)
  return {
    "@type": type,
    "@id": `${url}#page`,
    url,
    name: title,
    description,
    isPartOf: { "@id": websiteId() },
    inLanguage: "fr-FR",
    ...(about ? { about: { "@id": organizationId() } } : {}),
  }
}

/**
 * La méthode, en `HowTo`.
 *
 * **Même réserve et même raison que `faqNode`.** Google a retiré le résultat enrichi
 * `HowTo` des résultats de bureau en 2023, puis de mobile : ce nœud n'apporte plus de
 * vignette. Il est posé pour l'autre lecteur - un moteur génératif à qui l'on demande
 * « comment se déroule un projet chez Heliara » trouve ici huit étapes nommées, dans
 * l'ordre, avec leur livrable, et n'a rien à reformuler.
 *
 * Le livrable est joint au texte de l'étape parce que c'est ce que la page montre : le
 * nom du temps, ce qu'il contient, et ce qu'on remet à la fin.
 */
export function howToNode({
  path,
  name,
  description,
  steps,
}: {
  path: string
  name: string
  description: string
  steps: {
    title: string
    text: string
    deliverable?: string
    /** L'ancre du temps sur la page. Réellement posée : un `url` mort ne vaut rien. */
    anchor: string
  }[]
}): Node {
  const url = absoluteUrl(path)
  return {
    "@type": "HowTo",
    "@id": `${url}#methode`,
    name,
    description,
    inLanguage: "fr-FR",
    isPartOf: { "@id": websiteId() },
    step: steps.map((one, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: one.title,
      text: [one.text, one.deliverable && `Livrable : ${one.deliverable}`]
        .filter(Boolean)
        .join(" "),
      url: `${url}#${one.anchor}`,
    })),
  }
}

/**
 * Une personne de l'équipe.
 *
 * **Ni `worksFor`, ni `affiliation`, volontairement.** Les trois personnes présentées
 * n'ont pas le même rattachement - l'une dirige une marque sœur - et le déduire du
 * gabarit inventerait un lien d'emploi. La page les présente, donc l'`AboutPage` les
 * `mentions`, et rien de plus n'est affirmé que ce qu'elle écrit.
 *
 * `knowsAbout` reprend les spécialités déjà affichées en puces sur la carte.
 */
export function personNode({
  name,
  jobTitle,
  description,
  knowsAbout,
  imageUrl,
}: {
  name: string
  jobTitle: string
  description?: string
  knowsAbout?: string[]
  imageUrl?: string
}): Node {
  return {
    "@type": "Person",
    "@id": `${siteOrigin()}/a-propos#${name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`,
    name,
    jobTitle,
    ...(description ? { description } : {}),
    ...(knowsAbout && knowsAbout.length > 0 ? { knowsAbout } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
  }
}

/**
 * Une marque sœur, citée par `/le-groupe`.
 *
 * **`mentions` et jamais `parentOrganization` ni `subOrganization`.** Il n'y a pas de
 * maison mère à déclarer - le nom du holding ne figure nulle part sur le site public -
 * et les trois marques sont sœurs. Une hiérarchie balisée là où la page décrit une
 * complémentarité serait un écart, et elle mettrait dans le graphe le seul nom que le
 * site ne prononce pas.
 */
export function brandNode({
  name,
  url,
  description,
}: {
  name: string
  url: string
  description?: string
}): Node {
  return {
    "@type": "Organization",
    "@id": `${url.replace(/\/+$/, "")}/#organization`,
    name,
    url,
    ...(description ? { description } : {}),
  }
}

export function collectionPageNode({
  path,
  title,
  description,
  items,
}: {
  path: string
  title: string
  description: string
  /**
   * Les éléments **réellement affichés** par la page, dans l'ordre où elle les montre.
   *
   * Ils deviennent un `ItemList` : sans lui, un listing se déclarait comme collection
   * sans jamais dire ce qu'il collectait, et un moteur devait deviner ses liens. Avec
   * lui, l'inventaire est explicite - c'est ce qu'un moteur génératif reprend pour
   * répondre « quelles réalisations » ou « quelles expertises ».
   *
   * Une page filtrée ne doit pas passer sa sélection : la liste balisée serait plus
   * courte que la page canonique qu'elle déclare.
   */
  items?: { name: string; path: string }[]
}): Node {
  const url = absoluteUrl(path)
  return {
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name: title,
    description,
    isPartOf: { "@id": websiteId() },
    inLanguage: "fr-FR",
    ...(items && items.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((one, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: one.name,
              url: absoluteUrl(one.path),
            })),
          },
        }
      : {}),
  }
}
