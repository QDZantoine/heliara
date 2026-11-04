/**
 * Le manifeste de l'accueil (S3 bis) : ce que le studio croit, dit une fois, en
 * grand, sur fond encre.
 *
 * **Deux phrases, pas un paragraphe.** `lead` est l'affirmation, `body` la raison :
 * la section les compose en un seul bloc typographique qui s'allume mot à mot au
 * défilement, et c'est la brièveté qui rend ce geste lisible. Un texte plus long
 * ferait de l'allumage une attente.
 *
 * Les quatre principes qui l'accompagnent vivent dans `kpis.ts` : ce sont eux, pas des
 * chiffres marketing, et la règle qui les distingue des garanties reste celle de
 * `CLAUDE.md`.
 */
export type Manifesto = {
  eyebrow: string
  lead: string
  body: string
}

export const manifesto: Manifesto = {
  eyebrow: "Ce que nous croyons",
  lead: "Le métier avant l'outil.",
  body: "Nous ne vendons pas une technologie. Nous traduisons une façon de travailler en un produit qui tient, s'explique et s'entretient. Et quand un logiciel existant fait mieux, nous le disons.",
}
