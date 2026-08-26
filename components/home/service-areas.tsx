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
    <Section space="lg" aria-labelledby="zones-titre">
      <Container>
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

        {/*
          Deux détails que la lecture du JSX ne donne pas :

          - **Les points de séparation sont posés en CSS**, pas dans le texte. Écrits
            dans le JSX, un lecteur d'écran les énoncerait entre chaque ville.
          - **Ils n'apparaissent qu'à partir de 1024 px**, seule largeur où les quatre
            noms tiennent sur une ligne. En dessous, la liste passe à la ligne et le
            point restait suspendu en fin de ligne - vu à l'écran à 390 px. L'écart
            horizontal suffit alors à séparer les noms.
        */}
        <Reveal delay={60} className="mt-9 md:mt-12">
          <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-display text-[clamp(1.375rem,5vw,2rem)] leading-tight font-bold text-ink lg:gap-x-3">
            {serviceAreas.map((city) => (
              <li
                key={city}
                className="lg:after:ml-3 lg:after:text-faint lg:after:content-['·'] lg:last:after:content-none"
              >
                {city}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          delay={120}
          className="mt-5 max-w-[42rem] text-[0.95rem] leading-relaxed text-body"
        >
          <p>{areasSection.note}</p>
        </Reveal>
      </Container>
    </Section>
  )
}

export { ServiceAreas }
