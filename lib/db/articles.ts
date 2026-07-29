import "server-only"

import { write } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"
import { publicUrl } from "@/lib/s3"
import type { ArticleCategory } from "@/lib/content/articles"
import type { BlockInput } from "@/lib/schemas/article"

/**
 * Accès aux articles pour l'administration.
 *
 * Même rôle que `lib/db/cases.ts` : traduire les lignes de la base en objets
 * utilisables par les écrans, et n'appeler que des procédures. Aucun composant ne
 * manipule une ligne brute.
 */

export type ArticleStatus = "draft" | "published"

export type ArticleSummary = {
  id: string
  slug: string
  category: ArticleCategory
  title: string
  author: string
  publishedOn: string
  dateLabel: string
  readingTime: string
  featured: boolean
  status: ArticleStatus
  blockCount: number
  viewCount: number
  updatedAt: number
  publishedAt: number | null
  updatedByName: string | null
}

export type ArticleDetail = Omit<ArticleSummary, "blockCount"> & {
  lead: string
  authorRole: string
  authorInitials: string
  relatedCase: string
  heroMedia: {
    id: string
    url: string
    alt: string
    width: number | null
    height: number | null
    originalName: string
  } | null
  blocks: BlockInput[]
}

const bool = (value: unknown) => value === 1 || value === true
const text = (value: unknown) => (typeof value === "string" ? value : "")

/**
 * Une date `DATE` de MariaDB arrive en `Date` avec `mysql2`. On la ramène en ISO
 * court, la forme que le formulaire manipule.
 *
 * Le découpage sur `toISOString` plutôt qu'un formatage local : la colonne est un
 * jour sans fuseau, et un `toLocaleDateString` pourrait décaler d'un jour selon
 * l'heure du serveur.
 */
function isoDay(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return typeof value === "string" ? value.slice(0, 10) : ""
}

type SummaryRow = {
  id: Buffer
  slug: string
  category: ArticleCategory
  title: string
  lead: string
  author: string
  author_role: string
  author_initials: string
  published_on: Date | string | null
  date_label: string
  reading_time: string
  featured: number
  related_case_slug: string | null
  hero_media_id: Buffer | null
  status: ArticleStatus
  published_at: number | null
  view_count: number
  updated_at: number
  block_count?: number
  updated_by_name?: string | null
}

function toSummary(row: SummaryRow): ArticleSummary {
  return {
    id: toHex(row.id),
    slug: row.slug,
    category: row.category,
    title: row.title,
    author: text(row.author),
    publishedOn: isoDay(row.published_on),
    dateLabel: text(row.date_label),
    readingTime: text(row.reading_time),
    featured: bool(row.featured),
    status: row.status,
    blockCount: Number(row.block_count ?? 0),
    viewCount: Number(row.view_count ?? 0),
    updatedAt: Number(row.updated_at),
    publishedAt: row.published_at === null ? null : Number(row.published_at),
    updatedByName: row.updated_by_name ?? null,
  }
}

export async function listArticles(
  status: ArticleStatus | null = null
): Promise<ArticleSummary[]> {
  const rows = await write.rows<SummaryRow>("list_articles", [status])
  return rows.map(toSummary)
}

type BlockRow = {
  kind: BlockInput["kind"]
  text: string | null
  lead: string | null
  items: string | null
}

type MediaRow = {
  id: Buffer
  object_key: string
  alt: string
  width: number | null
  height: number | null
  original_name: string
}

/**
 * Reconstruit un bloc typé depuis sa ligne.
 *
 * La forme en base est plate - `text`, `lead`, `items` - et seule une partie de ces
 * colonnes vaut pour chaque type. La conversion est donc explicite plutôt que
 * mécanique : c'est ici que le contrat de l'union discriminée est rétabli, et les
 * composants n'ont plus à se demander quelle colonne est pertinente.
 */
function toBlock(row: BlockRow): BlockInput | null {
  switch (row.kind) {
    case "paragraph":
      return { kind: "paragraph", text: text(row.text) }
    case "heading":
      return { kind: "heading", text: text(row.text) }
    case "callout":
      return { kind: "callout", lead: text(row.lead), text: text(row.text) }
    case "numbered": {
      if (!row.items) {
        return null
      }
      try {
        const items = JSON.parse(row.items) as {
          num?: string
          title: string
          text: string
        }[]
        return { kind: "numbered", items }
      } catch {
        // JSON illisible : le bloc est écarté plutôt que de casser la page. La
        // contrainte `JSON_VALID` rend le cas improbable, pas impossible.
        return null
      }
    }
    default:
      return null
  }
}

export async function getArticle(
  reference: { id: Buffer } | { slug: string }
): Promise<ArticleDetail | null> {
  const [id, slug] =
    "id" in reference ? [reference.id, null] : [null, reference.slug]

  const sets = await write.sets("get_article_full", [id, slug])
  const row = (sets[0] as SummaryRow[] | undefined)?.[0]
  if (!row) {
    return null
  }

  const hero = row.hero_media_id
    ? await write.row<MediaRow>("get_media", [row.hero_media_id])
    : null

  return {
    ...toSummary(row),
    lead: text(row.lead),
    authorRole: text(row.author_role),
    authorInitials: text(row.author_initials),
    relatedCase: row.related_case_slug ?? "",
    heroMedia: hero
      ? {
          id: toHex(hero.id),
          url: publicUrl(hero.object_key),
          alt: text(hero.alt),
          width: hero.width === null ? null : Number(hero.width),
          height: hero.height === null ? null : Number(hero.height),
          originalName: hero.original_name,
        }
      : null,
    blocks: ((sets[1] as BlockRow[]) ?? [])
      .map(toBlock)
      .filter((block): block is BlockInput => block !== null),
  }
}

export type ArticleViews = {
  total: number
  last7: number
  last30: number
  daily: { day: string; views: number }[]
}

/**
 * Les vues d'un article : total, fenêtres glissantes, et détail par jour.
 *
 * Le total seul ne distinguerait pas un article populaire d'un article ancien : les
 * fenêtres à 7 et 30 jours sont ce qui rend le chiffre lisible.
 */
export async function getArticleViews(id: Buffer): Promise<ArticleViews> {
  const sets = await write.sets("get_article_views", [id])
  const totals = (
    sets[0] as { view_count: number; views_7d: number; views_30d: number }[]
  )?.[0]
  const daily = (sets[1] as { day: Date | string; views: number }[]) ?? []

  return {
    total: Number(totals?.view_count ?? 0),
    last7: Number(totals?.views_7d ?? 0),
    last30: Number(totals?.views_30d ?? 0),
    daily: daily.map((row) => ({
      day: isoDay(row.day),
      views: Number(row.views),
    })),
  }
}

/**
 * Les blocs, mis à la forme que la procédure attend.
 *
 * Elle reçoit une forme plate : `kind`, `text`, `lead`, `items` en JSON. Le passage
 * de l'union discriminée à cette forme est fait ici, une fois, plutôt que dans
 * l'action - c'est un détail de stockage, pas de validation.
 */
export function blocksToJson(blocks: BlockInput[]) {
  return blocks.map((block) => {
    if (block.kind === "numbered") {
      return { kind: block.kind, items: JSON.stringify(block.items) }
    }
    if (block.kind === "callout") {
      return { kind: block.kind, text: block.text, lead: block.lead }
    }
    return { kind: block.kind, text: block.text }
  })
}
