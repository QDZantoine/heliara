import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Eye } from "lucide-react"

import { CaseStudyView } from "@/components/realisations/case-study-view"
import { requireSession } from "@/lib/auth/session"
import { getCase } from "@/lib/db/cases"

export const metadata: Metadata = { title: "Aperçu" }

/**
 * Aperçu d'une fiche, brouillon compris.
 *
 * **Il est servi par le processus d'administration, et il ne peut pas en être
 * autrement.** Le déploiement public utilise `app_read`, à qui le privilège de
 * lire un brouillon est refusé par la base : la procédure qui les montre lui est
 * fermée, et `pub_get_case_study` filtre sur le statut sans paramètre pour
 * l'annuler. Un aperçu servi par le site public exigerait donc de percer cette
 * séparation, ce qui reviendrait à annuler la garantie qu'elle apporte.
 *
 * Il est ici derrière la session, sur le port de l'administration, donc derrière le
 * VPN. Aucun lien signé à faire expirer, aucune route publique conditionnelle : la
 * seule façon de voir un brouillon est d'avoir le droit de l'éditer.
 *
 * **Le rendu est celui de la page publiée**, pas une imitation : le même
 * `CaseStudyView`, les mêmes composants, le même CSS. Il ne peut donc pas diverger.
 */
export default async function CasePreviewPage(
  props: PageProps<"/admin/realisations/[slug]/apercu">
) {
  await requireSession()
  const { slug } = await props.params
  const item = await getCase({ slug })

  if (!item) {
    notFound()
  }

  return (
    <div className="-mx-5 -my-8 md:-mx-8 lg:-mx-10 lg:-my-10">
      {/* Bandeau d'aperçu : il doit être impossible de croire qu'on regarde le
          site en ligne. */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-inverse px-5 py-3 text-inverse-fg md:px-8">
        <p className="flex items-center gap-2 text-[0.845rem]">
          <Eye aria-hidden="true" className="size-4" strokeWidth={1.5} />
          Aperçu
          <span className="text-inverse-fg-muted">
            {item.status === "published"
              ? "de la fiche en ligne"
              : "d'un brouillon, invisible du public"}
          </span>
        </p>
        <Link
          href={`/admin/realisations/${item.slug}`}
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

      {/* Le fond de page du site, que la coque d'administration ne pose pas. */}
      <div className="bg-page">
        <CaseStudyView
          empty={
            <p className="mb-13 rounded-lg border border-dashed border-line-strong px-5 py-8 text-center text-[0.9rem] text-label">
              Aucun chapitre pour l&apos;instant. La publication en exige au
              moins un, avec les deux résumés.
            </p>
          }
          study={{
            slug: item.slug,
            title: item.title,
            heroTitle: item.heroTitle,
            badge: item.badge,
            accent: item.accent,
            // L'aperçu doit montrer la couverture, sinon il cesse d'être le rendu exact
            // de la page publiée. `CaseMediaRef` se conforme à `MediaRef`.
            heroMedia: item.heroMedia ?? undefined,
            // La galerie aussi, pour la même raison : l'aperçu est le rendu exact.
            gallery: item.gallery,
            resultsLabel: item.resultsLabel,
            meta: item.meta,
            chapters: item.chapters.map((chapter) => ({
              num: chapter.num,
              title: chapter.title,
              text: chapter.text,
              callout: chapter.callout || undefined,
            })),
            results: item.results,
            testimonial: item.testimonial,
            lessons: item.lessons.map((lesson) => lesson.text),
          }}
        />
      </div>
    </div>
  )
}
