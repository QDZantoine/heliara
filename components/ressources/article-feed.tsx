"use client"

import * as React from "react"
import Link from "next/link"

import { Reveal } from "@/components/primitives/reveal"
import { articleHref, categoryTone, type Article } from "@/lib/content/articles"
import { cn } from "@/lib/utils"

type ArticleFeedProps = {
  articles: Article[]
  categories: string[]
}

/**
 * Filtres de catégorie et flux d'articles. Seul composant client de la page.
 * Rangée de filtres défilante avec accroche sur mobile, cibles à 44 px, comme
 * sur le hub des réalisations.
 */
function ArticleFeed({ articles, categories }: ArticleFeedProps) {
  const [category, setCategory] = React.useState("Tout")
  const visible =
    category === "Tout"
      ? articles
      : articles.filter((article) => article.category === category)

  return (
    <div>
      <div
        role="group"
        aria-label="Filtrer par catégorie"
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
        className="-mx-5 mb-8 flex snap-x snap-mandatory gap-2 overflow-x-auto pr-16 pb-1 pl-5 menu:justify-end 2xl:pr-0 md:mx-0 md:flex-wrap md:overflow-visible md:pr-12 md:pl-0"
      >
        {categories.map((name) => {
          const active = name === category
          return (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              aria-pressed={active}
              className={cn(
                "h-11 shrink-0 snap-start rounded-full border px-4 text-[0.845rem] font-medium transition-colors duration-100",
                active
                  ? "border-ink bg-ink text-page"
                  : "border-line bg-surface text-body hover:border-line-strong hover:text-ink"
              )}
            >
              {name}
            </button>
          )
        })}
      </div>

      <p aria-live="polite" className="mb-6 text-[0.82rem] text-label">
        {visible.length} article{visible.length > 1 ? "s" : ""}
        {category === "Tout" ? "" : ` en ${category.toLowerCase()}`}
      </p>

      <ul className="grid gap-4.5 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((article, index) => (
          <li key={article.slug} className="flex">
            <Reveal delay={index * 50} className="flex w-full">
              <Link
                href={articleHref(article.slug)}
                className="flex w-full flex-col gap-3 rounded-lg border border-line bg-surface p-6 transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-[3px] hover:shadow-2 active:translate-y-0"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span
                    className={cn(
                      "rounded-xs px-2.25 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase",
                      categoryTone[article.category]
                    )}
                  >
                    {article.category}
                  </span>
                  <span className="text-xs text-label">
                    {article.readingTime}
                  </span>
                </div>
                <h3 className="flex-1 font-display text-[1.15rem] leading-tight font-bold tracking-[-0.015em] text-ink">
                  {article.title}
                </h3>
                <p className="text-[0.78rem] text-label">
                  {article.author} · {article.date}
                </p>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ArticleFeed }
