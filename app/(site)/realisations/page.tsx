import type { Metadata } from "next"

import { Container } from "@/components/primitives/container"
import { JsonLd } from "@/components/seo/json-ld"
import { Section } from "@/components/primitives/section"
import { CaseGrid } from "@/components/realisations/case-grid"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import { caseHref } from "@/lib/content/cases"
import { listPublicCases, listPublicSectors } from "@/lib/db/public-cases"
import { collectionPageNode, graph } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"

/**
 * Le titre, la description et le chemin de la page, en un seul endroit.
 *
 * Hissés en constante parce que **deux consommateurs les lisent** : les métadonnées
 * et le nœud `CollectionPage` des données structurées. Les écrire deux fois, c'est
 * garantir qu'ils divergeront - et un balisage qui contredit la page est un écart
 * signalable, pas un détail.
 */
const page = {
  title: "Réalisations",
  description:
    "Des produits en production, pas un portfolio : contexte, décisions et résultats mesurés pour chaque étude de cas.",
  path: "/realisations",
}

export const metadata: Metadata = pageMetadata(page)

/**
 * Fraîcheur du contenu public : une minute.
 *
 * **Un littéral et non la constante partagée**, parce que Next analyse les exports
 * de configuration de segment statiquement, sans évaluer le module : une valeur
 * importée fait échouer le build sur « Invalid segment configuration export ».
 * `CASES_REVALIDATE_SECONDS` documente la valeur au même endroit que la lecture,
 * les deux doivent rester d'accord.
 *
 * **Pourquoi le temps et non une invalidation par tag.** L'administration et le
 * site public sont deux processus : le cache de l'un n'est pas celui de l'autre, et
 * un `updateTag` écrit côté administration ne franchit pas la frontière. Une
 * modification apparaît donc en ligne au bout d'une minute au plus.
 *
 * En développement il n'y a pas de cache : le changement se voit immédiatement.
 */
export const revalidate = 60

export default async function RealisationsPage() {
  const cases = await listPublicCases()
  const sectors = await listPublicSectors(cases)

  return (
    <>
      {/* Une page de section : `CollectionPage` dit à un moteur que cette adresse est un
          point d'entrée vers une collection, et non un article de plus. Le titre et la
          description viennent de `page`, la même source que les métadonnées. */}
      {/*
          `mainEntity` énumère les fiches affichées, dans l'ordre de la grille. La liste
          non filtrée, toujours : les filtres se jouent côté navigateur sur cette même
          adresse, et baliser une sélection décrirait une page plus courte que la
          canonique qu'on déclare.
      */}
      <JsonLd
        data={graph([
          collectionPageNode({
            ...page,
            items: cases.map((one) => ({
              name: one.title,
              path: caseHref(one.slug),
            })),
          }),
        ])}
      />

      <PageHero
        eyebrow="Réalisations"
        title="Des produits en production, pas un portfolio"
        lead="Chaque étude de cas raconte un problème réel, des décisions, et des résultats mesurés. Filtrez par ce qui vous ressemble."
      />

      <Section space="sm" className="pt-0 md:pt-0 lg:pt-0">
        <Container>
          <CaseGrid cases={cases} sectors={sectors} />
        </Container>
      </Section>

      <CtaBand title="Le prochain cas pourrait être le vôtre." />
    </>
  )
}
