import { CaseList } from "@/components/home/case-list"
import { ExpertiseGrid } from "@/components/home/expertise-grid"
import { Hero } from "@/components/home/hero"
import { KpiBand } from "@/components/home/kpi-band"
import { MethodPreview } from "@/components/home/method-preview"
import { SocialProof } from "@/components/home/social-proof"
import { Testimonials } from "@/components/home/testimonials"
import { FinalCta } from "@/components/sections/final-cta"

/**
 * Accueil — une conversation en dix temps (Architecture UX, 05).
 *
 * Arc : affirmation (hero) → caution (preuve sociale) → quoi (expertises) →
 * comment (méthode) → preuve (réalisations, chiffres) → pairs (témoignages) →
 * demande (CTA final). Le rythme alterne section dense et section respirante,
 * et la demande n'arrive qu'après les trois objections levées.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <ExpertiseGrid />
      <MethodPreview />
      <CaseList />
      <KpiBand />
      <Testimonials />
      <FinalCta />
    </>
  )
}
