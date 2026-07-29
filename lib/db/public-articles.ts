import "server-only"

import { read } from "@/lib/db/call"
import {
  articles as staticArticles,
  type Article,
  type ArticleBlock,
} from "@/lib/content/articles"
import { publicUrl } from "@/lib/s3"

/**
 * Lecture des articles par le **site public**.
 *
 * Même contrat que `lib/db/public-cases.ts` : seules les procédures `pub_*`, et un
 * repli explicite sur `lib/content/articles.ts` quand la base est vide ou
 * injoignable. Le repli est silencieux pour le visiteur et bruyant dans les
 * journaux.
 */

export const ARTICLES_REVALIDATE_SECONDS = 60

type ArticleRow = {
  slug: string
  category: Article["category"]
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
  hero_object_key: string | null
  hero_alt: string | null
  hero_width: number | null
  hero_height: number | null
  published_at: number | null
  updated_at: number
}

type BlockRow = {
  kind: ArticleBlock["kind"]
  text: string | null
  lead: string | null
  items: string | null
}

export type PublicArticle = Article & {
  heroMedia?: {
    url: string
    alt: string
    width: number | null
    height: number | null
  }
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

function isoDay(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return typeof value === "string" ? value.slice(0, 10) : ""
}

function toArticle(row: ArticleRow, body: ArticleBlock[]): PublicArticle {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    lead: text(row.lead),
    author: text(row.author),
    authorRole: text(row.author_role),
    authorInitials: text(row.author_initials),
    date: text(row.date_label),
    publishedAt: isoDay(row.published_on),
    readingTime: text(row.reading_time),
    featured: row.featured === 1,
    relatedCase: row.related_case_slug ?? undefined,
    body,
    heroMedia: row.hero_object_key
      ? {
          url: publicUrl(row.hero_object_key),
          alt: text(row.hero_alt),
          width: row.hero_width === null ? null : Number(row.hero_width),
          height: row.hero_height === null ? null : Number(row.hero_height),
        }
      : undefined,
  }
}

/** Reconstruit un bloc typé depuis sa forme plate en base. */
function toBlock(row: BlockRow): ArticleBlock | null {
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
        // Le numéro est optionnel en base - il l'est à la saisie - et requis à
        // l'affichage : le défaut est posé ici, à la frontière.
        return {
          kind: "numbered",
          items: items.map((item, index) => ({
            num: item.num?.trim() || String(index + 1).padStart(2, "0"),
            title: item.title,
            text: item.text,
          })),
        }
      } catch {
        return null
      }
    }
    default:
      return null
  }
}

function fallback(reason: string, error?: unknown) {
  console.warn(
    `Articles : repli sur le contenu statique (${reason}).`,
    error ?? ""
  )
}

/** Le flux publié, du plus récent au plus ancien. Sans corps. */
export async function listPublicArticles(): Promise<PublicArticle[]> {
  try {
    const rows = await read.rows<ArticleRow>("pub_list_articles")
    if (rows.length === 0) {
      fallback("aucun article publié")
      return staticArticles
    }
    return rows.map((row) => toArticle(row, []))
  } catch (error) {
    fallback("base injoignable", error)
    return staticArticles
  }
}

/**
 * Un article publié, corps compris.
 * `null` sur un brouillon comme sur un article inexistant, sans les distinguer.
 */
export async function getPublicArticle(
  slug: string
): Promise<PublicArticle | null> {
  try {
    const sets = await read.sets("pub_get_article", [slug])
    const row = (sets[0] as ArticleRow[] | undefined)?.[0]

    if (!row) {
      const stat = staticArticles.find((item) => item.slug === slug)
      if (stat) {
        fallback(`article « ${slug} » absent de la base`)
        return stat
      }
      return null
    }

    const body = ((sets[1] as BlockRow[]) ?? [])
      .map(toBlock)
      .filter((block): block is ArticleBlock => block !== null)

    return toArticle(row, body)
  } catch (error) {
    fallback(`base injoignable pour « ${slug} »`, error)
    return staticArticles.find((item) => item.slug === slug) ?? null
  }
}

/**
 * Les articles à prérendre : union de la base et du statique.
 *
 * La date de publication accompagne le slug parce que la procédure la rend déjà, et
 * que le plan du site en a besoin pour `lastModified`. La demander séparément
 * coûterait un appel par article pour une information qu'on a sous la main.
 */
export async function listPublicArticleSlugs(): Promise<
  { slug: string; publishedOn: string }[]
> {
  const statics = staticArticles.map((item) => ({
    slug: item.slug,
    publishedOn: item.publishedAt,
  }))

  try {
    const rows = await read.rows<{
      slug: string
      published_on: Date | string | null
    }>("pub_list_article_slugs")

    const seen = new Map(
      rows.map((row) => [row.slug, isoDay(row.published_on)])
    )
    // Le statique ne remplace jamais une entrée de la base : elle est plus à jour.
    for (const item of statics) {
      if (!seen.has(item.slug)) {
        seen.set(item.slug, item.publishedOn)
      }
    }
    return [...seen].map(([slug, publishedOn]) => ({ slug, publishedOn }))
  } catch (error) {
    fallback("base injoignable au prérendu", error)
    return statics
  }
}

/** Les catégories représentées, « Tout » en tête, pour la rangée de filtres. */
export function publicArticleCategories(items: PublicArticle[]): string[] {
  return ["Tout", ...new Set(items.map((item) => item.category))]
}

/**
 * Deux suggestions de lecture, jamais l'article courant.
 * Même règle que le contenu statique : la même catégorie d'abord, puis le plus
 * récent.
 */
export function relatedPublicArticles(
  items: PublicArticle[],
  slug: string,
  count = 2
): PublicArticle[] {
  const current = items.find((item) => item.slug === slug)
  return items
    .filter((item) => item.slug !== slug)
    .sort((a, b) => {
      const sameCategory =
        Number(b.category === current?.category) -
        Number(a.category === current?.category)
      return sameCategory || b.publishedAt.localeCompare(a.publishedAt)
    })
    .slice(0, count)
}

/**
 * Compte une vue.
 *
 * **La seule écriture que le site public sache faire**, et elle est volontairement
 * indolore : toute erreur est avalée. Un compteur qui casse ne doit pas casser la
 * lecture d'un article, et le visiteur n'a rien à savoir d'une statistique.
 */
export async function countArticleView(slug: string): Promise<void> {
  try {
    await read.void("pub_count_article_view", [slug])
  } catch (error) {
    console.warn("Articles : comptage de vue en échec.", error)
  }
}
