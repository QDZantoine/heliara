"use client"

import * as React from "react"

import { categoryTone, type ArticleCategory } from "@/lib/content/articles"
import { cn } from "@/lib/utils"

/**
 * « Où ça s'affiche » : le bloc du site, dessiné pendant qu'on le remplit.
 *
 * **C'est le remède au vrai défaut de ces formulaires.** Il ne venait pas du nombre
 * de champs mais de leur opacité : « Titre court · Cartes de listing » demandait
 * d'imaginer la carte, et « Résumé court » puis « Résumé long » n'avaient aucune
 * différence lisible tant qu'on ne savait pas lequel atterrit où. Une aide textuelle
 * ne peut pas dire ça, un dessin le dit sans être lu.
 *
 * Ce sont des reproductions à échelle réduite, pas des schémas : mêmes proportions,
 * même ordre, mêmes tokens de couleur que les vrais blocs. Une approximation
 * apprendrait quelque chose de faux. Elles restent volontairement petites et sans
 * ombre - ce n'est pas un aperçu, l'aperçu exact existe déjà et c'est la page
 * `/apercu`.
 */

/**
 * Une étape et sa colonne d'aperçus.
 *
 * **Une seule colonne pour toute l'étape, et non un aperçu par groupe de champs.**
 * Apparier chaque groupe à son aperçu semblait plus clair et couplait leurs
 * hauteurs : une carte de 300 px en face de deux champs laissait 200 px de vide,
 * et la page se lisait comme si des blocs manquaient. Empilés dans une colonne
 * collante, les aperçus restent visibles pendant qu'on descend les champs, ce qui
 * est de toute façon ce qu'on veut d'eux.
 */
export function WithPlacements({
  children,
  aside,
}: {
  children: React.ReactNode
  aside: React.ReactNode
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-8">
      <div className="grid content-start gap-8">{children}</div>
      <div className="grid content-start gap-5 xl:sticky xl:top-6 xl:h-fit">
        {aside}
      </div>
    </div>
  )
}

/** Le cadre commun : ce que c'est, puis le bloc. */
export function Placement({
  title,
  children,
  className,
}: {
  /** Le bloc du site que l'on regarde. « Carte du hub des réalisations ». */
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <aside
      // Décoratif au sens de l'accessibilité : tout ce qui s'y lit vient des champs
      // voisins. L'annoncer deux fois serait du bruit.
      aria-hidden="true"
      // Borné en largeur : sur une fenêtre étroite l'aperçu passe sous les champs
      // et occuperait toute la colonne. Une carte de 900 px de large ne ressemble
      // plus à la carte du site, elle en devient un contre-exemple.
      className={cn("grid w-full max-w-64 content-start gap-2", className)}
    >
      <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-faint uppercase">
        {title}
      </p>
      <div className="rounded-md bg-inset p-3">{children}</div>
    </aside>
  )
}

const empty = "text-faint italic"

/** Reproduction de la carte de `/realisations` et de la grille d'accueil. */
export function CaseCardPreview({
  sector,
  year,
  title,
  summary,
  figure,
  measure,
  imageUrl,
}: {
  sector: string
  year: string
  title: string
  summary: string
  figure: string
  measure: string
  imageUrl?: string
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-surface">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="aspect-16/9 w-full object-cover"
        />
      ) : (
        <div className="grid aspect-16/9 w-full place-items-center bg-page text-[0.66rem] text-faint">
          visuel
        </div>
      )}
      <div className="grid gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-xs bg-info-subtle px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.06em] text-info-text uppercase">
            {sector.trim() || "secteur"}
          </span>
          <span className="font-mono text-[0.62rem] text-label">
            {year.trim() || "année"}
          </span>
        </div>
        <p
          className={cn(
            "font-display text-[0.82rem] leading-tight font-bold text-ink",
            title.trim() ? null : empty
          )}
        >
          {title.trim() || "Titre court"}
        </p>
        <p
          className={cn(
            "text-[0.68rem] leading-snug text-body",
            summary.trim() ? null : empty
          )}
        >
          {summary.trim() || "Le résumé court tient sur deux lignes."}
        </p>
        {figure.trim() ? (
          <p className="flex items-baseline gap-1.5 border-t border-line pt-1.5">
            {/* `whitespace-nowrap` : « -38 % » se coupait entre le nombre et son
                signe dans la largeur réduite de l'aperçu, ce qui donnait à lire une
                valeur que le site n'affichera jamais ainsi. */}
            <span className="font-display text-[0.9rem] font-extrabold whitespace-nowrap text-brand-text">
              {figure.trim()}
            </span>
            <span className="text-[0.62rem] text-label">{measure.trim()}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** Reproduction du hero de la fiche `/realisations/[slug]`. */
export function CaseHeroPreview({
  badge,
  heroTitle,
  teaser,
}: {
  badge: string
  heroTitle: string
  teaser: string
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-line bg-surface p-3">
      <span
        className={cn(
          "justify-self-start rounded-xs bg-inset px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.06em] uppercase",
          badge.trim() ? "text-label" : cn(empty, "not-italic")
        )}
      >
        {badge.trim() || "étiquette"}
      </span>
      <p
        className={cn(
          "font-display text-[1rem] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink",
          heroTitle.trim() ? null : empty
        )}
      >
        {heroTitle.trim() || "Le résultat est dans le titre"}
      </p>
      <p
        className={cn(
          "text-[0.68rem] leading-snug text-body",
          teaser.trim() ? null : empty
        )}
      >
        {teaser.trim() || "Le résumé long, sous le titre du hero."}
      </p>
    </div>
  )
}

/** Reproduction du bandeau de témoignage. */
export function TestimonialPreview({
  quote,
  name,
  role,
  initials,
}: {
  quote: string
  name: string
  role: string
  initials: string
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-line bg-surface p-3">
      <p
        className={cn(
          "text-[0.7rem] leading-snug text-ink",
          quote.trim() ? null : empty
        )}
      >
        « {quote.trim() || "Le verbatim du client, tel qu'il l'a dit."} »
      </p>
      <p className="flex items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-solid text-[0.55rem] font-semibold text-brand-on-solid">
          {initials.trim().toUpperCase() || "··"}
        </span>
        <span className="grid">
          <span className="text-[0.66rem] font-semibold text-ink">
            {name.trim() || "Nom"}
          </span>
          <span className="text-[0.62rem] text-label">
            {role.trim() || "Rôle"}
          </span>
        </span>
      </p>
    </div>
  )
}

/**
 * Reproduction de la carte du flux `/ressources`.
 *
 * Elle ne montre **pas** le chapô, et c'est le fait le plus utile qu'elle apprenne :
 * les cartes du flux n'affichent que la catégorie, la durée, le titre et la
 * signature. Un chapô soigné n'y apparaît jamais - il ne se lit qu'à la une et en
 * tête de l'article. Sans ce dessin, rien ne le dit.
 */
export function ArticleCardPreview({
  category,
  title,
  author,
  dateLabel,
  readingTime,
}: {
  category: ArticleCategory
  title: string
  author: string
  dateLabel: string
  readingTime: string
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-xs px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.06em] uppercase",
            categoryTone[category]
          )}
        >
          {category}
        </span>
        <span className="text-[0.62rem] text-label">
          {readingTime.trim() || "· min"}
        </span>
      </div>
      <p
        className={cn(
          "font-display text-[0.82rem] leading-tight font-bold text-ink",
          title.trim() ? null : empty
        )}
      >
        {title.trim() || "Le titre de l'article"}
      </p>
      <p className="text-[0.62rem] text-label">
        {author.trim() || "Auteur"} · {dateLabel.trim() || "date"}
      </p>
    </div>
  )
}

/** Reproduction de la carte « À la une », la seule qui affiche le chapô. */
export function ArticleFeaturePreview({
  category,
  title,
  lead,
  author,
  authorRole,
  authorInitials,
}: {
  category: ArticleCategory
  title: string
  lead: string
  author: string
  authorRole: string
  authorInitials: string
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-line bg-surface p-3">
      <span
        className={cn(
          "justify-self-start rounded-xs px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.06em] uppercase",
          categoryTone[category]
        )}
      >
        {category}
      </span>
      <p
        className={cn(
          "font-display text-[0.95rem] leading-[1.15] font-bold tracking-[-0.02em] text-ink",
          title.trim() ? null : empty
        )}
      >
        {title.trim() || "Le titre de l'article"}
      </p>
      <p
        className={cn(
          "text-[0.68rem] leading-snug text-body",
          lead.trim() ? null : empty
        )}
      >
        {lead.trim() ||
          "Le chapô, deux ou trois lignes qui promettent la suite."}
      </p>
      <p className="flex items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-inset text-[0.55rem] font-semibold text-body">
          {authorInitials.trim().toUpperCase() || "··"}
        </span>
        <span className="grid">
          <span className="text-[0.66rem] font-semibold text-ink">
            {author.trim() || "Auteur"}
          </span>
          <span className="text-[0.62rem] text-label">
            {authorRole.trim() || "Rôle"}
          </span>
        </span>
      </p>
    </div>
  )
}

/**
 * Reproduction de la ligne d'index du hub `/expertises`.
 *
 * Le hub ne montre que le titre et l'accroche, côte à côte : c'est ce qui explique
 * pourquoi une accroche de cinq lignes y est illisible alors qu'elle passe très bien
 * en tête de la page du service.
 */
export function ExpertiseRowPreview({
  title,
  tagline,
}: {
  title: string
  tagline: string
}) {
  return (
    <div className="grid gap-1.5 border-y border-line bg-surface px-3 py-2.5">
      <p
        className={cn(
          "font-display text-[0.8rem] leading-tight font-bold text-ink",
          title.trim() ? null : empty
        )}
      >
        {title.trim() || "Nom du service"}
      </p>
      <p
        className={cn(
          "text-[0.66rem] leading-snug text-body",
          tagline.trim() ? null : empty
        )}
      >
        {tagline.trim() || "À qui ça sert, et pourquoi."}
      </p>
    </div>
  )
}

/** Reproduction du hero de `/expertises/[slug]` : famille, titre, accroche, problème. */
export function ExpertiseHeroPreview({
  familyLabel,
  title,
  tagline,
  problem,
}: {
  familyLabel: string
  title: string
  tagline: string
  problem: string
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-line bg-surface p-3">
      <p className="text-[0.6rem] font-semibold tracking-[0.08em] text-brand-text uppercase">
        {familyLabel}
      </p>
      <p
        className={cn(
          "font-display text-[1rem] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink",
          title.trim() ? null : empty
        )}
      >
        {title.trim() || "Nom du service"}
      </p>
      <p
        className={cn(
          "text-[0.7rem] leading-snug font-medium text-ink",
          tagline.trim() ? null : empty
        )}
      >
        {tagline.trim() || "L'accroche, en une phrase."}
      </p>
      <p
        className={cn(
          "text-[0.66rem] leading-snug text-body",
          problem.trim() ? null : empty
        )}
      >
        {problem.trim().slice(0, 220) ||
          "La situation du visiteur, dans ses mots, avant notre réponse."}
        {problem.trim().length > 220 ? "…" : null}
      </p>
    </div>
  )
}

/** Reproduction du bloc de résultats chiffrés. */
export function ResultsPreview({
  label,
  items,
}: {
  label: string
  items: readonly { value: string; label: string }[]
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-line bg-surface p-3">
      <p className="text-[0.6rem] font-semibold tracking-[0.08em] text-label uppercase">
        {label.trim() || "Résultats"}
      </p>
      {items.length === 0 ? (
        <p className={cn("text-[0.66rem]", empty)}>
          Aucun chiffre pour l’instant.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {items.slice(0, 4).map((item, index) => (
            <li key={index} className="grid gap-0.5">
              <span className="font-display text-[0.9rem] leading-none font-extrabold text-brand-text">
                {item.value.trim() || "·"}
              </span>
              <span className="text-[0.6rem] leading-snug text-label">
                {item.label.trim()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
