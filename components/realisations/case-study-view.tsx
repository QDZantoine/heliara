import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { RichHtml } from "@/components/primitives/rich-html"
import { Section } from "@/components/primitives/section"
import { CaseCover } from "@/components/realisations/case-cover"
import { CaseGallery } from "@/components/realisations/case-gallery"
import { Breadcrumb } from "@/components/sections/breadcrumb"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import { caseHref } from "@/lib/content/cases"
import type { MediaRef, MediaWithCaption } from "@/lib/media"
import { cta } from "@/lib/site"

/**
 * Ce dont la fiche a besoin pour se rendre, et rien de plus.
 *
 * Le type est décrit ici plutôt qu'importé de `lib/content/cases.ts` parce que la
 * vue doit accepter **deux sources** : le contenu statique du site public, et le
 * contenu en base de l'aperçu d'administration. Les champs de pilotage - statut,
 * position, horodatages - n'y figurent pas : la vue n'a rien à en faire.
 */
export type CaseView = {
  slug: string
  title: string
  heroTitle: string
  badge: string
  accent: "brand" | "info"
  /** L'image de tête, absente tant qu'aucune n'a été déposée. */
  heroMedia?: MediaRef
  /** Les captures de ce qui a été livré. Vide ou absente, aucun bloc ne s'affiche. */
  gallery?: readonly MediaWithCaption[]
  resultsLabel: string
  meta: readonly { label: string; value: string }[]
  chapters: readonly {
    num: string
    title: string
    text: string
    callout?: string
  }[]
  results: readonly { value: string; label: string }[]
  testimonial: {
    quote: string
    name: string
    role: string
    initials: string
  }
  lessons: readonly string[]
}

/**
 * La fiche d'étude de cas, telle que la voit un visiteur.
 *
 * **Un seul rendu pour deux usages** : la page publique et l'aperçu de brouillon
 * dans l'administration. C'est ce qui donne sa valeur à l'aperçu - il ne ressemble
 * pas à la page publiée, il en est le rendu exact, aux mêmes composants et au même
 * CSS. Une divergence serait impossible, puisqu'il n'y a rien à tenir en double.
 *
 * `next` est facultatif : il n'y a pas de rebond vers le cas suivant dans un
 * aperçu, où l'on ne regarde qu'une fiche.
 */
function CaseStudyView({
  study,
  next,
  empty,
}: {
  study: CaseView
  next?: { slug: string; title: string }
  /**
   * Message affiché quand la fiche n'a encore aucun chapitre.
   *
   * Réservé à l'aperçu de brouillon : sur le site public, la publication exige
   * les deux résumés et au moins un chapitre, donc le cas ne s'y présente pas.
   */
  empty?: React.ReactNode
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Halo variant="hero" />
        <Container className="relative pt-8">
          <Reveal className="mb-8">
            <Breadcrumb
              items={[
                { label: "Réalisations", href: "/realisations" },
                { label: study.title },
              ]}
            />
          </Reveal>
          <div className="max-w-[52.5rem]">
            {study.badge ? (
              <Reveal>
                <span className="inline-block rounded-xs bg-info-subtle px-2.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] text-info-text uppercase">
                  {study.badge}
                </span>
              </Reveal>
            ) : null}
            <Reveal delay={60}>
              <h1 className="mt-5 mb-11 text-[clamp(2rem,6.5vw,4rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
                {study.heroTitle}
                <span className="text-brand">.</span>
              </h1>
            </Reveal>
          </div>
          <Reveal>
            <CaseCover
              media={study.heroMedia}
              accent={study.accent}
              place="hero"
            />
          </Reveal>
        </Container>
      </section>

      <Section space="md">
        <Container className="grid items-start gap-10 lg:grid-cols-[17.5rem_1fr] lg:gap-18">
          {/* Méta : carte au-dessus du récit sur mobile, colonne sticky au-delà. */}
          <aside className="rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-25">
            {/* Sans ligne de fiche technique, pas de liste vide : le panneau se
                réduit au seul appel à l'action, qui garde son sens. */}
            <dl className={study.meta.length === 0 ? "hidden" : undefined}>
              {study.meta.map((item) => (
                <div key={item.label} className="border-b border-line py-3">
                  <dt className="mb-1 text-[0.66rem] font-semibold tracking-[0.1em] text-label uppercase">
                    {item.label}
                  </dt>
                  <dd className="text-sm leading-normal font-medium text-ink">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
            <ButtonLink
              href={cta.primary.href}
              size="md"
              className="mt-4 w-full"
            >
              <CtaIcon />
              Un projet similaire ?
            </ButtonLink>
          </aside>

          <div className="max-w-[42.5rem]">
            {study.chapters.length === 0 && empty ? empty : null}

            {study.chapters.map((chapter) => (
              <Reveal key={chapter.num} className="mb-13">
                <div className="mb-3.5 flex items-baseline gap-3.5">
                  <span className="font-mono text-xs text-brand-text">
                    {chapter.num}
                  </span>
                  <h2 className="text-[clamp(1.375rem,5.5vw,1.6875rem)] font-bold">
                    {chapter.title}
                  </h2>
                </div>
                {/* Le corps vient de l'éditeur riche, donc c'est du HTML - validé à
                    l'écriture par `lib/rich-text.ts`. L'afficher comme du texte
                    montrerait les balises, ce qui a été constaté en production. */}
                <RichHtml
                  html={chapter.text}
                  className="text-[0.97rem] leading-[1.7] text-body"
                />
                {chapter.callout ? (
                  <p className="mt-4.5 rounded-md border border-l-[3px] border-line border-l-brand bg-surface px-5 py-4.5 text-sm leading-relaxed text-body">
                    {chapter.callout}
                  </p>
                ) : null}
              </Reveal>
            ))}

            {/* Chaque bloc qui suit est conditionné à son contenu. Une fiche se
                remplit par étapes, et un aperçu de brouillon doit montrer ce qui
                existe, pas des cadres vides - ce qui vaut aussi pour une fiche
                publiée sans témoignage ni chiffre. */}

            {/* Après le récit, avant les résultats : on lit l'histoire, on voit ce qui
                a été livré, puis on mesure. Voir `CaseGallery`. */}
            <CaseGallery items={study.gallery ?? []} />
            {study.results.length > 0 ? (
              <Reveal className="relative mb-13 overflow-hidden rounded-xl border border-line bg-[image:var(--hel-gradient-surface)] p-6 md:p-10">
                <Halo variant="warm" />
                <div className="relative">
                  <Eyebrow className="mb-6">{study.resultsLabel}</Eyebrow>
                  <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-x-10">
                    {study.results.map((result) => (
                      <div
                        key={result.label}
                        className="border-l-2 border-brand pl-4"
                      >
                        <dt className="sr-only">{result.label}</dt>
                        <dd>
                          <span className="block font-display text-[clamp(1.75rem,7vw,2.375rem)] leading-none font-extrabold tracking-[-0.03em] text-ink">
                            {result.value}
                          </span>
                          <span className="mt-1.5 block text-[0.845rem] text-body">
                            {result.label}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            ) : null}

            {study.testimonial.quote ? (
              <Reveal>
                <figure className="mb-13 border-y border-line py-9">
                  <blockquote className="mb-5 font-display text-[clamp(1.125rem,5vw,1.5rem)] leading-[1.4] font-semibold tracking-[-0.015em] text-ink">
                    « {study.testimonial.quote} »
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-inset text-[0.82rem] font-semibold text-body"
                    >
                      {study.testimonial.initials}
                    </span>
                    <span>
                      <span className="block text-[0.9rem] font-semibold text-ink">
                        {study.testimonial.name}
                      </span>
                      <span className="block text-[0.82rem] text-label">
                        {study.testimonial.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ) : null}

            {study.lessons.length > 0 ? (
              <Reveal>
                <h2 className="mb-4.5 text-[clamp(1.375rem,5.5vw,1.6875rem)] font-bold">
                  Ce que ce projet nous a appris
                </h2>
                <ul className="grid gap-3">
                  {study.lessons.map((lesson) => (
                    <li key={lesson} className="flex gap-3">
                      <span aria-hidden="true" className="flex-none text-brand">
                        -
                      </span>
                      <span className="text-[0.94rem] leading-relaxed text-body">
                        {lesson}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* Aucune impasse : on reste dans la preuve avec le cas suivant. */}
      {next ? (
        <Section tone="surface" space="none">
          <Link href={caseHref(next.slug)} className="group block">
            <Container className="flex items-center justify-between gap-6 py-12 md:py-14">
              <div>
                <p className="mb-2 text-[0.72rem] font-semibold tracking-[0.1em] text-label uppercase">
                  Cas suivant
                </p>
                <p className="font-display text-[clamp(1.375rem,5.5vw,1.875rem)] font-bold tracking-[-0.02em] text-ink">
                  {next.title}
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="size-7 shrink-0 text-brand-text transition-transform duration-[160ms] ease-expo group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Container>
          </Link>
        </Section>
      ) : null}
    </>
  )
}

export { CaseStudyView }
