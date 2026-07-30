import { Container } from "@/components/primitives/container"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { kpis } from "@/lib/content/kpis"

/**
 * S7 - respiration après la densité du portfolio. Grille 2×2 sur mobile,
 * quatre colonnes au-delà. Aucune animation nécessaire à la lecture.
 */
function KpiBand() {
  return (
    <Section
      tone="surface"
      space="sm"
      aria-labelledby="principes-conception-titre"
    >
      <Container>
        <div className="mx-auto mb-10 max-w-[42rem] text-center md:mb-12">
          <h2
            id="principes-conception-titre"
            className="text-[clamp(1.75rem,7vw,3.25rem)] leading-[1.08] font-bold"
          >
            Notre manière de concevoir
          </h2>
          <p className="mt-4 text-[1rem] leading-relaxed text-body md:text-[1.0625rem]">
            Des engagements simples qui guident chacun de nos projets, de la
            première réunion jusqu&apos;à la mise en production.
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {kpis.map((kpi, index) => (
            <Reveal
              key={kpi.label}
              delay={index * 70}
              className="hel-principle-card border-l-2 border-brand pl-4 md:pl-5"
            >
              <dt className="text-[1rem] font-semibold text-ink">
                {kpi.label}
              </dt>
              <dd>
                <span
                  className={
                    kpi.value === "∞"
                      ? "mt-4 block font-display text-[clamp(3.5rem,14vw,5.5rem)] leading-[0.78] font-extrabold text-brand"
                      : "mt-4 block font-display text-[clamp(2.25rem,8vw,3.25rem)] leading-none font-extrabold text-ink"
                  }
                >
                  {kpi.value}
                </span>
                <span className="mt-4 block text-[0.9rem] leading-relaxed text-body">
                  {kpi.description}
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
