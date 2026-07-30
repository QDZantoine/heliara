import type { Metadata } from "next"

import { Container } from "@/components/primitives/container"
import { Section } from "@/components/primitives/section"
import { CaseGrid } from "@/components/realisations/case-grid"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import { listPublicCases, listPublicSectors } from "@/lib/db/public-cases"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Réalisations",
  description:
    "Des produits en production, pas un portfolio : contexte, décisions et résultats mesurés pour chaque étude de cas.",
  path: "/realisations",
})

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
