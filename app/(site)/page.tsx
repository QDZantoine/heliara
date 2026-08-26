import { CaseList } from "@/components/home/case-list"
import { ExpertiseGrid } from "@/components/home/expertise-grid"
import { Hero } from "@/components/home/hero"
import { JsonLd } from "@/components/seo/json-ld"
import { GuaranteesSection } from "@/components/home/guarantees-section"
import { KpiBand } from "@/components/home/kpi-band"
import { MethodPreview } from "@/components/home/method-preview"
import { ServiceAreas } from "@/components/home/service-areas"
import { ClientMarquee } from "@/components/home/client-marquee"
import { Testimonials } from "@/components/home/testimonials"
import { FinalCta } from "@/components/sections/final-cta"
import { listPublicCases } from "@/lib/db/public-cases"
import { listPublicClients } from "@/lib/db/public-clients"
import { listPublicTestimonials } from "@/lib/db/public-testimonials"
import { expertiseFamilies } from "@/lib/content/expertises"
import { graph, studioServiceNode } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"
import { homeTitle, site } from "@/lib/site"

import type { Metadata } from "next"

/**
 * L'accueil n'avait aucune métadonnée propre : il héritait du titre et de la
 * description du layout racine, ce qui était juste, mais sans canonique ni
 * OpenGraph. Le titre reprend donc ici la même formulation, et rien n'est perdu.
 *
 * La canonique de la racine compte plus qu'ailleurs : c'est la page qui reçoit le
 * plus de variantes d'adresse - avec `www`, avec une barre finale, avec un paramètre
 * de campagne - et chacune se présenterait sinon comme une page distincte.
 */
export const metadata: Metadata = pageMetadata({
  title: homeTitle,
  description: site.description,
  path: "/",
  absoluteTitle: true,
})

/**
 * Accueil - une conversation en dix temps (Architecture UX, 05).
 *
 * Arc : affirmation (hero) → caution (preuve sociale) → quoi (expertises) →
 * comment (méthode) → preuve (réalisations, chiffres) → pairs (témoignages) →
 * demande (CTA final). Le rythme alterne section dense et section respirante,
 * et la demande n'arrive qu'après les trois objections levées.
 */
/**
 * Une minute, comme le hub. Littéral obligatoire : Next analyse cet export
 * statiquement. Voir la note de `app/(site)/realisations/page.tsx`.
 */
export const revalidate = 60

export default async function HomePage() {
  /*
    Trois lectures indépendantes, en parallèle : aucune ne dépend des autres. Les deux
    premières portent leur propre repli sur le contenu statique - un accueil sans preuve
    serait pire qu'un accueil un peu périmé.

    La troisième est différente et il faut le savoir : le repli statique des témoignages
    est **vide**, ses verbatims inventés ayant été retirés. Une base muette fait donc
    disparaître la section au lieu d'en servir une version périmée, ce qui est le bon
    comportement - un accueil plus court vaut mieux qu'une citation qu'on n'a pas.
  */
  const [cases, clients, testimonials] = await Promise.all([
    listPublicCases(),
    listPublicClients(),
    listPublicTestimonials(),
  ])
  const featured = cases.filter((item) => item.featured)

  return (
    <>
      {/*
        L'offre, une fois, sur la page qui la montre.

        L'organisation et le site sont posés par `SiteChrome` sur toutes les pages ;
        celui-ci n'a de sens que sur l'accueil, qui montre les trois familles et les
        villes. Voir `studioServiceNode` pour la raison qui écarte
        `ProfessionalService`.
      */}
      <JsonLd
        data={graph([
          studioServiceNode(expertiseFamilies.map((family) => family.label)),
        ])}
      />
      <Hero />
      <ClientMarquee clients={clients} />
      <ExpertiseGrid />
      <MethodPreview />
      <CaseList cases={featured} />
      <KpiBand />
      <GuaranteesSection />
      {/* La distance, juste après le risque contractuel : deux objections lues à la
          suite, avant les pairs et la demande. */}
      <ServiceAreas />
      {/* Les pairs, entre la preuve et la demande : la place que l'Architecture UX donne
          aux témoignages. La section ne se rend pas tant qu'aucune citation n'est en
          ligne, donc son retour ne change rien à l'accueil aujourd'hui. */}
      <Testimonials testimonials={testimonials} />
      <FinalCta />
    </>
  )
}
