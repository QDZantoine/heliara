export type Kpi = {
  value: string
  label: string
}

/**
 * Respiration chiffrée (S7). Des valeurs exactes et vérifiables uniquement :
 * la crédibilité du ton de voix s’applique aussi aux données. À confirmer
 * avant mise en ligne.
 */
export const kpis: Kpi[] = [
  { value: "47", label: "produits livrés en production" },
  { value: "9 ans", label: "d’ancienneté moyenne de nos équipes" },
  { value: "87 %", label: "de clients qui reviennent" },
  { value: "99,9 %", label: "de disponibilité constatée" },
]
