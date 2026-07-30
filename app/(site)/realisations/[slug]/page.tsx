import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CaseStudyView } from "@/components/realisations/case-study-view"
import { JsonLd } from "@/components/seo/json-ld"
import {
  getNextPublicCase,
  getPublicCase,
  listPublicCaseSlugs,
} from "@/lib/db/public-cases"
import { breadcrumbNode, caseStudyNode, graph } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"

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
  return pageMetadata({
    title: study.title,
    description: study.summary,
    path: `/realisations/${slug}`,
    // `article` et non `website` : une étude de cas est un contenu daté et signé.
    // Le type change la façon dont les réseaux la présentent - avec un auteur et une
    // date plutôt qu'en simple lien de site.
    type: "article",
    // L'image de tête sert de carte de partage quand la fiche en a une, et remplace
    // alors la carte générée. Une capture de l'interface livrée vaut mieux qu'un
    // titre sur fond orange.
    ...(study.heroMedia
      ? {
          image: {
            url: study.heroMedia.url,
            alt: study.heroMedia.alt || study.title,
            ...(study.heroMedia.width ? { width: study.heroMedia.width } : {}),
            ...(study.heroMedia.height
              ? { height: study.heroMedia.height }
              : {}),
          },
        }
      : {}),
  })
}

export default async function CaseStudyPage(
  props: PageProps<"/realisations/[slug]">
) {
  const { slug } = await props.params
  const study = await getPublicCase(slug)

  if (!study) {
    notFound()
  }

  return (
    <>
      {/*
        Le graphe est posé ici et non dans `CaseStudyView` : la vue est partagée avec
        l'aperçu de brouillon de l'administration, où des données structurées
        n'auraient aucun sens - la page n'est pas publique, et l'`@id` désignerait une
        URL qui ne répond pas.

        Le fil d'Ariane reprend mot pour mot celui que `CaseStudyView` affiche.
      */}
      <JsonLd
        data={graph([
          caseStudyNode({
            path: `/realisations/${slug}`,
            title: study.title,
            heroTitle: study.heroTitle,
            description: study.summary,
            sector: study.sector,
            year: study.year,
            imageUrl: study.heroMedia?.url,
            results: study.results,
          }),
          breadcrumbNode([
            { label: "Réalisations", path: "/realisations" },
            { label: study.title },
          ]),
        ])}
      />
      {/*
        Le rendu vit dans `CaseStudyView`, partagé avec l'aperçu de brouillon : c'est
        ce qui garantit que l'aperçu est le rendu exact de la page publiée, et non une
        approximation à tenir à jour.
      */}
      <CaseStudyView study={study} next={await getNextPublicCase(slug)} />
    </>
  )
}
