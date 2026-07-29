import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Eye } from "lucide-react"

import { ExpertiseServiceView } from "@/components/expertises/expertise-service-view"
import { requireSession } from "@/lib/auth/session"
import { getService } from "@/lib/db/expertises"

export const metadata: Metadata = { title: "Aperçu" }

/**
 * Aperçu d'un service, brouillon compris.
 *
 * Servi par l'administration pour la même raison que les autres aperçus : le
 * déploiement public utilise `app_read`, à qui la base refuse de lire un brouillon.
 * `ExpertiseServiceView` est partagé avec la page publiée, donc le rendu ne peut pas
 * diverger.
 */
export default async function ServicePreviewPage(
  props: PageProps<"/admin/expertises/[slug]/apercu">
) {
  await requireSession()
  const { slug } = await props.params
  const item = await getService({ slug })

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
              ? "de la page en ligne"
              : "d'un brouillon, invisible du public"}
          </span>
        </p>
        <Link
          href={`/admin/expertises/${item.slug}`}
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
        <ExpertiseServiceView
          service={item}
          family={{ label: item.familyLabel }}
        />
      </div>
    </div>
  )
}
