import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExpertiseServiceView } from "@/components/expertises/expertise-service-view"
import { getPublicCase } from "@/lib/db/public-cases"
import {
  getPublicService,
  listPublicServiceSlugs,
} from "@/lib/db/public-expertises"

/**
 * Une minute, comme le reste du contenu lu en base. Littéral obligatoire : Next
 * analyse cet export statiquement.
 */
export const revalidate = 60

/** Un service publié après le build est rendu à la demande, puis mis en cache. */
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await listPublicServiceSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  props: PageProps<"/expertises/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const service = await getPublicService(slug)
  if (!service) {
    return {}
  }
  return { title: service.title, description: service.tagline }
}

export default async function ExpertiseServicePage(
  props: PageProps<"/expertises/[slug]">
) {
  const { slug } = await props.params
  const service = await getPublicService(slug)

  if (!service) {
    notFound()
  }

  const relatedCase = service.relatedCase
    ? await getPublicCase(service.relatedCase)
    : null

  return (
    <ExpertiseServiceView
      service={service}
      family={{ label: service.familyLabel }}
      relatedCase={
        relatedCase
          ? {
              slug: relatedCase.slug,
              title: relatedCase.title,
              sector: relatedCase.sector,
              summary: relatedCase.summary,
              figure: relatedCase.figure,
              measure: relatedCase.measure,
            }
          : undefined
      }
    />
  )
}
