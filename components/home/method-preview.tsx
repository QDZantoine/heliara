import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { methodPreview } from "@/lib/content/method"
import { cta } from "@/lib/site"

/**
 * S5 - lever l'objection du risque, juste après le « quoi ». Version condensée :
 * ici on installe le sentiment de maîtrise, /methode porte le détail.
 */
function MethodPreview() {
  return (
    <Section id="methode" aria-labelledby="methode-titre">
      <Container>
        <div className="relative overflow-hidden rounded-xl border border-line bg-[image:var(--hel-gradient-surface)] p-6 md:p-10 lg:p-14">
          <Halo variant="cool" />

          <Reveal className="relative mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-12">
            <div className="max-w-[32.5rem]">
              <Eyebrow className="mb-3.5">Comment nous travaillons</Eyebrow>
              <h2
                id="methode-titre"
                className="text-[clamp(1.625rem,6.5vw,2.75rem)] leading-[1.1] font-bold"
              >
                Un déroulé maîtrisé, aucune surprise.
              </h2>
            </div>
            <Link
              href={cta.method.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-[0.94rem] font-medium whitespace-nowrap text-brand-text"
            >
              {cta.method.label}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
          </Reveal>

          {/*
            Le fil du déroulé, au-delà de 1024 px seulement : il se remplit de gauche à
            droite pendant qu'on fait défiler la section, et les étapes montent l'une
            après l'autre. Ici l'ordre est l'information, et c'est pourquoi le fil n'existe
            qu'avec les quatre étapes sur une rangée. Encre et non orange : les numéros
            et le lien de la section portent déjà le geste de cet écran.
          */}
          <div
            aria-hidden="true"
            className="relative mb-6 hidden h-px bg-line lg:block"
          >
            <span className="hel-rail absolute inset-0 bg-ink" />
          </div>
          <ol className="relative grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
            {methodPreview.map((step, index) => (
              <li key={step.num} className="flex">
                <Reveal
                  delay={index * 70}
                  className="hel-rise flex w-full"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <div className="w-full rounded-md border border-line bg-raised p-5.5 transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-[3px] hover:shadow-2">
                    <p className="mb-3 font-mono text-xs text-brand-text">
                      {step.num}
                    </p>
                    <h3 className="mb-2 font-display text-[1.125rem] font-bold tracking-[-0.01em] text-ink">
                      {step.title}
                    </h3>
                    <p className="text-[0.845rem] leading-relaxed text-body">
                      {step.summary}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  )
}

export { MethodPreview }
