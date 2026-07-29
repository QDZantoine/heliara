import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CaseStudyView } from "@/components/realisations/case-study-view"
import { caseStudies, getCase, getNextCase } from "@/lib/content/cases"

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata(
  props: PageProps<"/realisations/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const study = getCase(slug)
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
  const study = getCase(slug)
  if (!study) {
    notFound()
  }

  // Le rendu vit dans `CaseStudyView`, partagé avec l'aperçu de brouillon de
  // l'administration : c'est ce qui garantit que l'aperçu est le rendu exact de la
  // page publiée, et non une approximation à tenir à jour.
  return <CaseStudyView study={study} next={getNextCase(slug)} />
}
