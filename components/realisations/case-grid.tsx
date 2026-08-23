"use client"

import * as React from "react"
import Link from "next/link"

import { Reveal } from "@/components/primitives/reveal"
import { CaseCover } from "@/components/realisations/case-cover"
import { caseHref, type CaseStudy } from "@/lib/content/cases"
import type { MediaRef } from "@/lib/media"
import { cn } from "@/lib/utils"

/**
 * Les fiches, augmentées de leur couverture éventuelle.
 *
 * `CaseStudy` décrit le contenu statique, qui n'a pas de média : le visuel n'existe
 * qu'en base. L'intersection garde le composant ignorant de la provenance sans lui
 * cacher l'image.
 */
export type GridCase = CaseStudy & { heroMedia?: MediaRef }

type CaseGridProps = {
  cases: GridCase[]
  sectors: string[]
}

/**
 * Filtres de secteur + grille de cas.
 * Seul composant client de la page : l’état est un simple secteur sélectionné.
 * Sur mobile la rangée de filtres défile horizontalement avec accroche
 * (Responsive Guidelines 09, ligne « Études de cas »), cibles à 44 px.
 */
function CaseGrid({ cases, sectors }: CaseGridProps) {
  const [sector, setSector] = React.useState("Tous")
  const showAll = sector === "Tous"
  const visible = showAll
    ? cases
    : cases.filter((study) => study.sector === sector)

  return (
    <div>
      <div
        role="group"
        aria-label="Filtrer par secteur"
        /*
          `pr` de fin de rangée : la place que la bulle WhatsApp occupe en bas à droite.

          Un bouton flottant traverse toutes les positions verticales au défilement, donc
          la seule chose qui décide de ce qu'il recouvre est la largeur de sa bande depuis
          le bord - 72 px. Sans ce dégagement, la dernière pastille de filtre était
          recouverte sur 32 à 48 px selon la largeur, mesuré : une cible de 53 px l'était
          presque entièrement.

          Sur mobile la rangée est un défileur horizontal : la réserve y est invisible et
          ne fait qu'autoriser la dernière pastille à sortir de sous la bulle. Au-delà de
          1440 px, la gouttière du conteneur suffit et la réserve est retirée, ce qui rend
          les pastilles à nouveau alignées sur le bord droit de la grille.
        */
        className="-mx-5 mb-8 flex snap-x snap-mandatory gap-2 overflow-x-auto pr-16 pb-1 pl-5 2xl:pr-0 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:pr-12 md:pl-0"
      >
        {sectors.map((name) => {
          const active = name === sector
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSector(name)}
              aria-pressed={active}
              className={cn(
                "h-11 shrink-0 snap-start rounded-full border px-4 text-[0.845rem] font-medium transition-colors duration-100",
                active
                  ? "border-brand-solid bg-brand-solid text-brand-on-solid"
                  : "border-line bg-surface text-body hover:border-line-strong hover:text-ink"
              )}
            >
              {name}
            </button>
          )
        })}
      </div>

      {/*
        `role="status"` en plus de `aria-live` : les deux disent la même chose aux
        technologies d'assistance, mais le rôle donne au décompte une identité qu'un
        test peut viser. Le chercher par son texte échouait dès qu'une fiche contenait
        le mot « réalisations » dans son résumé, ce qui est arrivé.
      */}
      <p
        role="status"
        aria-live="polite"
        className="mb-6 text-center text-[0.82rem] text-label"
      >
        {visible.length} réalisation{visible.length > 1 ? "s" : ""}
        {showAll ? "" : ` · secteur ${sector}`}
      </p>

      <ul className="grid gap-5 md:grid-cols-2">
        {visible.map((study) => {
          const wide = showAll && study.wide
          return (
            <li
              key={study.slug}
              className={cn("flex", wide && "md:col-span-2")}
            >
              <Reveal className="flex w-full">
                <Link
                  href={caseHref(study.slug)}
                  className="flex w-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-1 hover:shadow-3 active:translate-y-0"
                >
                  <CaseCover
                    media={study.heroMedia}
                    halo={study.halo}
                    accent={study.accent}
                    place="card"
                    tall={wide}
                  />
                  <div className="flex flex-1 flex-col gap-2.5 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-xs bg-info-subtle px-2.25 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-info-text uppercase">
                        {study.sector}
                      </span>
                      <span className="font-mono text-xs text-label">
                        {study.year}
                      </span>
                    </div>
                    <h3 className="font-display text-[1.25rem] font-bold tracking-[-0.015em] text-ink">
                      {study.title}
                    </h3>
                    <p className="flex-1 text-[0.845rem] leading-relaxed text-body">
                      {study.summary}
                    </p>
                    {/* Facultatif : sans chiffre, ni le bloc ni son filet. */}
                    {study.figure ? (
                      <p className="flex items-baseline gap-2 border-t border-line pt-2.5">
                        <span className="font-display text-[1.375rem] font-extrabold text-brand-text">
                          {study.figure}
                        </span>
                        <span className="text-[0.78rem] text-label">
                          {study.measure}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </Link>
              </Reveal>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { CaseGrid }
