import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExpertiseServiceView } from "@/components/expertises/expertise-service-view"
import { JsonLd } from "@/components/seo/json-ld"
import { getPublicCase } from "@/lib/db/public-cases"
import {
  getPublicService,
  listPublicServiceSlugs,
} from "@/lib/db/public-expertises"
import { breadcrumbNode, faqNode, graph, serviceNode } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"

/**
 * Une minute, comme le reste du contenu lu en base. Littéral obligatoire : Next
 * analyse cet export statiquement.
 */
export const revalidate = 60

/** Un service publié après le build est rendu à la demande, puis mis en cache. */
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await listPublicServiceSlugs()
  // `listPublic*Slugs` rend des objets et non des chaînes, depuis qu'il porte aussi la
  // date de modification pour le plan du site.
  return slugs.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(
  props: PageProps<"/expertises/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const service = await getPublicService(slug)
  if (!service) {
    return {}
  }
  /*
    `pageMetadata`, comme partout ailleurs. Cette page composait ses métadonnées à la
    main, et y perdait l'URL canonique - le même oubli que la page d'article, et pour la
    même raison : les deux routes dynamiques écrites avant le socle SEO ne sont jamais
    repassées dessus.
  */
  return pageMetadata({
    title: service.title,
    description: service.tagline,
    path: `/expertises/${service.slug}`,
  })
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
    <>
      {/*
        Les données structurées du service.

        `Service` porte l'offre, ses livrables en `OfferCatalog` et la zone servie ;
        `FAQPage` porte les objections. Ce second nœud n'apporte plus de vignette dans
        les résultats depuis que Google a restreint le résultat enrichi FAQ en 2023, mais
        il reste ce qu'un moteur générateur reprend le plus volontiers : des paires
        question-réponse explicites, qu'il n'a rien à reformuler.

        Il n'est posé que si la page en affiche une. Baliser une FAQ absente de l'écran
        serait exactement l'abus que la règle du contenu visible interdit.
      */}
      <JsonLd
        data={graph([
          serviceNode({
            path: `/expertises/${service.slug}`,
            title: service.title,
            tagline: service.tagline,
            problem: service.problem,
            familyLabel: service.familyLabel,
            deliverables: service.deliverables,
          }),
          ...(service.faq.length > 0
            ? [faqNode(`/expertises/${service.slug}`, service.faq)]
            : []),
          breadcrumbNode([
            { label: "Expertises", path: "/expertises" },
            { label: service.title },
          ]),
        ])}
      />

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
    </>
  )
}
