import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { BrandPicto } from "@/components/visuals/brand-picto"
import {
  expertiseFamilies,
  expertiseHref,
  expertiseServices,
} from "@/lib/content/expertises"
import { familyPictos } from "@/lib/content/pictos"

/**
 * S4 - quatre familles, pas dix services : le visiteur se reconnaît dans un
 * problème, le détail vit sur les pages expertise.
 *
 * **Une liste éditoriale, pas une grille de cartes.** Les quatre cartes à
 * illustration vectorielle lisaient comme un gabarit : quatre vignettes de banque
 * d'images, quatre boîtes de même taille, un « Explorer » en pied de chacune. Ici
 * chaque famille est une ligne pleine largeur - rang, titre en grand corps, les
 * services qu'elle regroupe en une ligne monospace, le résumé, une flèche - et les
 * filets entre les lignes portent la structure. C'est la mise en page d'un sommaire,
 * et c'est ce que la section est.
 *
 * **Les services sous chaque titre sont du contenu réel**, lus dans
 * `expertiseServices` par famille : trois au plus, le reste est sur la page. Ils
 * remplacent l'illustration sans rien inventer.
 *
 * Au survol, le titre glisse de quelques pixels et la pastille de la flèche
 * s'encre : `transform` et couleurs seulement. Au défilement, les lignes montent en
 * cascade (`hel-rise`), comme les cartes qu'elles remplacent.
 */
function ExpertiseList() {
  return (
    <Section
      id="expertises"
      space="lg"
      className="lg:pb-15"
      aria-labelledby="expertises-titre"
    >
      <Container>
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
          <div className="max-w-[40rem]">
            <Eyebrow className="mb-4">Ce que nous concevons</Eyebrow>
            <h2
              id="expertises-titre"
              className="text-[clamp(1.75rem,7vw,3.25rem)] leading-[1.08] font-bold"
            >
              Quatre familles de produits, une même exigence.
            </h2>
          </div>
          <Link
            href="/expertises"
            className="hel-link-slide inline-flex min-h-11 items-center gap-1.5 text-[0.94rem] font-medium whitespace-nowrap text-ink"
          >
            Toutes les expertises
          </Link>
        </Reveal>

        <ul className="border-t border-line">
          {expertiseFamilies.map((family, index) => {
            const services = expertiseServices
              .filter((service) => service.family === family.slug)
              .slice(0, 3)
              .map((service) => service.title)

            return (
              <li key={family.slug}>
                <Reveal
                  className="hel-rise"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <Link
                    href={expertiseHref(family.slug)}
                    className="group/row grid gap-x-8 gap-y-3 border-b border-line py-7 md:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,21rem)_2.75rem] md:items-start md:py-9 lg:py-11"
                  >
                    {/* Le picto du kit à la place du rang : il dit la famille avant
                        le titre. Accent éteint au repos, allumé au survol de la
                        ligne - quatre pictos orange feraient quatre gestes. */}
                    <span className="flex items-center md:pt-1">
                      {familyPictos[family.slug] ? (
                        <BrandPicto
                          name={familyPictos[family.slug]}
                          className="size-10 text-ink transition-transform duration-[320ms] ease-expo group-hover/row:-translate-y-0.5 group-hover/row:[--picto-accent:var(--hel-brand)] md:size-11"
                        />
                      ) : (
                        <span className="font-mono text-[0.8rem] text-label">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-display text-[clamp(1.5rem,4.5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.03em] text-ink transition-transform duration-[320ms] ease-expo group-hover/row:translate-x-2">
                        {family.title}
                      </h3>
                      {services.length ? (
                        <p className="mt-3 truncate font-mono text-[0.72rem] tracking-[0.02em] text-label">
                          {services.join("  ·  ")}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-[0.95rem] leading-relaxed text-body md:pt-1.5">
                      {family.summary}
                    </p>

                    {/* La flèche, dite : toute la ligne est un lien, mais rien ne le
                        montrait avant le survol - et il n'y a pas de survol au doigt.
                        Encre, pas orange : le geste de cet écran est le lien de tête. */}
                    <span
                      aria-hidden="true"
                      className="inline-flex size-11 items-center justify-center rounded-full border border-line-strong text-ink transition-[background-color,color,border-color,transform] duration-[200ms] ease-expo group-hover/row:border-ink group-hover/row:bg-ink group-hover/row:text-page group-active/row:scale-95 md:justify-self-end"
                    >
                      <ArrowUpRight className="size-4.5" strokeWidth={1.75} />
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

export { ExpertiseList }
