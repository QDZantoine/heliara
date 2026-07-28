import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { CaseSketch } from "@/components/visuals/case-sketch"
import { featuredCases } from "@/lib/content/cases"
import { cn } from "@/lib/utils"

/**
 * S6 — la preuve centrale, placée quand le visiteur sait déjà quoi et comment.
 * Le visuel alterne de côté un cas sur deux ; sur mobile, tout s'empile avec le
 * texte en premier.
 */
function CaseList() {
  return (
    <Section
      id="realisations"
      space="lg"
      className="lg:pt-15"
      aria-labelledby="realisations-titre"
    >
      <Container>
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-12">
          <div className="max-w-[35rem]">
            <Eyebrow className="mb-4">Réalisations</Eyebrow>
            <h2
              id="realisations-titre"
              className="text-[clamp(1.75rem,7vw,3.25rem)] leading-[1.08] font-bold"
            >
              Des produits en production.
            </h2>
          </div>
          <Link
            href="/realisations"
            className="inline-flex min-h-11 items-center gap-1.5 text-[0.94rem] font-medium whitespace-nowrap text-brand-text"
          >
            Toutes nos réalisations
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </Reveal>

        <ul className="grid gap-5">
          {featuredCases.map((study, index) => {
            const visualFirst = index % 2 === 1
            return (
              <li key={study.slug}>
                <Reveal>
                  <Link
                    href={`/realisations/${study.slug}`}
                    className="grid overflow-hidden rounded-lg border border-line bg-surface transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-[3px] hover:shadow-3 active:translate-y-0 lg:grid-cols-2"
                  >
                    <div
                      className={cn(
                        "flex flex-col gap-3.5 p-6 md:p-9",
                        visualFirst && "lg:order-2"
                      )}
                    >
                      <span className="self-start rounded-xs bg-info-subtle px-2.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] text-info-text uppercase">
                        {study.sector}
                      </span>
                      <h3 className="font-display text-[clamp(1.25rem,5.5vw,1.625rem)] font-bold tracking-[-0.02em] text-ink">
                        {study.title}
                      </h3>
                      <p className="max-w-[25rem] text-[0.9rem] leading-relaxed text-body">
                        {study.teaser}
                      </p>
                      <p className="mt-auto flex items-baseline gap-2.5 border-t border-line pt-3.5">
                        <span className="font-display text-[1.875rem] font-extrabold tracking-[-0.02em] text-brand-text">
                          {study.figure}
                        </span>
                        <span className="text-[0.82rem] text-label">
                          {study.measure}
                        </span>
                      </p>
                    </div>
                    <CaseSketch halo={study.halo} accent={study.accent} />
                  </Link>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}

export { CaseList }
