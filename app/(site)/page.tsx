import { CaseList } from "@/components/home/case-list"
import { ExpertiseGrid } from "@/components/home/expertise-grid"
import { Hero } from "@/components/home/hero"
import { KpiBand } from "@/components/home/kpi-band"
import { MethodPreview } from "@/components/home/method-preview"
import { SocialProof } from "@/components/home/social-proof"
import { Testimonials } from "@/components/home/testimonials"
import { FinalCta } from "@/components/sections/final-cta"
import { listPublicCases } from "@/lib/db/public-cases"

/**
 * Accueil - une conversation en dix temps (Architecture UX, 05).
 *
 * Arc : affirmation (hero) → caution (preuve sociale) → quoi (expertises) →
 * comment (méthode) → preuve (réalisations, chiffres) → pairs (témoignages) →
 * demande (CTA final). Le rythme alterne section dense et section respirante,
 * et la demande n'arrive qu'après les trois objections levées.
 */
/**
 * Une minute, comme le hub. Littéral obligatoire : Next analyse cet export
 * statiquement. Voir la note de `app/(site)/realisations/page.tsx`.
 */
export const revalidate = 60

export default async function HomePage() {
  // Les mises en avant viennent de la base, avec repli sur le contenu statique.
  const featured = (await listPublicCases()).filter((item) => item.featured)

  return (
    <>
      <Hero />
      <SocialProof />
      <ExpertiseGrid />
      <MethodPreview />
      <CaseList cases={featured} />
      <KpiBand />
      <Testimonials />
      <FinalCta />
    </>
  )
}
