import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { Breadcrumb } from "@/components/sections/breadcrumb"
import { CtaBand } from "@/components/sections/cta-band"
import { Faq } from "@/components/sections/faq"
import { caseHref } from "@/lib/content/cases"
import { cta } from "@/lib/site"

/**
 * Ce dont une page d'expertise a besoin pour se rendre.
 *
 * Décrit ici plutôt qu'importé du contenu statique, pour la même raison que
 * `CaseStudyView` et `ArticleReadingView` : la vue doit accepter deux sources - le
 * contenu en base de la page publique, et le même en brouillon pour l'aperçu.
 */
export type ExpertiseServiceView = {
  slug: string
  title: string
  tagline: string
  problem: string
  ctaTitle: string
  deliverables: readonly { title: string; text: string }[]
  techChoices: readonly { title: string; text: string }[]
  faq: readonly { question: string; answer: string }[]
  /** « Pourquoi du sur-mesure ? ». Absente, la section n'est pas rendue. */
  whyCustom?: {
    lead: string
    signals: readonly string[]
    closing: string
  }
}

/**
 * La page d'un service d'expertise, telle que la voit un visiteur.
 *
 * **Un seul rendu pour la page publiée et l'aperçu de brouillon.** Le `family` et le
 * `relatedCase` sont facultatifs : un aperçu n'a pas de rebond, et une famille dont le
 * libellé manque n'empêche pas de relire son texte.
 */
function ExpertiseServiceView({
  service,
  family,
  relatedCase,
}: {
  service: ExpertiseServiceView
  family?: { label: string }
  relatedCase?: {
    slug: string
    title: string
    sector: string
    summary: string
    figure: string
    measure: string
  }
}) {
  return (
    <>
      {/* Problème d’abord : le visiteur doit se reconnaître avant qu’on parle
          de nous (Architecture UX, fiche Expertises). */}
      <section className="relative overflow-hidden">
        <Halo variant="hero" />
        <Container className="relative pt-8 pb-12 md:pb-16">
          <Reveal className="mb-8">
            <Breadcrumb
              items={[
                { label: "Expertises", href: "/expertises" },
                { label: service.title },
              ]}
            />
          </Reveal>
          <div className="max-w-[45rem]">
            <Reveal>
              <Eyebrow className="mb-4">{family?.label}</Eyebrow>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="mb-6 text-[clamp(2rem,7vw,3.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
                {service.title}
                <span className="text-brand">.</span>
              </h1>
            </Reveal>
            <Reveal
              delay={120}
              className="mb-7 text-[1.0625rem] leading-relaxed font-medium text-ink md:text-lg"
            >
              {service.tagline}
            </Reveal>
            <Reveal
              delay={160}
              className="max-w-[42.5rem] text-[0.97rem] leading-[1.7] text-body"
            >
              {service.problem}
            </Reveal>
          </div>
        </Container>
      </section>

      <Section tone="surface" space="md" aria-labelledby="livrables">
        <Container>
          <Reveal className="mb-8 md:mb-10">
            <Eyebrow className="mb-3">Ce que nous livrons</Eyebrow>
            <h2
              id="livrables"
              className="max-w-[35rem] text-[clamp(1.5rem,5.5vw,2.25rem)] font-bold"
            >
              Des livrables nommés, pas des promesses.
            </h2>
          </Reveal>
          <ul className="grid gap-5 md:grid-cols-2">
            {service.deliverables.map((item, index) => (
              <li key={item.title} className="flex">
                <Reveal delay={index * 70} className="flex w-full">
                  <div className="w-full rounded-lg border border-line bg-page p-6">
                    <p className="mb-2 flex items-start gap-2.5">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-brand-text"
                        strokeWidth={2}
                      />
                      <span className="font-display text-[1.0625rem] font-bold tracking-[-0.015em] text-ink">
                        {item.title}
                      </span>
                    </p>
                    <p className="pl-6.5 text-[0.9rem] leading-relaxed text-body">
                      {item.text}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section space="md" aria-labelledby="stack">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <Reveal>
            <Eyebrow className="mb-3">Comment nous le faisons</Eyebrow>
            {/*
              « Une technologie au service de votre projet », et non « des choix
              techniques assumés ».

              Le titre précédent, comme les cartes qu'il coiffait, nommait des outils -
              TypeScript, PostgreSQL. Deux effets, tous deux mauvais : le décideur non
              technique décrochait, et celui qui lisait comprenait qu'on lui imposait
              une pile. Le contenu dit désormais ce que ces choix lui apportent. La
              pile réelle est en FAQ, où elle répond à « suis-je enfermé ? » au lieu
              d'annoncer une contrainte.
            */}
            <h2
              id="stack"
              className="mb-5 text-[clamp(1.5rem,5.5vw,2.25rem)] font-bold"
            >
              Une technologie au service de votre projet.
            </h2>
            <p className="mb-6 text-[0.97rem] leading-relaxed text-body">
              Nous ne choisissons jamais une technologie par habitude. Nous
              retenons celle qui répond le mieux à vos contraintes métier, à
              votre budget et à vos objectifs d&apos;évolution. Le déroulé
              complet vit sur la page méthode.
            </p>
            <Link
              href={cta.method.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-[0.94rem] font-medium text-brand-text"
            >
              {cta.method.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.5}
              />
            </Link>
          </Reveal>

          <ul className="border-t border-line">
            {service.techChoices.map((choice, index) => (
              <li key={choice.title}>
                <Reveal
                  delay={index * 70}
                  className="border-b border-line py-5"
                >
                  <p className="mb-1.5 text-[1.0625rem] font-semibold text-ink">
                    {choice.title}
                  </p>
                  <p className="text-[0.9rem] leading-relaxed text-body">
                    {choice.text}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Preuve : un cas du même type de produit. */}
      {relatedCase ? (
        <Section tone="surface" space="md" aria-labelledby="cas-lie">
          <Container>
            <Reveal className="mb-6">
              <Eyebrow className="mb-3">La preuve</Eyebrow>
              <h2
                id="cas-lie"
                className="text-[clamp(1.5rem,5.5vw,2.25rem)] font-bold"
              >
                Un cas de ce type, en production.
              </h2>
            </Reveal>
            <Reveal>
              <Link
                href={caseHref(relatedCase.slug)}
                className="group flex flex-col gap-5 rounded-lg border border-line bg-page p-6 transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-[3px] hover:shadow-3 md:flex-row md:items-center md:justify-between md:p-8"
              >
                <div className="max-w-[35rem]">
                  <p className="mb-3 inline-block rounded-xs bg-info-subtle px-2.25 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-info-text uppercase">
                    {relatedCase.sector}
                  </p>
                  <p className="mb-2 font-display text-[clamp(1.25rem,5vw,1.625rem)] font-bold tracking-[-0.02em] text-ink">
                    {relatedCase.title}
                  </p>
                  <p className="text-[0.9rem] leading-relaxed text-body">
                    {relatedCase.summary}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {relatedCase.figure ? (
                    <span>
                      <span className="block font-display text-[2rem] leading-none font-extrabold text-brand-text">
                        {relatedCase.figure}
                      </span>
                      <span className="text-[0.78rem] text-label">
                        {relatedCase.measure}
                      </span>
                    </span>
                  ) : null}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-5 text-brand-text transition-transform duration-[160ms] ease-expo group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </div>
              </Link>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/*
        « Pourquoi du sur-mesure ? » - la section qui qualifie, juste avant la FAQ.

        Elle ne décrit pas la prestation : elle donne au visiteur les signes qui
        indiquent qu'il en a besoin, puis, dans sa dernière phrase, admet le cas
        contraire. C'est ce renoncement qui rend crédible tout ce qui précède, et il
        arrive au bon endroit - après la preuve, avant les objections.

        `tone="surface"` : la section précédente et la FAQ sont sur le fond de page,
        celle-ci s'en détache pour marquer le changement de registre.
      */}
      {service.whyCustom ? (
        <Section tone="surface" space="md" aria-labelledby="sur-mesure">
          <Container width="reading">
            <Reveal>
              <Eyebrow className="mb-3">La bonne question</Eyebrow>
              <h2
                id="sur-mesure"
                className="mb-5 text-[clamp(1.5rem,5.5vw,2.25rem)] font-bold"
              >
                Pourquoi du sur-mesure&nbsp;?
              </h2>
              <p className="mb-5 text-[0.97rem] leading-relaxed text-body">
                {service.whyCustom.lead}
              </p>
              <ul className="mb-6 grid gap-3">
                {service.whyCustom.signals.map((signal) => (
                  <li
                    key={signal}
                    className="flex items-start gap-3 text-[0.97rem] leading-relaxed text-body"
                  >
                    {/* Un filet court plutôt qu'une puce ronde : la liste se lit
                        comme un relevé de symptômes, pas comme un argumentaire. */}
                    <span
                      aria-hidden="true"
                      className="mt-3 h-px w-3 shrink-0 bg-line-strong"
                    />
                    {signal}
                  </li>
                ))}
              </ul>
              <p className="border-l-2 border-brand pl-5 text-[1.0625rem] leading-relaxed font-medium text-ink">
                {service.whyCustom.closing}
              </p>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      <Section space="md">
        <Container>
          <Reveal className="max-w-reading">
            <Faq items={service.faq} />
          </Reveal>
        </Container>
      </Section>

      <CtaBand title={`${service.ctaTitle}.`} />
    </>
  )
}

export { ExpertiseServiceView }
