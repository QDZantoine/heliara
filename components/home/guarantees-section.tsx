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
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16">
        <Reveal className="max-w-[42rem]">
          <Eyebrow className="mb-4">{guaranteesSection.eyebrow}</Eyebrow>
          <h2
            id="engagements-titre"
            className="mb-5 text-[clamp(1.625rem,6.5vw,2.75rem)] leading-[1.1] font-bold"
          >
            {guaranteesSection.title}
          </h2>
          {/* `text-pretty` : sans lui le chapô laissait « opposer. » seul sur une
              troisième ligne. */}
          <p className="text-[1.0625rem] leading-relaxed text-pretty text-body">
            {guaranteesSection.lead}
          </p>
        </Reveal>

        {/*
          Une feuille, et une seule. Les engagements se lisent comme l'extrait d'un
          contrat qu'on pose sur la table : une surface flottante, des clauses l'une
          sous l'autre. C'est la promesse de la section rendue visible - ce qu'on peut
          opposer - et c'est la profondeur par les couches que demande la DA.

          Sept cartes pour sept phrases courtes auraient été bien plus lourdes que ce
          qu'elles portent ; une seule carte ne l'est pas. Les filets entre les lignes
          sont internes à la feuille : ils séparent des clauses, ils ne font pas relief.
        */}
        <Reveal delay={80}>
          <div className="rounded-lg border border-line bg-raised p-6 shadow-4 md:p-8">
            <p className="mb-2 font-mono text-[0.72rem] tracking-[0.08em] text-label uppercase">
              {guaranteesSection.sheetLabel}
            </p>
            <ul className="divide-y divide-line">
              {guarantees.map((guarantee) => (
                <li key={guarantee} className="flex items-start gap-3.5 py-3.5">
                  <CircleCheckBig
                    aria-hidden="true"
                    className="hel-tick mt-0.5 size-4.5 shrink-0 text-brand"
                    strokeWidth={2}
                  />
                  <span className="text-[1rem] leading-snug font-medium text-ink">
                    {guarantee}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}

export { GuaranteesSection }
