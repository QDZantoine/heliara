import type { Metadata } from "next"

import { Container } from "@/components/primitives/container"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { FinalCta } from "@/components/sections/final-cta"
import { PageHero } from "@/components/sections/page-hero"
import { MethodGaugeCard } from "@/components/visuals/method-gauge"
import { commitments, methodPhases } from "@/lib/content/method"
import { cn } from "@/lib/utils"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Méthode",
  description:
    "Huit temps, des livrables nommés, des jalons courts : ce qui se passe exactement quand vous travaillez avec nous.",
  path: "/methode",
})

export default function MethodePage() {
  return (
    <>
      <div className="border-b border-line">
        <PageHero
          eyebrow="Méthode"
          title="Le risque projet n’est pas une fatalité. C’est un défaut de méthode"
          lead="Huit temps, des livrables nommés, des jalons courts. Voici exactement ce qui se passe quand vous travaillez avec nous et ce que vous voyez à chaque étape."
        />
      </div>

      {/* Frise en zigzag sur un rail central au-delà de 900 px. En dessous, le
          rail disparaît et chaque temps se lit en colonne (Responsive
          Guidelines 09, ligne « Frise Méthode »). */}
      <Section space="md" aria-label="Les huit temps de la méthode">
        <Container className="relative max-w-[68.75rem]">
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-1/2 hidden w-px bg-[linear-gradient(180deg,transparent,var(--hel-line-strong)_6%,var(--hel-line-strong)_94%,transparent)] menu:block"
          />
          <ol className="grid gap-11">
            {methodPhases.map((phase, index) => {
              const textFirst = index % 2 === 0
              return (
                <li key={phase.num}>
                  <Reveal className="relative grid items-center gap-4 menu:grid-cols-2 menu:gap-18">
                    <span
                      aria-hidden="true"
                      className="z-1 mb-2.5 inline-flex size-8.5 items-center justify-center rounded-full border-[1.5px] border-brand bg-page font-mono text-[0.6875rem] text-brand-text menu:absolute menu:top-1/2 menu:left-1/2 menu:mb-0 menu:-translate-x-1/2 menu:-translate-y-1/2"
                    >
                      {phase.num}
                    </span>

                    <div
                      className={cn(
                        !textFirst && "menu:order-2 menu:text-left",
                        textFirst && "menu:text-right"
                      )}
                    >
                      <h2 className="mb-2.5 text-[clamp(1.375rem,5.5vw,1.75rem)] font-bold">
                        {phase.title}
                      </h2>
                      <p className="mb-3 text-[0.9rem] leading-relaxed text-body">
                        {phase.text}
                      </p>
                      <p className="text-[0.78rem] text-label">
                        <span className="font-semibold text-body">
                          Vous voyez :
                        </span>{" "}
                        {phase.deliverable}
                      </p>
                    </div>

                    <div className={cn(!textFirst && "menu:order-1")}>
                      <MethodGaugeCard
                        title={phase.gaugeTitle}
                        gauges={phase.gauges}
                      />
                    </div>
                  </Reveal>
                </li>
              )
            })}
          </ol>
        </Container>
      </Section>

      <Section tone="surface" space="md" aria-labelledby="engagements">
        <Container>
          <Reveal>
            <h2
              id="engagements"
              className="mb-9 max-w-[35rem] text-[clamp(1.625rem,6vw,2.375rem)] font-bold"
            >
              Ce sur quoi nous nous engageons par écrit.
            </h2>
          </Reveal>
          <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
            {commitments.map((commitment, index) => (
              <li key={commitment.title} className="flex">
                <Reveal delay={index * 70} className="flex w-full">
                  <div className="w-full rounded-lg border border-line bg-page p-6">
                    <span
                      aria-hidden="true"
                      className="mb-4 block h-0.5 w-8 bg-brand"
                    />
                    <h3 className="mb-2 font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
                      {commitment.title}
                    </h3>
                    <p className="text-[0.845rem] leading-relaxed text-body">
                      {commitment.text}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <FinalCta
        title="Voyons ce que ça donne sur votre projet"
        intro="Un premier échange suffit pour poser un pré-cadrage honnête : périmètre, risques, ordre de grandeur."
        action="Parlons de votre projet"
      />
    </>
  )
}
