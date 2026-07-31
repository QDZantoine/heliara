import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { JsonLd } from "@/components/seo/json-ld"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import { expertiseHref } from "@/lib/content/expertises"
import { publicServicesByFamily } from "@/lib/db/public-expertises"
import { collectionPageNode, graph } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"

/**
 * Le titre, la description et le chemin de la page, en un seul endroit.
 *
 * Hissés en constante parce que **deux consommateurs les lisent** : les métadonnées
 * et le nœud `CollectionPage` des données structurées. Les écrire deux fois, c'est
 * garantir qu'ils divergeront - et un balisage qui contredit la page est un écart
 * signalable, pas un détail.
 */
const page = {
  title: "Expertises",
  description:
    "Neuf savoir-faire regroupés en trois familles : plateformes et SaaS, sites et e-commerce, IA et API.",
  path: "/expertises",
}

export const metadata: Metadata = pageMetadata(page)

/**
 * Une minute, comme le reste du contenu lu en base. Littéral obligatoire : Next
 * analyse cet export statiquement.
 */
export const revalidate = 60

export default async function ExpertisesPage() {
  // Les familles sans service publié sont écartées : elles restent dans la nav, où
  // elles mènent au hub, mais un groupe vide sur le hub n'a rien à montrer.
  const groups = await publicServicesByFamily()

  return (
    <>
      {/* Une page de section : `CollectionPage` dit à un moteur que cette adresse est un
          point d'entrée vers une collection, et non un article de plus. Le titre et la
          description viennent de `page`, la même source que les métadonnées. */}
      <JsonLd data={graph([collectionPageNode(page)])} />

      <PageHero
        eyebrow="Expertises"
        title="Neuf savoir-faire, trois familles de produits"
        lead="Chaque page dit le problème qu’elle résout, ce que nous livrons, et les choix techniques que nous assumons."
      />

      {groups.map(({ family, services }, familyIndex) => (
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
