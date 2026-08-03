import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import type { Testimonial } from "@/lib/content/testimonials"

/**
 * S8 - après les faits, l'émotion. Grille statique, pas de carrousel auto-rotatif : sur
 * mobile, une citation par écran en scroll naturel.
 *
 * **La section ne se rend pas quand la liste est vide**, et c'est ce qui a permis de la
 * rétablir. Elle affichait trois verbatims inventés, attribués à des personnes nommées
 * avec leur fonction et leur employeur ; elle a été retirée avec eux, et le bandeau de
 * logos clients a pris son rôle dans l'arc - une voix autre que celle du studio, juste
 * avant la demande. Elle revient maintenant que les citations sont administrables :
 * l'accueil est simplement plus court tant qu'aucune n'est en ligne, et le jour où un
 * client accepte d'être cité, la section apparaît sans qu'on touche au dépôt.
 *
 * **Les chevrons sont posés ici, jamais stockés.** Les laisser à la saisie ferait dépendre
 * le rendu de ce que la personne a recopié depuis son client de messagerie : des
 * guillemets droits, courbes ou absents selon le passage.
 */
function Testimonials({
  testimonials,
}: {
  testimonials: readonly Testimonial[]
}) {
  if (testimonials.length === 0) {
    return null
  }

  return (
    <Section space="lg" aria-labelledby="temoignages-titre">
      <Container>
        <Reveal className="mb-10 max-w-[35rem] md:mb-12">
          <Eyebrow className="mb-4">Ils en parlent mieux que nous</Eyebrow>
          <h2
            id="temoignages-titre"
            className="text-[clamp(1.625rem,6.5vw,2.75rem)] leading-[1.1] font-bold"
          >
            La confiance, racontée par ceux qui l&apos;ont accordée.
          </h2>
        </Reveal>

        <ul className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <li key={`${testimonial.name}-${index}`} className="flex">
              <Reveal delay={index * 80} className="flex w-full">
                <figure className="flex w-full flex-col gap-5 rounded-lg border border-line bg-surface p-6 md:p-7">
                  {/* Espaces insécables autour des chevrons : avec des espaces
                      ordinaires, le chevron fermant passait seul à la ligne suivante
                      dès que la citation finissait près du bord - mesuré à l'écran sur
                      la carte du milieu. C'est aussi la règle typographique française. */}
                  <blockquote className="flex-1 text-[clamp(1.0625rem,4.5vw,1rem)] leading-relaxed text-ink">
                    {`« ${testimonial.quote} »`}
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-9.5 shrink-0 items-center justify-center rounded-full border border-line bg-inset text-xs font-semibold text-body"
                    >
                      {testimonial.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        {testimonial.name}
                      </span>
                      <span className="block text-[0.78rem] text-label">
                        {testimonial.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

export { Testimonials }
