import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CaseStudyView } from "@/components/realisations/case-study-view"
import {
  getNextPublicCase,
  getPublicCase,
  listPublicCaseSlugs,
} from "@/lib/db/public-cases"

/**
 * Une minute, comme le hub. Littéral obligatoire : Next analyse cet export
 * statiquement. Voir la note de `app/(site)/realisations/page.tsx`.
 */
export const revalidate = 60

/**
 * Une fiche publiée après le build est rendue à la demande, puis mise en cache.
 * Le passer à `false` obligerait à redéployer pour qu'une nouvelle réalisation
 * apparaisse, ce qui viderait l'administration de son intérêt.
 */
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await listPublicCaseSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  props: PageProps<"/realisations/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const study = await getPublicCase(slug)
  if (!study) {
    return {}
  }
  return {
    title: study.title,
    description: study.summary,
  }
}

export default async function CaseStudyPage(
  props: PageProps<"/realisations/[slug]">
) {
  const { slug } = await props.params
  const study = await getPublicCase(slug)

  if (!study) {
    notFound()
  }

  // Le rendu vit dans `CaseStudyView`, partagé avec l'aperçu de brouillon de
  // l'administration : c'est ce qui garantit que l'aperçu est le rendu exact de la
  // page publiée, et non une approximation à tenir à jour.
  return <CaseStudyView study={study} next={await getNextPublicCase(slug)} />
}
