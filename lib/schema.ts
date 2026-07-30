import { absoluteUrl } from "@/lib/seo"
import { site, socialProfiles } from "@/lib/site"

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
 * 2. **Rien qui ne soit vrai et déjà sur la page.** Pas de téléphone tant qu'il est
 *    un gabarit, pas d'adresse tant que les mentions légales portent « à compléter »,
 *    pas de note d'avis inventée. Une donnée structurée qui contredit la page est un
 *    motif d'action manuelle, et une donnée fausse reprise par un modèle est pire :
 *    elle se propage.
 */

type Node = Record<string, unknown>

export const ORGANIZATION_ID = `${site.url}/#organization`
export const WEBSITE_ID = `${site.url}/#website`

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
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: site.url,
    description: site.description,
    slogan: site.baseline,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logos/logo-brand-heliara-orange.png"),
      caption: `Logo ${site.name}`,
    },
    email: site.email,
    // Le studio travaille en français, depuis la France : c'est ce que dit le site.
    // Rien de plus n'est affirmé - ni téléphone, ni adresse postale, tant que les
    // mentions légales les portent en « à compléter ».
    areaServed: { "@type": "Country", name: "France" },
    knowsLanguage: "fr-FR",
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
    // Omis quand la liste est vide : un `sameAs` vide n'apporte rien et un `sameAs`
    // inventé relierait l'entité à un compte qui n'est pas le sien.
    ...(socialProfiles.length > 0 ? { sameAs: [...socialProfiles] } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: site.email,
      availableLanguage: "fr",
      url: absoluteUrl("/contact"),
    },
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
    "@id": WEBSITE_ID,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: "fr-FR",
    publisher: { "@id": ORGANIZATION_ID },
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
  author: string
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
    isPartOf: { "@id": WEBSITE_ID },
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
          worksFor: { "@id": ORGANIZATION_ID },
        }
      : { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
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
    isPartOf: { "@id": WEBSITE_ID },
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
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
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
    provider: { "@id": ORGANIZATION_ID },
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
export function collectionPageNode({
  path,
  title,
  description,
}: {
  path: string
  title: string
  description: string
}): Node {
  const url = absoluteUrl(path)
  return {
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name: title,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "fr-FR",
  }
}
