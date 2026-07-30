import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Eye } from "lucide-react"

import {
  ArticleReadingView,
  toRenderableBody,
} from "@/components/ressources/article-reading-view"
import { requireSession } from "@/lib/auth/session"
import { getArticle } from "@/lib/db/articles"

export const metadata: Metadata = { title: "Aperçu" }

/**
 * Aperçu d'un article, brouillon compris.
 *
 * Servi par l'administration pour la même raison que celui des réalisations : le
 * déploiement public utilise `app_read`, à qui la base refuse de lire un brouillon.
 * Le rendu est celui de la page publiée, `ArticleReadingView` étant partagé - il ne
 * peut donc pas diverger.
 *
 * Sans rebond : `related` et `relatedCase` sont laissés vides. On ne regarde qu'un
 * article dans un aperçu, et un rebond vers un autre brouillon n'aurait pas de sens.
 */
export default async function ArticlePreviewPage(
  props: PageProps<"/admin/articles/[slug]/apercu">
) {
  await requireSession()
  const { slug } = await props.params
  const item = await getArticle({ slug })

  if (!item) {
    notFound()
  }

  return (
    <div className="-mx-5 -my-8 md:-mx-8 lg:-mx-10 lg:-my-10">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-inverse px-5 py-3 text-inverse-fg md:px-8">
        <p className="flex items-center gap-2 text-[0.845rem]">
          <Eye aria-hidden="true" className="size-4" strokeWidth={1.5} />
          Aperçu
          <span className="text-inverse-fg-muted">
            {item.status === "published"
              ? "de l'article en ligne"
              : "d'un brouillon, invisible du public"}
          </span>
        </p>
        <Link
          href={`/admin/articles/${item.slug}`}
          className="inline-flex min-h-9 items-center gap-1.5 text-[0.845rem] font-medium text-inverse-brand hover:underline"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={1.75}
          />
          Revenir à l&apos;édition
        </Link>
      </div>

      <div className="bg-page">
        <ArticleReadingView
          article={{
            slug: item.slug,
            category: item.category,
            title: item.title,
            lead: item.lead,
            author: item.author,
            authorRole: item.authorRole,
            authorInitials: item.authorInitials,
            date: item.dateLabel,
            readingTime: item.readingTime,
            // Sinon l'aperçu cesse d'être le rendu exact de la page publiée.
            heroMedia: item.heroMedia ?? undefined,
            body: toRenderableBody(item.blocks),
          }}
        />
      </div>
    </div>
  )
}
