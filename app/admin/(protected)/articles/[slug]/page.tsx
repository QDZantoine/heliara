import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticleEditor } from "@/components/admin/article-editor"
import { requireSession } from "@/lib/auth/session"
import { getArticle, getArticleViews } from "@/lib/db/articles"
import { listCases } from "@/lib/db/cases"
import { toId } from "@/lib/db/id"

export async function generateMetadata(
  props: PageProps<"/admin/articles/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const item = await getArticle({ slug })
  return { title: item ? item.title : "Article introuvable" }
}

export default async function EditArticlePage(
  props: PageProps<"/admin/articles/[slug]">
) {
  await requireSession()
  const { slug } = await props.params
  const item = await getArticle({ slug })

  if (!item) {
    notFound()
  }

  // Les vues et la liste des réalisations partent en parallèle : ni l'une ni l'autre
  // ne dépend du résultat de l'autre.
  const [views, cases] = await Promise.all([
    getArticleViews(toId(item.id)),
    listCases(),
  ])

  return (
    <ArticleEditor
      item={item}
      views={views}
      caseSlugs={cases.map((one) => one.slug)}
    />
  )
}
