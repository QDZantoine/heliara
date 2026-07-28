/**
 * Trois familles d’expertise pour l’accueil (le visiteur se reconnaît dans un
 * problème, pas dans un catalogue), neuf services pour le hub et le SEO
 * d’intention. Référence : Architecture UX, S4 et fiche « Expertises ».
 */

export type ExpertiseFamilySlug =
  "plateformes-saas" | "sites-e-commerce" | "ia-api"

export type ExpertiseFamily = {
  slug: ExpertiseFamilySlug
  /** Libellé court, utilisé en navigation et en pied de page. */
  label: string
  /** Titre de la carte d’accueil. */
  title: string
  summary: string
  /** Étiquette technique du visuel schématique. */
  tag: string
  halo: "warm" | "cool"
  /** Largeurs en % des barres du visuel : trois valeurs. */
  lines: [number, number, number]
}

export const expertiseFamilies: ExpertiseFamily[] = [
  {
    slug: "plateformes-saas",
    label: "Plateformes & SaaS",
    title: "Plateformes & SaaS",
    summary:
      "Votre processus métier devient un produit : plateformes de gestion, portails clients, SaaS multi-tenants. Conçus pour durer et évoluer.",
    tag: "saas",
    halo: "warm",
    lines: [70, 45, 58],
  },
  {
    slug: "sites-e-commerce",
    label: "Sites & e-commerce",
    title: "Sites & e-commerce",
    summary:
      "Sites institutionnels et boutiques qui portent votre crédibilité : rapides, accessibles, pensés pour convertir sans crier.",
    tag: "web",
    halo: "cool",
    lines: [55, 72, 40],
  },
  {
    slug: "ia-api",
    label: "IA & API",
    title: "IA & API",
    summary:
      "Des capacités d’intelligence intégrées à vos outils — copilotes métier, automatisations, API robustes qui connectent votre écosystème.",
    tag: "ia · api",
    halo: "warm",
    lines: [48, 62, 76],
  },
]

export function expertiseHref(slug: string) {
  return `/expertises/${slug}`
}
