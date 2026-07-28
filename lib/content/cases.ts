export type CaseStudy = {
  slug: string
  sector: string
  title: string
  summary: string
  /** Un seul résultat chiffré par carte, vérifiable. */
  figure: string
  measure: string
  halo: "warm" | "cool"
  accent: "brand" | "info"
}

/**
 * Trois cas couvrant trois secteurs différents : chaque persona doit se
 * reconnaître dans au moins un (Architecture UX, S6).
 */
export const featuredCases: CaseStudy[] = [
  {
    slug: "pilotage-production",
    sector: "Industrie",
    title: "Plateforme de pilotage de production",
    summary:
      "Un ERP métier sur mesure qui remplace quatre outils déconnectés : ordres de fabrication, qualité et expéditions dans une seule interface.",
    figure: "−38 %",
    measure: "de temps administratif par commande",
    halo: "warm",
    accent: "brand",
  },
  {
    slug: "portail-patients",
    sector: "Santé",
    title: "Portail patients & professionnels",
    summary:
      "Prise de rendez-vous, documents et échanges sécurisés pour un groupement hospitalier — accessible RGAA, adopté sans formation.",
    figure: "92 %",
    measure: "d’adoption en trois mois",
    halo: "cool",
    accent: "info",
  },
  {
    slug: "saas-interventions",
    sector: "Services B2B",
    title: "SaaS de gestion des interventions",
    summary:
      "De l’outil interne au produit commercialisé : refonte complète, facturation intégrée, API publique. Aujourd’hui vendu à ses propres concurrents.",
    figure: "×3",
    measure: "de revenus récurrents en un an",
    halo: "warm",
    accent: "brand",
  },
]
