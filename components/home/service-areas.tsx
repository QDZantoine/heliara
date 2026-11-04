import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { areasSection } from "@/lib/content/areas"
import { serviceAreas } from "@/lib/site"

/**
 * Les villes d'intervention, après les engagements et avant les pairs.
 *
 * **Sa place répond à une objection, comme celle qui la précède.** Les engagements
 * retirent le risque contractuel ; celle-ci retire le risque de la distance - « est-ce
 * que je pourrai leur parler autrement que par écran interposé ». C'est la dernière
 * question d'un prospect local, et elle n'avait de réponse nulle part sur le site.
 *
 * **Les villes sont écrites en grand et sans ornement.** La section qui précède est un
 * relevé de sept lignes cochées : refaire une liste à filets juste en dessous donnerait
 * deux fois la même forme. Quatre noms en typographie de titre se lisent d'un coup d'œil,
 * ce qui est exactement l'usage - on cherche le sien.
 *
 * **La liste vient de `serviceAreas`**, la même que le pied de page, `areaServed` des
 * données structurées et `llms.txt`. Un balisage qui nommerait une ville absente de
 * l'écran serait un écart signalable : c'est cette section qui garantit l'inverse.
 */
function ServiceAreas() {
  return (
    <Section
      space="lg"
      // Les villes entrent depuis la droite (`hel-slide-in`) : sans ce rognage, leur
      // point de départ élargissait la page de 25 px sur mobile.
      className="overflow-x-clip"
      aria-labelledby="zones-titre"
    >
      <Container className="grid gap-9 md:gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-end lg:gap-16">
        <div>
          <Reveal className="max-w-[42rem]">
            <Eyebrow className="mb-4">{areasSection.eyebrow}</Eyebrow>
            <h2
              id="zones-titre"
              className="mb-5 text-[clamp(1.625rem,6.5vw,2.75rem)] leading-[1.1] font-bold"
            >
              {areasSection.title}
            </h2>
            <p className="text-[1.0625rem] leading-relaxed text-pretty text-body">
              {areasSection.lead}
            </p>
          </Reveal>

          <Reveal
            delay={120}
            className="mt-5 max-w-[42rem] text-[0.95rem] leading-relaxed text-body"
          >
            <p>{areasSection.note}</p>
          </Reveal>
        </div>

        {/*
          Les villes à droite et l'une sous l'autre au-delà de 1024 px : c'est la colonne
          qui restait vide, et une liste verticale se parcourt d'un coup d'œil - on y
          cherche la sienne. En dessous, elles reviennent sur une ligne qui passe à la
          ligne, l'écart horizontal suffisant à les séparer. Aucun séparateur écrit dans
          le texte : un lecteur d'écran l'énoncerait entre chaque ville.
        */}
        <Reveal delay={60}>
          <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-display text-[clamp(1.375rem,5vw,2rem)] leading-tight font-bold text-ink lg:flex-col lg:gap-y-1 lg:text-[2.5rem]">
            {serviceAreas.map((city) => (
              <li key={city} className="hel-slide-in">
                {city}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  )
}

export { ServiceAreas }
