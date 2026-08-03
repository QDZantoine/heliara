import "server-only"

import { read } from "@/lib/db/call"
import { caseStudies, type CaseStudy } from "@/lib/content/cases"
import { publicUrl } from "@/lib/s3"

/**
 * Lecture des réalisations par le **site public**.
 *
 * Deux principes, et le second compte autant que le premier.
 *
 * **1. Seules les procédures `pub_*` sont appelées**, avec le compte `app_read`
 * qui n'a le privilège d'exécuter que celles-là. Le site public ne peut donc rien
 * écrire, et ne peut pas voir un brouillon : le filtre sur le statut est dans la
 * procédure, sans paramètre pour l'annuler.
 *
 * **2. Un repli explicite sur le contenu statique.** Si la base est injoignable -
 * au build, pendant un redémarrage, sur un poste sans Docker - ou si elle ne
 * contient encore aucune fiche publiée, les pages servent `lib/content/cases.ts`.
 * Trois raisons :
 *
 *   - un déploiement ne doit pas échouer parce que la base n'a pas répondu ;
 *   - le site ne doit jamais afficher une page de réalisations vide, ce qui serait
 *     pire qu'un contenu un peu ancien ;
 *   - la bascule se fait sans coupure : tant que la base est vide, rien ne change
 *     de ce qui est en ligne aujourd'hui.
 *
 * Le repli est **silencieux pour le visiteur et bruyant dans les journaux** : une
 * base injoignable est un incident, elle ne doit pas passer inaperçue côté
 * exploitation.
 */

/**
 * Fraîcheur du contenu public, en secondes.
 *
 * **Documentaire seulement.** Next analyse les exports `revalidate` de segment
 * statiquement, sans évaluer le module : les pages doivent donc écrire un littéral,
 * et ne peuvent pas importer cette constante. Elle sert de référence unique dans la
 * documentation ; les deux valeurs doivent rester d'accord.
 */
export const CASES_REVALIDATE_SECONDS = 60

type PublicRow = {
  slug: string
  sector: string
  year: string
  badge: string
  title: string
  hero_title: string
  teaser: string
  summary: string
  figure: string
  measure: string
  halo: "warm" | "cool"
  accent: "brand" | "info"
  featured: number
  wide: number
  results_label: string
  testimonial_quote: string | null
  testimonial_name: string | null
  testimonial_role: string | null
  testimonial_initials: string | null
  hero_object_key: string | null
  hero_alt: string | null
  hero_width: number | null
  hero_height: number | null
  published_at: number | null
  updated_at: number
}

/** Une image de hero, telle que la page publique l'affiche. */
export type PublicHeroMedia = {
  url: string
  alt: string
  width: number | null
  height: number | null
}

/**
 * La forme rendue reprend celle de `lib/content/cases.ts`, augmentée du visuel et
 * de la galerie. Les pages n'ont donc pas à savoir d'où vient le contenu.
 */
export type PublicCase = Omit<CaseStudy, "meta" | "chapters"> & {
  meta: { label: string; value: string }[]
  chapters: { num: string; title: string; text: string; callout?: string }[]
  heroMedia?: PublicHeroMedia
  gallery?: (PublicHeroMedia & { caption?: string })[]
}

const bool = (value: unknown) => value === 1 || value === true
const text = (value: unknown) => (typeof value === "string" ? value : "")

function heroOf(row: PublicRow): PublicHeroMedia | undefined {
  if (!row.hero_object_key) {
    return undefined
  }
  return {
    url: publicUrl(row.hero_object_key),
    alt: text(row.hero_alt),
    width: row.hero_width === null ? null : Number(row.hero_width),
    height: row.hero_height === null ? null : Number(row.hero_height),
  }
}

/** Une fiche de liste : sans ses collections, que la grille n'affiche pas. */
function toSummary(row: PublicRow): PublicCase {
  return {
    slug: row.slug,
    sector: row.sector,
    year: row.year,
    badge: text(row.badge),
    title: row.title,
    heroTitle: text(row.hero_title) || row.title,
    teaser: text(row.teaser),
    summary: text(row.summary),
    figure: text(row.figure),
    measure: text(row.measure),
    halo: row.halo,
    accent: row.accent,
    featured: bool(row.featured),
    wide: bool(row.wide),
    resultsLabel: text(row.results_label) || "Résultats",
    testimonial: {
      quote: row.testimonial_quote ?? "",
      name: row.testimonial_name ?? "",
      role: row.testimonial_role ?? "",
      initials: row.testimonial_initials ?? "",
    },
    meta: [],
    chapters: [],
    results: [],
    lessons: [],
    heroMedia: heroOf(row),
  }
}

/** Journalise un repli. Silencieux pour le visiteur, visible en exploitation. */
function fallback(reason: string, error?: unknown) {
  console.warn(
    `Réalisations : repli sur le contenu statique (${reason}).`,
    error ?? ""
  )
}

/**
 * Les réalisations publiées, dans l'ordre de la grille.
 * Repli sur le contenu statique si la base est muette ou vide.
 */
export async function listPublicCases(): Promise<PublicCase[]> {
  try {
    const rows = await read.rows<PublicRow>("pub_list_case_studies")
    if (rows.length === 0) {
      fallback("aucune fiche publiée")
      return caseStudies as unknown as PublicCase[]
    }
    return rows.map(toSummary)
  } catch (error) {
    fallback("base injoignable", error)
    return caseStudies as unknown as PublicCase[]
  }
}

/** Les secteurs représentés, « Tous » en tête, pour la rangée de filtres. */
export async function listPublicSectors(
  cases: PublicCase[]
): Promise<string[]> {
  // Dérivé des fiches déjà chargées plutôt que d'un second appel : la liste est
  // toujours cohérente avec la grille affichée, y compris sous repli.
  return ["Tous", ...new Set(cases.map((item) => item.sector))]
}

type ChapterRow = {
  num: string
  title: string
  text: string
  callout: string | null
}
type PairRow = { label: string; value: string }
type ResultRow = { value: string; label: string }
type LessonRow = { text: string }
type GalleryRow = {
  object_key: string
  alt: string
  width: number | null
  height: number | null
  caption: string | null
}

/**
 * Une réalisation publiée, complète : six jeux de résultats en un aller-retour.
 *
 * Rend `null` sur un brouillon **comme** sur une fiche inexistante, sans les
 * distinguer : la page appelle `notFound()` dans les deux cas, et ne révèle donc
 * pas qu'un brouillon existe à cette adresse.
 */
export async function getPublicCase(slug: string): Promise<PublicCase | null> {
  try {
    const sets = await read.sets("pub_get_case_study", [slug])
    const row = (sets[0] as PublicRow[] | undefined)?.[0]

    if (!row) {
      // Rien en base : soit la fiche n'existe pas, soit elle n'est pas publiée,
      // soit la bascule n'est pas faite pour ce slug. Le contenu statique tranche.
      const stat = caseStudies.find((item) => item.slug === slug)
      if (stat) {
        fallback(`fiche « ${slug} » absente de la base`)
        return stat as unknown as PublicCase
      }
      return null
    }

    return {
      ...toSummary(row),
      chapters: ((sets[1] as ChapterRow[]) ?? []).map((item) => ({
        num: item.num,
        title: item.title,
        text: item.text,
        callout: item.callout ?? undefined,
      })),
      results: ((sets[2] as ResultRow[]) ?? []).map((item) => ({
        value: item.value,
        label: item.label,
      })),
      meta: ((sets[3] as PairRow[]) ?? []).map((item) => ({
        label: item.label,
        value: item.value,
      })),
      lessons: ((sets[4] as LessonRow[]) ?? []).map((item) => item.text),
      gallery: ((sets[5] as GalleryRow[]) ?? []).map((item) => ({
        url: publicUrl(item.object_key),
        alt: text(item.alt),
        width: item.width === null ? null : Number(item.width),
        height: item.height === null ? null : Number(item.height),
        caption: item.caption ?? undefined,
      })),
    }
  } catch (error) {
    fallback(`base injoignable pour « ${slug} »`, error)
    const stat = caseStudies.find((item) => item.slug === slug)
    return stat ? (stat as unknown as PublicCase) : null
  }
}

/**
 * Les slugs à prérendre.
 *
 * L'union de la base et du contenu statique : une fiche encore statique doit
 * rester servie, et une fiche seulement en base doit être prérendue. Le repli au
 * build en dépend - si la base ne répond pas, on prérend au moins ce qu'on connaît.
 */
export async function listPublicCaseSlugs(): Promise<
  { slug: string; updatedAt?: number }[]
> {
  const statics = caseStudies.map((item) => ({ slug: item.slug }))
  try {
    const rows = await read.rows<{ slug: string; updated_at: number | null }>(
      "pub_list_case_slugs"
    )
    /*
      La date de modification accompagne le slug, **et la procédure la rendait déjà** :
      seule cette couche la jetait. Le plan du site en a besoin pour `lastModified`, et
      la demander autrement coûterait un appel par fiche pour une donnée déjà en main.

      Une entrée du contenu statique n'en a pas : elle n'est pas datée, et un
      `lastModified` inventé serait un signal faux plutôt qu'un signal manquant.
    */
    const vues = new Map<string, number | undefined>(
      rows.map((row) => [
        row.slug,
        row.updated_at === null ? undefined : Number(row.updated_at),
      ])
    )
    // Le statique ne remplace jamais une entrée de la base : elle est plus à jour.
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

/** Le rebond de fin de fiche : aucune impasse, on reste dans la preuve. */
export async function getNextPublicCase(
  slug: string
): Promise<{ slug: string; title: string } | undefined> {
  const cases = await listPublicCases()
  const index = cases.findIndex((item) => item.slug === slug)
  if (index === -1) {
    return cases[0] ? { slug: cases[0].slug, title: cases[0].title } : undefined
  }
  const next = cases[(index + 1) % cases.length]
  // Une seule fiche : pas de rebond vers elle-même.
  return next && next.slug !== slug
    ? { slug: next.slug, title: next.title }
    : undefined
}
