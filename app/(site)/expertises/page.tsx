import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import { expertiseHref, servicesByFamily } from "@/lib/content/expertises"

export const metadata: Metadata = {
  title: "Expertises",
  description:
    "Neuf savoir-faire regroupés en trois familles : plateformes et SaaS, sites et e-commerce, IA et API.",
}

export default function ExpertisesPage() {
  return (
    <>
      <PageHero
        eyebrow="Expertises"
        title="Neuf savoir-faire, trois familles de produits"
        lead="Chaque page dit le problème qu’elle résout, ce que nous livrons, et les choix techniques que nous assumons."
      />

      {servicesByFamily.map(({ family, services }, familyIndex) => (
        <Section
          key={family.slug}
          space="sm"
          className={familyIndex === 0 ? "pt-0 md:pt-0 lg:pt-0" : undefined}
          aria-labelledby={`famille-${family.slug}`}
        >
          <Container>
            <Reveal className="mb-6 max-w-[42.5rem]">
              <Eyebrow className="mb-3" tone="muted">
                {`0${familyIndex + 1}`}
              </Eyebrow>
              <h2
                id={`famille-${family.slug}`}
                className="mb-3 text-[clamp(1.625rem,6vw,2.25rem)] font-bold"
              >
                {family.label}
              </h2>
              <p className="text-[0.97rem] leading-relaxed text-body">
                {family.summary}
              </p>
            </Reveal>

            {/* Lignes d’index compactes : numéro, titre, description, sans flèche
                sur mobile (Responsive Guidelines 09, « Cartes Expertises »). */}
            <ul className="border-t border-line">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={expertiseHref(service.slug)}
                    className="group flex flex-col gap-1.5 border-b border-line py-5 transition-colors duration-100 hover:bg-surface md:flex-row md:items-center md:gap-8"
                  >
                    <span className="shrink-0 font-display text-[1.0625rem] font-bold tracking-[-0.015em] text-ink md:w-70">
                      {service.title}
                    </span>
                    <span className="flex-1 text-[0.9rem] leading-relaxed text-body">
                      {service.tagline}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="hidden size-4 shrink-0 text-brand-text transition-transform duration-[160ms] ease-expo group-hover:translate-x-1 md:block"
                      strokeWidth={1.5}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ))}

      <CtaBand title="Un besoin qui ne rentre dans aucune case ? C’est souvent bon signe." />
    </>
  )
}
