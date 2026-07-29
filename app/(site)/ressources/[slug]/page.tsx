import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticleReadingView } from "@/components/ressources/article-reading-view"
import { ViewCounter } from "@/components/ressources/view-counter"
import {
  getPublicArticle,
  listPublicArticleSlugs,
  listPublicArticles,
  relatedPublicArticles,
} from "@/lib/db/public-articles"
import { getPublicCase } from "@/lib/db/public-cases"

/**
 * Une minute, comme le reste du contenu lu en base. Littéral obligatoire : Next
 * analyse cet export statiquement. Voir la note de `app/(site)/realisations/page.tsx`.
 */
export const revalidate = 60

/** Un article publié après le build est rendu à la demande, puis mis en cache. */
export const dynamicParams = true

export async function generateStaticParams() {
  const items = await listPublicArticleSlugs()
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(
  props: PageProps<"/ressources/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const article = await getPublicArticle(slug)
  if (!article) {
    return {}
  }
  return {
    title: article.title,
    description: article.lead,
    authors: [{ name: article.author }],
    openGraph: { type: "article", publishedTime: article.publishedAt },
  }
}

export default async function ArticlePage(
  props: PageProps<"/ressources/[slug]">
) {
  const { slug } = await props.params
  const article = await getPublicArticle(slug)

  if (!article) {
    notFound()
  }

  // Les lectures suivantes et le cas lié partent en parallèle : ni l'un ni l'autre
  // ne dépend du résultat de l'autre.
  const [all, relatedCase] = await Promise.all([
    listPublicArticles(),
    article.relatedCase ? getPublicCase(article.relatedCase) : null,
  ])

  return (
    <>
      {/* Ne rend rien : signale une lecture, une fois par article et par session,
          après deux secondes de présence. Le comptage vient du navigateur parce que
          la page est prérendue et que son code ne s'exécute pas à chaque visite. */}
      <ViewCounter slug={article.slug} />

      <ArticleReadingView
        article={article}
        related={relatedPublicArticles(all, slug)}
        relatedCase={
          relatedCase
            ? { slug: relatedCase.slug, title: relatedCase.title }
            : undefined
        }
      />
    </>
  )
}
