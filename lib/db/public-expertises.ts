import "server-only"

import { read } from "@/lib/db/call"
import {
  expertiseFamilies as staticFamilies,
  expertiseServices as staticServices,
} from "@/lib/content/expertises"

/**
 * Lecture des expertises par le **site public**.
 *
 * Même contrat que les réalisations et les articles : seules les procédures `pub_*`,
 * et un repli explicite sur `lib/content/expertises.ts` quand la base est vide ou
 * injoignable.
 *
 * Une différence notable : ces données alimentent la **navigation du site**, présente
 * sur chaque page. Le repli y compte donc double - une base muette ne doit pas vider
 * le menu, ce qui serait visible partout.
 */

/**
 * Une famille, telle que le site l'affiche.
 *
 * **Le slug est une chaîne, et non l'union `ExpertiseFamilySlug`** du contenu
 * statique. Cette union était juste tant que les familles étaient figées dans un
 * fichier ; dès qu'on peut en créer une depuis l'administration, l'ensemble des
 * slugs n'est plus clos, et le prétendre serait mentir au compilateur.
 */
export type PublicFamily = {
  slug: string
  label: string
  title: string
  summary: string
  tag: string
  halo: "warm" | "cool"
  /** Les trois barres du croquis, en pourcentage de largeur. */
  lines: [number, number, number]
  /**
   * Le service vers lequel mène cette famille, ou `null`.
   *
   * Calculé par la procédure : le service désigné s'il est publié, sinon le premier
   * publié de la famille. `null` quand la famille n'a aucun service publié - et c'est
   * ce cas qui la fait disparaître de la nav comme du hub. Une entrée de menu qui
   * mènerait à un hub où la famille n'apparaît même pas serait une impasse.
   */
  navSlug: string | null
}

export type PublicService = {
  slug: string
  title: string
  tagline: string
  relatedCase: string
  familySlug: string
  familyLabel: string
}

export type PublicServiceDetail = PublicService & {
  problem: string
  ctaTitle: string
  familyHalo: "warm" | "cool"
  deliverables: { title: string; text: string }[]
  techChoices: { title: string; text: string }[]
  faq: { question: string; answer: string }[]
  /**
   * « Pourquoi du sur-mesure ? », facultative.
   *
   * Absente quand la section n'est pas renseignée - ce qui doit rester possible :
   * tous les services ne se décident pas sur cette question. La vue teste sa présence
   * plutôt que d'afficher un bloc à trous.
   */
  whyCustom?: { lead: string; signals: string[]; closing: string }
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

function fallback(reason: string, error?: unknown) {
  console.warn(
    `Expertises : repli sur le contenu statique (${reason}).`,
    error ?? ""
  )
}

type FamilyRow = {
  slug: string
  label: string
  title: string
  summary: string
  tag: string
  halo: "warm" | "cool"
  sketch_1: number
  sketch_2: number
  sketch_3: number
  nav_slug: string | null
}

/**
 * Le repli des familles, avec la cible de nav telle que le contenu statique la
 * calculait : le service qui porte le même slug que sa famille.
 *
 * C'est la coïncidence que `nav_service_slug` remplace en base. Elle reste vraie
 * dans le fichier statique, et il n'y a pas de raison de l'y défaire - c'est un
 * secours, pas la source.
 */
function staticFamilyFallback(): PublicFamily[] {
  return staticFamilies.map((family) => ({
    slug: family.slug,
    label: family.label,
    title: family.title,
    summary: family.summary,
    tag: family.tag,
    halo: family.halo,
    lines: family.lines as [number, number, number],
    navSlug: staticServices.some((service) => service.slug === family.slug)
      ? family.slug
      : null,
  }))
}

export async function listPublicFamilies(): Promise<PublicFamily[]> {
  try {
    const rows = await read.rows<FamilyRow>("pub_list_expertise_families")
    if (rows.length === 0) {
      fallback("aucune famille")
      return staticFamilyFallback()
    }
    return rows.map((row) => ({
      slug: row.slug,
      label: row.label,
      title: text(row.title) || row.label,
      summary: text(row.summary),
      tag: text(row.tag),
      halo: row.halo,
      lines: [Number(row.sketch_1), Number(row.sketch_2), Number(row.sketch_3)],
      navSlug: row.nav_slug,
    }))
  } catch (error) {
    fallback("base injoignable", error)
    return staticFamilyFallback()
  }
}

type ServiceRow = {
  slug: string
  title: string
  tagline: string
  related_case_slug: string | null
  family_slug: string
  family_label: string
}

function staticServiceFallback(): PublicService[] {
  return staticServices.map((service) => ({
    slug: service.slug,
    title: service.title,
    tagline: service.tagline,
    relatedCase: service.relatedCase,
    familySlug: service.family,
    familyLabel:
      staticFamilies.find((family) => family.slug === service.family)?.label ??
      service.family,
  }))
}

export async function listPublicServices(): Promise<PublicService[]> {
  try {
    const rows = await read.rows<ServiceRow>("pub_list_expertise_services")
    if (rows.length === 0) {
      fallback("aucun service publié")
      return staticServiceFallback()
    }
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      tagline: text(row.tagline),
      relatedCase: row.related_case_slug ?? "",
      familySlug: row.family_slug,
      familyLabel: row.family_label,
    }))
  } catch (error) {
    fallback("base injoignable", error)
    return staticServiceFallback()
  }
}

/** Les services groupés par famille, dans l'ordre des familles. Pour le hub. */
export async function publicServicesByFamily(): Promise<
  { family: PublicFamily; services: PublicService[] }[]
> {
  const [families, services] = await Promise.all([
    listPublicFamilies(),
    listPublicServices(),
  ])

  return (
    families
      .map((family) => ({
        family,
        services: services.filter(
          (service) => service.familySlug === family.slug
        ),
      }))
      // Une famille sans service publié n'a rien à montrer sur le hub - alors
      // qu'elle reste dans la nav, où elle mène au hub. Les deux comportements
      // diffèrent parce que les deux besoins diffèrent.
      .filter((group) => group.services.length > 0)
  )
}

type DetailRow = ServiceRow & {
  problem: string
  why_custom_lead: string
  why_custom_closing: string
  cta_title: string
  family_halo: "warm" | "cool"
}

/**
 * La section « Pourquoi du sur-mesure ? », ou rien.
 *
 * **Elle n'existe que complète.** Un chapô sans signe annoncerait une liste vide, et
 * des signes sans conclusion laisseraient le visiteur sans la réponse qui compte -
 * celle qui dit quand le sur-mesure n'est *pas* la bonne réponse. Plutôt que d'afficher
 * un bloc à trous, on ne l'affiche pas : le champ est facultatif de bout en bout.
 */
function whyCustomOf(
  row: Pick<DetailRow, "why_custom_lead" | "why_custom_closing">,
  signals: readonly { text: string }[]
): PublicServiceDetail["whyCustom"] {
  const lead = text(row.why_custom_lead).trim()
  const closing = text(row.why_custom_closing).trim()
  const items = signals.map((one) => text(one.text)).filter(Boolean)
  if (!lead || !closing || items.length === 0) {
    return undefined
  }
  return { lead, signals: items, closing }
}

function staticDetailFallback(slug: string): PublicServiceDetail | null {
  const service = staticServices.find((one) => one.slug === slug)
  if (!service) {
    return null
  }
  const family = staticFamilies.find((one) => one.slug === service.family)
  return {
    slug: service.slug,
    title: service.title,
    tagline: service.tagline,
    relatedCase: service.relatedCase,
    familySlug: service.family,
    familyLabel: family?.label ?? service.family,
    familyHalo: family?.halo ?? "warm",
    problem: service.problem,
    ctaTitle: service.ctaTitle,
    deliverables: service.deliverables,
    techChoices: service.techChoices,
    faq: service.faq,
    // Le repli porte la section aussi : sinon une base injoignable ferait disparaître
    // la partie de la page qui qualifie le visiteur, et personne ne le remarquerait.
    whyCustom: service.whyCustom,
  }
}

export async function getPublicService(
  slug: string
): Promise<PublicServiceDetail | null> {
  try {
    const sets = await read.sets("pub_get_expertise_service", [slug])
    const row = (sets[0] as DetailRow[] | undefined)?.[0]

    if (!row) {
      const stat = staticDetailFallback(slug)
      if (stat) {
        fallback(`service « ${slug} » absent de la base`)
        return stat
      }
      return null
    }

    return {
      slug: row.slug,
      title: row.title,
      tagline: text(row.tagline),
      relatedCase: row.related_case_slug ?? "",
      familySlug: row.family_slug,
      familyLabel: row.family_label,
      familyHalo: row.family_halo,
      problem: text(row.problem),
      ctaTitle: text(row.cta_title),
      deliverables: ((sets[1] as { title: string; text: string }[]) ?? []).map(
        (item) => ({ title: item.title, text: text(item.text) })
      ),
      techChoices: ((sets[2] as { title: string; text: string }[]) ?? []).map(
        (item) => ({ title: item.title, text: text(item.text) })
      ),
      faq: ((sets[3] as { question: string; answer: string }[]) ?? []).map(
        (item) => ({ question: item.question, answer: text(item.answer) })
      ),
      whyCustom: whyCustomOf(
        row,
        (sets[4] as { text: string }[] | undefined) ?? []
      ),
    }
  } catch (error) {
    fallback(`base injoignable pour « ${slug} »`, error)
    return staticDetailFallback(slug)
  }
}

/** Les slugs à prérendre : union de la base et du statique. */
export async function listPublicServiceSlugs(): Promise<
  { slug: string; updatedAt?: number }[]
> {
  const statics = staticServices.map((item) => ({ slug: item.slug }))
  try {
    const rows = await read.rows<{ slug: string; updated_at: number | null }>(
      "pub_list_expertise_slugs"
    )
    // Même chose que pour les réalisations : `updated_at` était déjà rendu par la
    // procédure et perdu ici. Voir `listPublicCaseSlugs`.
    const vues = new Map<string, number | undefined>(
      rows.map((row) => [
        row.slug,
        row.updated_at === null ? undefined : Number(row.updated_at),
      ])
    )
    for (const item of statics) {
      if (!vues.has(item.slug)) {
        vues.set(item.slug, undefined)
      }
    }
    return [...vues].map(([slug, updatedAt]) => ({ slug, updatedAt }))
  } catch (error) {
    fallback("base injoignable au prérendu", error)
    return statics
  }
}

/**
 * Les entrées de nav des expertises.
 *
 * **Lues à chaque rendu de page**, puisqu'elles vivent dans l'en-tête et le pied de
 * page. Le repli sur le contenu statique y compte donc double : une base muette ne
 * doit pas vider le menu du site.
 *
 * **Les familles sans service publié sont écartées.** Les garder en les faisant mener
 * au hub paraissait prudent, et c'était une erreur : deux familles vides donnaient
 * deux entrées vers la même adresse - React signalait la clé dupliquée - et le
 * visiteur y aurait trouvé un hub où la famille n'apparaît même pas. Une entrée de
 * menu sans destination propre est une impasse, et la règle du projet est qu'il n'y
 * en a aucune.
 */
export async function publicExpertiseNav(): Promise<
  { label: string; href: string }[]
> {
  const families = await listPublicFamilies()
  return families
    .filter((family) => family.navSlug !== null)
    .map((family) => ({
      label: family.label,
      href: `/expertises/${family.navSlug}`,
    }))
}
