export type Kpi = {
  value: string
  label: string
  description: string
}

/**
 * Principes de conception (S7). Pas de statistiques marketing : des engagements
 * lisibles, stables et vérifiables dans la manière de travailler.
 */
export const kpis: Kpi[] = [
  {
    value: "100 %",
    label: "Développement sur mesure",
    description:
      "Chaque solution est conçue pour répondre à vos besoins métiers.",
  },
  {
    value: "1",
    label: "Interlocuteur dédié",
    description: "Un seul contact, du cadrage jusqu'à la mise en production.",
  },
  {
    value: "0",
    label: "Verrou fournisseur",
    description:
      "Vous restez libre de votre hébergement, de vos données et de votre code.",
  },
  {
    value: "∞",
    label: "Pensé pour évoluer",
    description:
      "Une architecture conçue pour accompagner durablement la croissance de votre entreprise.",
  },
]
