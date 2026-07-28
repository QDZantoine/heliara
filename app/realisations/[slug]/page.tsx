import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { Breadcrumb } from "@/components/sections/breadcrumb"
import { ButtonLink } from "@/components/ui/button"
import { CaseHeroSketch } from "@/components/visuals/case-hero-sketch"
import {
  caseHref,
  caseStudies,
  getCase,
  getNextCase,
} from "@/lib/content/cases"
import { cta } from "@/lib/site"

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata(
  props: PageProps<"/realisations/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const study = getCase(slug)
  if (!study) {
    return {}
  }
  return {
    title: study.title,
    description: study.summary,
  }
}

export default async function CaseStudyPage(
  props: PageProps<"/realisations/[slug]">
) {
  const { slug } = await props.params
  const study = getCase(slug)
  if (!study) {
    notFound()
  }
  const next = getNextCase(slug)

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
            <Reveal>
              <span className="inline-block rounded-xs bg-info-subtle px-2.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] text-info-text uppercase">
                {study.badge}
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="mt-5 mb-11 text-[clamp(2rem,6.5vw,4rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
                {study.heroTitle}
                <span className="text-brand">.</span>
              </h1>
            </Reveal>
          </div>
          <Reveal>
            <CaseHeroSketch accent={study.accent} />
          </Reveal>
        </Container>
      </section>

      <Section space="md">
        <Container className="grid items-start gap-10 lg:grid-cols-[17.5rem_1fr] lg:gap-18">
          {/* Méta : carte au-dessus du récit sur mobile, colonne sticky au-delà. */}
          <aside className="rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-25">
            <dl>
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
              Un projet similaire ?
            </ButtonLink>
          </aside>

          <div className="max-w-[42.5rem]">
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
                <p className="text-[0.97rem] leading-[1.7] text-body">
                  {chapter.text}
                </p>
                {chapter.callout ? (
                  <p className="mt-4.5 rounded-md border border-l-[3px] border-line border-l-brand bg-surface px-5 py-4.5 text-sm leading-relaxed text-body">
                    {chapter.callout}
                  </p>
                ) : null}
              </Reveal>
            ))}

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

            <Reveal>
              <h2 className="mb-4.5 text-[clamp(1.375rem,5.5vw,1.6875rem)] font-bold">
                Ce que ce projet nous a appris
              </h2>
              <ul className="grid gap-3">
                {study.lessons.map((lesson) => (
                  <li key={lesson} className="flex gap-3">
                    <span aria-hidden="true" className="flex-none text-brand">
                      —
                    </span>
                    <span className="text-[0.94rem] leading-relaxed text-body">
                      {lesson}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
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
