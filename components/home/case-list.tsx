import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { CaseCover } from "@/components/realisations/case-cover"
import type { CaseStudy } from "@/lib/content/cases"
import type { MediaRef } from "@/lib/media"

/**
 * S6 - la preuve centrale, placée quand le visiteur sait déjà quoi et comment.
 *
 * **Un cadre épinglé, des textes qui défilent.** Au-delà de 1024 px, le visuel reste
 * en place à droite pendant que les projets passent à gauche, chacun assez haut pour
 * être lu seul ; quand le texte d'un projet atteint le tiers haut de l'écran, sa
 * capture vient se fondre par-dessus la précédente. C'est le même geste qu'un objet
 * épinglé dont le propos change autour de lui, et il remplace la pile de cartes.
 *
 * **Deux colonnes sœurs, une timeline par projet.** Chaque entrée de la liste nomme
 * sa timeline de vue (`--case-n`), la grille les remonte d'un cran avec
 * `timeline-scope`, et chaque capture du cadre lit la sienne par `--tl`. C'est le
 * seul moyen, en CSS, de faire réagir un élément à la position d'un autre qui n'est
 * pas son ancêtre.
 *
 * **Le cadre n'existe que là où il fonctionne** : au-delà de 1024 px, sous
 * `@supports (animation-timeline: view())` et `prefers-reduced-motion:
 * no-preference`. Partout ailleurs, chaque projet porte sa capture sous son texte,
 * comme une fiche ordinaire - sans ces gardes, un navigateur sans timelines ne
 * montrerait que la dernière capture, pour tous les projets.
 *
 * Les cas arrivent en prop plutôt qu'importés : la page les lit en base, avec repli
 * sur le contenu statique. Le composant reste ignorant de leur provenance.
 */
export type ListCase = CaseStudy & { heroMedia?: MediaRef }

function CaseList({ cases }: { cases: ListCase[] }) {
  const scope = cases.map((_, index) => `--case-${index}`).join(", ")

  return (
    <Section
      id="realisations"
      space="lg"
      className="lg:pt-15"
      aria-labelledby="realisations-titre"
    >
      <Container>
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
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
            className="hel-link-slide inline-flex min-h-11 items-center text-[0.94rem] font-medium whitespace-nowrap text-ink"
          >
            Toutes nos réalisations
          </Link>
        </Reveal>

        <div
          className="hel-cases grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
          style={{ timelineScope: scope } as React.CSSProperties}
        >
          <ol className="border-t border-line">
            {cases.map((study, index) => (
              <li
                key={study.slug}
                className="hel-case-item hel-step border-b border-line py-9 md:py-12 lg:flex lg:flex-col lg:justify-center lg:py-16"
                style={
                  { viewTimelineName: `--case-${index}` } as React.CSSProperties
                }
              >
                <article className="flex flex-col gap-4">
                  <p className="flex items-center gap-3">
                    <span className="font-mono text-[0.75rem] text-label">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-xs bg-info-subtle px-2.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] text-info-text uppercase">
                      {study.sector}
                    </span>
                    {study.year ? (
                      <span className="font-mono text-[0.75rem] text-label">
                        {study.year}
                      </span>
                    ) : null}
                  </p>
                  <h3 className="font-display text-[clamp(1.5rem,5vw,2.25rem)] leading-[1.08] font-bold tracking-[-0.03em] text-ink">
                    {study.title}
                  </h3>
                  <p className="max-w-[28rem] text-[0.95rem] leading-relaxed text-body md:text-[1rem]">
                    {study.teaser}
                  </p>
                  {/* Le chiffre est facultatif : toute mission ne se résume pas à une
                      mesure. */}
                  {study.figure ? (
                    <p className="flex items-baseline gap-2.5">
                      <span className="font-display text-[1.875rem] font-extrabold tracking-[-0.02em] text-brand-text">
                        {study.figure}
                      </span>
                      <span className="text-[0.82rem] text-label">
                        {study.measure}
                      </span>
                    </p>
                  ) : null}
                  <Link
                    href={`/realisations/${study.slug}`}
                    className="group/case mt-2 inline-flex min-h-11 items-center gap-1.5 self-start text-[0.9rem] font-semibold text-ink"
                  >
                    Voir le projet
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-[160ms] ease-expo group-hover/case:translate-x-1"
                      strokeWidth={1.75}
                    />
                  </Link>
                  {/* La capture sous le texte, partout où le cadre épinglé n'est
                      pas rendu : mobile, tablette, navigateurs sans timelines,
                      mouvement réduit. */}
                  <div className="hel-case-inline mt-4">
                    <CaseCover
                      media={study.heroMedia}
                      halo={study.halo}
                      accent={study.accent}
                      place="home"
                    />
                  </div>
                </article>
              </li>
            ))}
          </ol>

          {/* Le cadre épinglé. Décoratif : les projets sont nommés et liés à gauche. */}
          <div aria-hidden="true" className="hel-case-stage lg:top-24">
            <div className="relative aspect-[16/11] max-h-[72vh] w-full overflow-hidden rounded-lg border border-line bg-raised shadow-4">
              <div className="relative z-10 flex h-8 items-center gap-1.5 border-b border-line bg-surface px-3.5">
                <span className="size-1.5 rounded-full bg-line-strong" />
                <span className="size-1.5 rounded-full bg-line-strong" />
                <span className="size-1.5 rounded-full bg-line-strong" />
              </div>
              {cases.map((study, index) => (
                <div
                  key={study.slug}
                  className="hel-case-cover absolute inset-x-0 top-8 bottom-0 overflow-hidden bg-inset"
                  style={{ "--tl": `--case-${index}` } as React.CSSProperties}
                >
                  {study.heroMedia ? (
                    <Image
                      src={study.heroMedia.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover object-top"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[0.75rem] text-label">
                      {study.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}

export { CaseList }
