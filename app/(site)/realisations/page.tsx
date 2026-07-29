import type { Metadata } from "next"

import { Container } from "@/components/primitives/container"
import { Section } from "@/components/primitives/section"
import { CaseGrid } from "@/components/realisations/case-grid"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import { caseSectors, caseStudies } from "@/lib/content/cases"

export const metadata: Metadata = {
  title: "Réalisations",
  description:
    "Des produits en production, pas un portfolio : contexte, décisions et résultats mesurés pour chaque étude de cas.",
}

export default function RealisationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Réalisations"
        title="Des produits en production, pas un portfolio"
        lead="Chaque étude de cas raconte un problème réel, des décisions, et des résultats mesurés. Filtrez par ce qui vous ressemble."
      />

      <Section space="sm" className="pt-0 md:pt-0 lg:pt-0">
        <Container>
          <CaseGrid cases={caseStudies} sectors={caseSectors} />
        </Container>
      </Section>

      <CtaBand title="Le prochain cas pourrait être le vôtre." />
    </>
  )
}
