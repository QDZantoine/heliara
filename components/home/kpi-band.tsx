import { Container } from "@/components/primitives/container"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { kpis } from "@/lib/content/kpis"

/**
 * S7 — respiration après la densité du portfolio. Grille 2×2 sur mobile,
 * quatre colonnes au-delà. Aucune animation nécessaire à la lecture.
 */
function KpiBand() {
  return (
    <Section tone="surface" space="sm" aria-label="Chiffres clés">
      <Container>
        <dl className="grid grid-cols-2 gap-6 md:gap-8 lg:grid-cols-4">
          {kpis.map((kpi, index) => (
            <Reveal
              key={kpi.label}
              delay={index * 60}
              className="border-l-2 border-brand pl-4 md:pl-5"
            >
              <dt className="sr-only">{kpi.label}</dt>
              <dd>
                <span className="block font-display text-[clamp(1.75rem,7vw,2.875rem)] leading-none font-extrabold tracking-[-0.03em] text-ink">
                  {kpi.value}
                </span>
                <span className="mt-2 block text-[0.845rem] text-body">
                  {kpi.label}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  )
}

export { KpiBand }
