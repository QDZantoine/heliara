import "server-only"

import { write } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"
import { publicUrl } from "@/lib/s3"

/**
 * Accès aux réalisations pour l'administration.
 *
 * Ce module traduit les lignes de la base en objets utilisables par les écrans :
 * `snake_case` vers `camelCase`, `BINARY(16)` vers hexadécimal, `TINYINT` vers
 * booléen, clé d'objet vers URL publique. Aucun composant ne manipule une ligne
 * brute, et aucune procédure n'est appelée ailleurs qu'ici.
 *
 * Les formes exposées reprennent celles de `lib/content/cases.ts`, ce qui rendra la
 * bascule du site public transparente pour les pages.
 */

export type CaseStatus = "draft" | "published"

export type CaseSummary = {
  id: string
  slug: string
  title: string
  sector: string
  year: string
  figure: string
  measure: string
  featured: boolean
  wide: boolean
  status: CaseStatus
  position: number
  chapterCount: number
  resultCount: number
  updatedAt: number
  publishedAt: number | null
  updatedByName: string | null
}

export type CaseMediaRef = {
  id: string
  url: string
  alt: string
  width: number | null
  height: number | null
  mimeType: string
  originalName: string
  caption?: string
}

export type CaseDetail = {
  id: string
  slug: string
  title: string
  heroTitle: string
  sector: string
  year: string
  badge: string
  teaser: string
  summary: string
  figure: string
  measure: string
  halo: "warm" | "cool"
  accent: "brand" | "info"
  featured: boolean
  wide: boolean
  resultsLabel: string
  testimonial: {
    quote: string
    name: string
    role: string
    initials: string
  }
  heroMedia: CaseMediaRef | null
  status: CaseStatus
  position: number
  publishedAt: number | null
  updatedAt: number
  chapters: { num: string; title: string; text: string; callout: string }[]
  results: { value: string; label: string }[]
  meta: { label: string; value: string }[]
  lessons: { text: string }[]
  gallery: CaseMediaRef[]
}

/** `TINYINT(1)` arrive en nombre : la conversion est faite une fois, ici. */
const bool = (value: unknown) => value === 1 || value === true

/** Une colonne `TEXT NOT NULL DEFAULT ''` peut valoir `null` sur une vieille ligne. */
const text = (value: unknown) => (typeof value === "string" ? value : "")

type SummaryRow = {
  id: Buffer
  slug: string
  title: string
  sector: string
  year: string
  figure: string
  measure: string
  featured: number
  wide: number
  status: CaseStatus
  position: number
  chapter_count: number
  result_count: number
  updated_at: number
  published_at: number | null
  updated_by_name: string | null
}

export async function listCases(
  status: CaseStatus | null = null
): Promise<CaseSummary[]> {
  const rows = await write.rows<SummaryRow>("list_case_studies", [status])
  return rows.map((row) => ({
    id: toHex(row.id),
    slug: row.slug,
    title: row.title,
    sector: row.sector,
    year: row.year,
    figure: text(row.figure),
    measure: text(row.measure),
    featured: bool(row.featured),
    wide: bool(row.wide),
    status: row.status,
    position: Number(row.position),
    chapterCount: Number(row.chapter_count),
    resultCount: Number(row.result_count),
    updatedAt: Number(row.updated_at),
    publishedAt: row.published_at === null ? null : Number(row.published_at),
    updatedByName: row.updated_by_name,
  }))
}

type DetailRow = {
  id: Buffer
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
  hero_media_id: Buffer | null
  position: number
  status: CaseStatus
  published_at: number | null
  updated_at: number
}

type ChapterRow = {
  num: string
  title: string
  text: string
  callout: string | null
}
type ResultRow = { value: string; label: string }
type MetaRow = { label: string; value: string }
type LessonRow = { text: string }
type GalleryRow = {
  id: Buffer
  object_key: string
  mime_type: string
  width: number | null
  height: number | null
  alt: string
  original_name: string
  caption: string | null
}

function toMediaRef(row: GalleryRow): CaseMediaRef {
  return {
    id: toHex(row.id),
    url: publicUrl(row.object_key),
    alt: text(row.alt),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    mimeType: row.mime_type,
    originalName: row.original_name,
    caption: row.caption ?? undefined,
  }
}

/**
 * Une réalisation complète.
 *
 * `get_case_study_full` rend cinq jeux de résultats en un aller-retour ; la
 * galerie demande un second appel, parce qu'elle vit dans une table de liaison
 * arrivée après. Deux allers-retours au total, pas six.
 *
 * L'identifiant est accepté en hexadécimal ou le slug en clair : l'écran d'édition
 * est adressé par slug, ce qui rend l'URL lisible et permet de la partager.
 */
export async function getCase(
  reference: { id: Buffer } | { slug: string }
): Promise<CaseDetail | null> {
  const [id, slug] =
    "id" in reference ? [reference.id, null] : [null, reference.slug]

  const sets = await write.sets("get_case_study_full", [id, slug])
  const row = (sets[0] as DetailRow[] | undefined)?.[0]
  if (!row) {
    return null
  }

  // La galerie et le visuel de hero sont deux choses distinctes : le hero n'est
  // pas une entrée de galerie, il est désigné par `hero_media_id`. Les deux
  // lectures partent en parallèle.
  const [gallery, heroRow] = await Promise.all([
    write.rows<GalleryRow>("list_case_gallery", [row.id]),
    row.hero_media_id
      ? write.row<GalleryRow>("get_media", [row.hero_media_id])
      : Promise.resolve(null),
  ])

  return {
    id: toHex(row.id),
    slug: row.slug,
    title: row.title,
    heroTitle: text(row.hero_title) || row.title,
    sector: row.sector,
    year: row.year,
    badge: text(row.badge),
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
    heroMedia: heroRow ? toMediaRef(heroRow) : null,
    status: row.status,
    position: Number(row.position),
    publishedAt: row.published_at === null ? null : Number(row.published_at),
    updatedAt: Number(row.updated_at),
    chapters: ((sets[1] as ChapterRow[]) ?? []).map((item) => ({
      num: item.num,
      title: item.title,
      text: item.text,
      callout: item.callout ?? "",
    })),
    results: ((sets[2] as ResultRow[]) ?? []).map((item) => ({
      value: item.value,
      label: item.label,
    })),
    meta: ((sets[3] as MetaRow[]) ?? []).map((item) => ({
      label: item.label,
      value: item.value,
    })),
    lessons: ((sets[4] as LessonRow[]) ?? []).map((item) => ({
      text: item.text,
    })),
    gallery: gallery.map(toMediaRef),
  }
}

export type MediaItem = CaseMediaRef & {
  byteSize: number
  createdAt: number
  usageCount: number
}

type MediaRow = GalleryRow & {
  byte_size: number
  created_at: number
  usage_count: number
}

/** La médiathèque, pour le sélecteur d'image. */
export async function listMedia(limit = 60, offset = 0): Promise<MediaItem[]> {
  const rows = await write.rows<MediaRow>("list_media", [limit, offset])
  return rows.map((row) => ({
    ...toMediaRef(row),
    byteSize: Number(row.byte_size),
    createdAt: Number(row.created_at),
    usageCount: Number(row.usage_count),
  }))
}
