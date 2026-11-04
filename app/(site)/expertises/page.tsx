import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { JsonLd } from "@/components/seo/json-ld"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import { BrandPicto } from "@/components/visuals/brand-picto"
import { expertiseHref } from "@/lib/content/expertises"
import { familyPictos } from "@/lib/content/pictos"
import { publicServicesByFamily } from "@/lib/db/public-expertises"
import { collectionPageNode, graph } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

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
    "Dix savoir-faire regroupés en quatre familles : plateformes et SaaS, sites et e-commerce, IA et API, applications mobiles.",
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
      {/*
          `mainEntity` énumère les services **affichés**, famille par famille et dans
          l'ordre de la page : sans lui, la collection se déclarait sans jamais dire ce
          qu'elle collecte.
      */}
      <JsonLd
        data={graph([
          collectionPageNode({
            ...page,
            items: groups.flatMap(({ services }) =>
              services.map((service) => ({
                name: service.title,
                path: `/expertises/${service.slug}`,
              }))
            ),
          }),
        ])}
      />

      <PageHero
        eyebrow="Expertises"
        title="Dix savoir-faire, quatre familles de produits"
        lead="Chaque page dit le problème qu’elle résout, ce que nous livrons, et les choix techniques que nous assumons."
      />

      {/*
        Une famille par section, en deux colonnes au-delà de 1024 px : à gauche le
        picto du kit, le rang, le nom et le résumé, collants pendant qu'on lit ; à
        droite ses services en lignes à grand titre. Le geste des expertises de
        l'accueil, prolongé : la flèche s'encre au survol, le picto s'allume.
      */}
      {groups.map(({ family, services }, familyIndex) => (
        <Section
          key={family.slug}
          space="md"
          className={cn(
            "group/family",
            familyIndex === 0 ? "pt-0 md:pt-0 lg:pt-0" : "border-t border-line"
          )}
          aria-labelledby={`famille-${family.slug}`}
        >
          <Container className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <div className="mb-6 flex items-center gap-4">
                {familyPictos[family.slug] ? (
                  <BrandPicto
                    name={familyPictos[family.slug]}
                    className="size-12 text-ink transition-[color] duration-300 group-hover/family:[--picto-accent:var(--hel-brand)]"
                  />
                ) : null}
                <span className="font-mono text-[0.75rem] text-label">
                  {String(familyIndex + 1).padStart(2, "0")} /{" "}
                  {String(groups.length).padStart(2, "0")}
                </span>
              </div>
              <h2
                id={`famille-${family.slug}`}
                className="mb-4 text-[clamp(1.875rem,4.2vw,3rem)] leading-[1.05] font-bold tracking-[-0.035em]"
              >
                {family.label}
              </h2>
              <p className="max-w-[26rem] text-[0.97rem] leading-relaxed text-body">
                {family.summary}
              </p>
            </Reveal>

            <ul className="border-t border-line">
              {services.map((service, index) => (
                <li key={service.slug}>
                  <Reveal
                    className="hel-rise"
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <Link
                      href={expertiseHref(service.slug)}
                      className="group/row grid gap-2 border-b border-line py-7 md:grid-cols-[minmax(0,1fr)_2.75rem] md:items-center md:gap-8 md:py-9"
                    >
                      <span>
                        <span className="block font-display text-[clamp(1.375rem,2.6vw,1.875rem)] leading-[1.12] font-bold tracking-[-0.025em] text-ink transition-transform duration-[320ms] ease-expo group-hover/row:translate-x-1.5">
                          {service.title}
                        </span>
                        <span className="mt-2 block max-w-[36rem] text-[0.94rem] leading-relaxed text-body">
                          {service.tagline}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="hidden size-11 items-center justify-center rounded-full border border-line-strong text-ink transition-[background-color,color,border-color,transform] duration-[200ms] ease-expo group-hover/row:border-ink group-hover/row:bg-ink group-hover/row:text-page group-active/row:scale-95 md:inline-flex"
                      >
                        <ArrowUpRight className="size-4.5" strokeWidth={1.75} />
                      </span>
                    </Link>
                  </Reveal>
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
