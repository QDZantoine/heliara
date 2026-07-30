import { CircleCheckBig } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { guarantees, guaranteesSection } from "@/lib/content/guarantees"

/**
 * Les engagements contractuels, juste avant la demande de contact.
 *
 * **Ils défilaient, ils ne défilent plus.** Le bandeau qu'ils occupaient en S3 est
 * revenu à sa fonction d'origine - les logos clients - et un engagement contractuel
 * gagne à être lu posément : il n'avait rien à gagner à passer en mouvement. Une liste
 * qu'on ne peut lire qu'en attendant son tour n'invite pas à la vérifier, et c'est
 * précisément ce qu'on demande de celle-ci. Bénéfice au passage : la page n'a plus
 * deux défilements horizontaux infinis, et l'exposition à WCAG 2.2.2 se réduit au seul
 * bandeau de logos.
 *
 * **Sa place dans l'arc a changé de sens.** En S3 c'était une caution avant l'effort ;
 * ici, juste avant le CTA, c'est un retrait de risque - la dernière chose lue avant
 * d'écrire est ce à quoi le studio s'engage. C'est ce qu'une marque jeune peut opposer
 * là où une autre poserait un témoignage.
 *
 * Le contenu vit dans `lib/content/guarantees.ts`, qui porte aussi la règle qui le garde
 * disjoint des principes de S7.
 */
function GuaranteesSection() {
  return (
    <Section tone="surface" space="lg" aria-labelledby="engagements-titre">
      <Container>
        <Reveal className="mb-9 max-w-[42rem] md:mb-12">
          <Eyebrow className="mb-4">{guaranteesSection.eyebrow}</Eyebrow>
          <h2
            id="engagements-titre"
            className="mb-5 text-[clamp(1.625rem,6.5vw,2.75rem)] leading-[1.1] font-bold"
          >
            {guaranteesSection.title}
          </h2>
          {/* `text-pretty` : sans lui le chapô laissait « opposer. » seul sur une
              troisième ligne. L'orpheline se voit d'autant plus que la ligne d'après
              est un filet. */}
          <p className="text-[1.0625rem] leading-relaxed text-pretty text-body">
            {guaranteesSection.lead}
          </p>
        </Reveal>

        {/*
          Deux colonnes au-delà de 640 px, trois au-delà de 1024. Sept items sur trois
          colonnes laissent la dernière rangée incomplète, et c'est voulu : la liste se
          lit comme un relevé qui s'arrête où il s'arrête, pas comme une grille qu'on
          aurait remplie pour faire nombre.

          Un filet en haut de chaque item plutôt qu'une carte : la DA demande la
          profondeur par les couches et non par les filets, mais il ne s'agit pas ici de
          profondeur - sept cartes flottantes pour sept phrases courtes donneraient une
          section bien plus lourde que ce qu'elle porte.
        */}
        <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {guarantees.map((guarantee, index) => (
            <li key={guarantee} className="flex">
              <Reveal
                delay={index * 50}
                className="flex w-full items-start gap-3.5 border-t border-line pt-5"
              >
                <CircleCheckBig
                  aria-hidden="true"
                  className="mt-0.5 size-4.5 shrink-0 text-brand"
                  strokeWidth={2}
                />
                <span className="text-[1rem] leading-snug font-medium text-ink">
                  {guarantee}
                </span>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

export { GuaranteesSection }
