import Link from "next/link"

import { Container } from "@/components/primitives/container"
import { Reveal } from "@/components/primitives/reveal"
import { RichHtml } from "@/components/primitives/rich-html"
import { Section } from "@/components/primitives/section"
import { ArticleCover } from "@/components/ressources/article-cover"
import { Breadcrumb } from "@/components/sections/breadcrumb"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import {
  articleHref,
  categoryTone,
  type ArticleBlock,
  type ArticleCategory,
} from "@/lib/content/articles"
import { caseHref } from "@/lib/content/cases"
import type { MediaRef } from "@/lib/media"
import { cta } from "@/lib/site"
import { cn } from "@/lib/utils"

/**
 * Ce dont un article a besoin pour se rendre, et rien de plus.
 *
 * Décrit ici plutôt qu'importé de `lib/content/articles.ts`, pour la même raison que
 * `CaseStudyView` : la vue doit accepter deux sources - le contenu statique et le
 * contenu en base de l'aperçu d'administration.
 */
export type ArticleView = {
  slug: string
  category: ArticleCategory
  title: string
  lead: string
  author: string
  authorRole: string
  authorInitials: string
  date: string
  readingTime: string
  /** L'image de tête, absente tant qu'aucune n'a été déposée. */
  heroMedia?: MediaRef
  body: readonly ArticleBlock[]
}

/** Rendu des blocs typés du corps : un cas par variante, rien d’autre. */
function Block({ block }: { block: ArticleBlock }) {
  if (block.kind === "heading") {
    return (
      <h2 className="mt-11 mb-4 text-[clamp(1.375rem,5.5vw,1.75rem)] font-bold">
        {block.text}
      </h2>
    )
  }

  if (block.kind === "callout") {
    return (
      <div className="mb-6 rounded-md border border-l-[3px] border-line border-l-brand bg-surface px-6 py-5.5 text-[0.94rem] leading-relaxed text-body">
        {/* Le chapô est un champ simple, le corps vient de l'éditeur riche : le
            premier est du texte, le second du HTML validé. */}
        <p className="mb-1.5 font-semibold text-ink">{block.lead}</p>
        <RichHtml html={block.text} />
      </div>
    )
  }

  if (block.kind === "numbered") {
    return (
      <ol className="mb-6 grid gap-2.5">
        {block.items.map((item) => (
          <li
            key={item.num}
            className="grid grid-cols-[2.5rem_1fr] gap-3.5 rounded-md border border-line bg-surface px-4.5 py-4"
          >
            <span className="pt-0.5 font-mono text-xs text-brand-text">
              {item.num}
            </span>
            <span className="text-[0.94rem] leading-relaxed text-body">
              <strong className="font-semibold text-ink">{item.title}</strong>{" "}
              {item.text}
            </span>
          </li>
        ))}
      </ol>
    )
  }

  // Paragraphe : le corps vient de l'éditeur riche, donc du HTML validé à
  // l'écriture. L'afficher comme du texte montrerait les balises.
  return (
    <RichHtml
      html={block.text}
      className="mb-6 text-[1.0625rem] leading-[1.75] text-body"
    />
  )
}

/**
 * Normalise un corps saisi en corps affichable.
 *
 * Le numéro d'une entrée de liste est **optionnel à la saisie** - on ne va pas
 * demander de taper « 01 », « 02 », « 03 » - mais **requis à l'affichage**, où il
 * est le repère visuel de la grille. Le défaut est donc calculé ici, à la frontière
 * entre les deux : la vue peut compter sur sa présence, et la personne qui rédige
 * n'a rien à renseigner.
 */
export function toRenderableBody(
  blocks: readonly (
    | { kind: "paragraph" | "heading"; text: string }
    | { kind: "callout"; lead: string; text: string }
    | {
        kind: "numbered"
        items: readonly { num?: string; title: string; text: string }[]
      }
  )[]
): ArticleBlock[] {
  return blocks.map((block) =>
    block.kind === "numbered"
      ? {
          kind: "numbered",
          items: block.items.map((item, index) => ({
            num: item.num?.trim() || String(index + 1).padStart(2, "0"),
            title: item.title,
            text: item.text,
          })),
        }
      : (block as ArticleBlock)
  )
}

/**
 * Un article, tel que le voit un visiteur.
 *
 * **Un seul rendu pour deux usages** : la page publique et l'aperçu de brouillon.
 * C'est ce qui donne sa valeur à l'aperçu - il n'imite pas la page publiée, il en
 * est le rendu exact.
 *
 * `related` et `relatedCase` sont facultatifs : un aperçu ne montre pas de rebond,
 * on n'y regarde qu'un article.
 */
function ArticleReadingView({
  article,
  related = [],
  relatedCase,
}: {
  article: ArticleView
  related?: readonly { slug: string; title: string; readingTime: string }[]
  relatedCase?: { slug: string; title: string }
}) {
  return (
    <>
      <Container width="reading" className="pt-8">
        <Reveal className="mb-7">
          <Breadcrumb
            items={[
              { label: "Ressources", href: "/ressources" },
              { label: article.category },
            ]}
          />
        </Reveal>

        <Reveal className="mb-5 flex items-center gap-2.5">
          <span
            className={cn(
              "rounded-xs px-2.25 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase",
              categoryTone[article.category]
            )}
          >
            {article.category}
          </span>
          <span className="text-[0.78rem] text-label">
            {article.readingTime} de lecture · {article.date}
          </span>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mb-5 text-[clamp(1.875rem,5.5vw,3.125rem)] leading-[1.06] font-extrabold tracking-[-0.03em]">
            {article.title}
          </h1>
        </Reveal>

        <Reveal
          delay={120}
          className="mb-7 text-[1.125rem] leading-relaxed text-body"
        >
          {article.lead}
        </Reveal>

        <Reveal className="flex items-center gap-3 border-b border-line pb-8">
          <span
            aria-hidden="true"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-solid text-[0.82rem] font-semibold text-brand-on-solid"
          >
            {article.authorInitials}
          </span>
          <span>
            <span className="block text-[0.9rem] font-semibold text-ink">
              {article.author}
            </span>
            <span className="block text-[0.82rem] text-label">
              {article.authorRole}, Heliara
            </span>
          </span>
        </Reveal>
      </Container>

      {/*
        L'image de tête sous le bloc auteur, avant le corps : elle installe le sujet
        après l'avoir nommé. La placer au-dessus du titre repousserait le `h1` sous le
        pli, ce qui coûterait le LCP pour un gain d'atmosphère.

        `ArticleCover` ne rend rien sans média, donc la marge n'est pas non plus posée :
        un article sans image garde exactement l'espacement actuel.
      */}
      {article.heroMedia ? (
        <Container width="reading" className="pt-10">
          <Reveal>
            <ArticleCover media={article.heroMedia} place="reading" />
          </Reveal>
        </Container>
      ) : null}

      <Container width="reading" className="pt-10 pb-16">
        <article>
          {article.body.map((block, index) => (
            <Reveal key={index}>
              <Block block={block} />
            </Reveal>
          ))}
        </article>
      </Container>

      {/* Aucune impasse : lectures suivantes, cas lié, et CTA doux. */}
      <Section tone="surface" space="sm">
        <Container className="grid items-start gap-10 lg:grid-cols-[2fr_1fr] lg:gap-12">
          <div>
            <Reveal>
              <p className="mb-4 text-[0.72rem] font-semibold tracking-[0.1em] text-label uppercase">
                À lire ensuite
              </p>
            </Reveal>
            <ul className="border-t border-line">
              {related.map((next) => (
                <li key={next.slug}>
                  <Reveal>
                    <Link
                      href={articleHref(next.slug)}
                      className="flex items-baseline justify-between gap-5 border-b border-line py-4 transition-colors duration-100 hover:bg-page"
                    >
                      <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
                        {next.title}
                      </span>
                      <span className="text-[0.78rem] whitespace-nowrap text-label">
                        {next.readingTime}
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>

            {relatedCase ? (
              <Reveal className="mt-6">
                <Link
                  href={caseHref(relatedCase.slug)}
                  className="inline-flex min-h-11 items-center text-[0.94rem] font-medium text-brand-text"
                >
                  Le cas qui illustre ce sujet : {relatedCase.title}
                </Link>
              </Reveal>
            ) : null}
          </div>

          <Reveal className="rounded-lg border border-line bg-page p-6">
            <p className="mb-2 font-display text-[1.125rem] font-bold tracking-[-0.01em] text-ink">
              Ce sujet vous concerne directement ?
            </p>
            <p className="mb-4.5 text-[0.845rem] leading-relaxed text-body">
              Un échange de trente minutes vaut mieux qu’un guide. Pré-cadrage
              honnête, y compris si la réponse est « achetez ».
            </p>
            <ButtonLink href={cta.primary.href} size="md">
              <CtaIcon />
              Parlons-en
            </ButtonLink>
          </Reveal>
        </Container>
      </Section>
    </>
  )
}

export { ArticleReadingView }
