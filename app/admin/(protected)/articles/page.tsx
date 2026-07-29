import type { Metadata } from "next"

import { ArticleBoard } from "@/components/admin/article-board"
import { ArticleCreate } from "@/components/admin/article-create"
import { requireSession } from "@/lib/auth/session"
import { listArticles } from "@/lib/db/articles"

export const metadata: Metadata = { title: "Articles" }

export default async function AdminArticlesPage() {
  await requireSession()
  const articles = await listArticles()

  const published = articles.filter((item) => item.status === "published")
  const views = published.reduce((total, item) => total + item.viewCount, 0)

  return (
    <div className="grid max-w-4xl gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
            Articles
          </h1>
          <p className="text-[0.9rem] text-body">
            {articles.length === 0
              ? "Aucun article pour l'instant."
              : `${articles.length} article${articles.length > 1 ? "s" : ""}, dont ${published.length} en ligne${
                  views > 0
                    ? ` · ${views.toLocaleString("fr-FR")} vue${views > 1 ? "s" : ""} au total`
                    : ""
                }.`}
          </p>
        </div>
        <ArticleCreate />
      </header>

      <ArticleBoard articles={articles} />
    </div>
  )
}
