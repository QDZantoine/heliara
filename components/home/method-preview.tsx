import Link from "next/link"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { BrandPicto } from "@/components/visuals/brand-picto"
import { methodPreview } from "@/lib/content/method"
import { methodPictos } from "@/lib/content/pictos"
import { cta } from "@/lib/site"

/**
 * S5 - lever l'objection du risque, juste après le « quoi ». Version condensée :
 * ici on installe le sentiment de maîtrise, /methode porte le détail.
 *
 * **Un récit collant, pas quatre petites cartes.** Au-delà de 1024 px, le titre et
 * le lien restent en place dans la colonne de gauche pendant que les quatre temps
 * défilent à droite, chacun assez haut pour être lu seul : le temps qui passe au
 * centre de l'écran s'allume, les autres restent en retrait. Un fil vertical sous le
 * titre se remplit au rythme de la liste. Sous 1024 px, tout s'empile et seul
 * l'allumage reste.
 *
 * Tout est du CSS piloté par le défilement, sur `opacity` et `transform` :
 * `hel-step` pour l'allumage, `hel-rail-v` pour le fil. Le fil lit la timeline de
 * la liste depuis l'autre colonne : `timeline-scope` sur la grille la remonte d'un
 * cran, c'est le seul moyen de faire parler deux colonnes sœurs. Hors prise en
 * charge ou sous `prefers-reduced-motion`, les quatre temps sont simplement là.
 */
function MethodPreview() {
  return (
    <Section id="methode" space="lg" aria-labelledby="methode-titre">
      <Container>
        <div className="hel-method grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <Eyebrow className="mb-4">Comment nous travaillons</Eyebrow>
              <h2
                id="methode-titre"
                className="text-[clamp(1.75rem,7vw,3.25rem)] leading-[1.08] font-bold"
              >
                Un déroulé maîtrisé, aucune surprise.
              </h2>
              <p className="mt-5 max-w-[26rem] text-[1rem] leading-relaxed text-body md:text-[1.0625rem]">
                Quatre temps, et un livrable nommé à chacun. Ce qui est écrit
                avant de commencer est ce qui est tenu jusqu&apos;à la mise en
                production.
              </p>
              <Link
                href={cta.method.href}
                className="hel-link-slide mt-7 inline-flex min-h-11 items-center text-[0.94rem] font-medium text-ink"
              >
                {cta.method.label}
              </Link>
            </Reveal>
            <div
              aria-hidden="true"
              className="relative mt-12 hidden h-48 w-0.5 bg-line lg:block"
            >
              <span className="hel-rail-v absolute inset-0 bg-ink" />
            </div>
          </div>

          <ol className="hel-steps border-t border-line">
            {methodPreview.map((step, index) => (
              <li
                key={step.num}
                className="hel-step grid gap-x-8 gap-y-4 border-b border-line py-9 md:grid-cols-[5.5rem_minmax(0,1fr)] md:py-12 lg:min-h-[44vh] lg:py-16"
              >
                <span className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-ink">
                  {step.num}
                </span>
                <div className="md:pt-1">
                  {/* Le picto du temps, accent allumé : chaque temps occupe un écran
                      à lui seul au-delà de 1024 px, l'orange n'y est pas concurrencé. */}
                  {methodPictos[index] ? (
                    <BrandPicto
                      name={methodPictos[index]}
                      className="mb-5 size-11 text-ink [--picto-accent:var(--hel-brand)]"
                    />
                  ) : null}
                  <h3 className="font-display text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.1] font-bold tracking-[-0.025em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-[30rem] text-[1rem] leading-relaxed text-body md:text-[1.0625rem]">
                    {step.summary}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  )
}

export { MethodPreview }
