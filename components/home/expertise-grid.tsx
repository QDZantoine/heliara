import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { ExpertiseIllustration } from "@/components/visuals/expertise-illustration"
import { ExpertiseSketch } from "@/components/visuals/expertise-sketch"
import {
  expertiseFamilies,
  expertiseHref,
  familyIllustrations,
} from "@/lib/content/expertises"

/**
 * S4 - trois familles, pas neuf services : le visiteur se reconnaît dans un
 * problème, le détail vit sur les pages expertise.
 */
function ExpertiseGrid() {
  return (
    <Section
      id="expertises"
      space="lg"
      className="lg:pb-15"
      aria-labelledby="expertises-titre"
    >
      <Container>
        <Reveal className="mb-10 max-w-[40rem] md:mb-14">
          <Eyebrow className="mb-4">Ce que nous concevons</Eyebrow>
          <h2
            id="expertises-titre"
            className="text-[clamp(1.75rem,7vw,3.25rem)] leading-[1.08] font-bold"
          >
            Trois familles de produits, une même exigence.
          </h2>
        </Reveal>

        <ul className="grid gap-5 lg:grid-cols-3">
          {expertiseFamilies.map((family, index) => {
            const illustration = familyIllustrations[family.slug]
            return (
              <li key={family.slug} className="flex">
                <Reveal delay={index * 80} className="flex w-full">
                  <Link
                    href={expertiseHref(family.slug)}
                    className="flex w-full flex-col rounded-lg border border-line bg-surface p-6 transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-[3px] hover:shadow-3 active:translate-y-0"
                  >
                    {/* L'illustration quand la famille en a une, le croquis sinon :
                      une famille créée depuis l'administration n'a pas de fichier, et
                      ses trois barres réglables gardent ainsi un effet. */}
                    {illustration ? (
                      <ExpertiseIllustration
                        illustration={illustration}
                        halo={family.halo}
                      />
                    ) : (
                      <ExpertiseSketch
                        lines={family.lines}
                        tag={family.tag}
                        halo={family.halo}
                      />
                    )}
                    <h3 className="mt-5.5 mb-2 font-display text-[clamp(1.0625rem,4.5vw,1.3125rem)] font-bold tracking-[-0.02em] text-ink">
                      {family.title}
                    </h3>
                    <p className="mb-4.5 flex-1 text-[0.9rem] leading-relaxed text-body">
                      {family.summary}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-text">
                      Explorer
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </span>
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

export { ExpertiseGrid }
