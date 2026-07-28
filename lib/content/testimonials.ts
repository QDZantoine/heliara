export type Testimonial = {
  quote: string
  name: string
  role: string
  initials: string
}

/**
 * La voix des pairs, juste avant la demande de contact : la dernière voix
 * entendue doit être celle d’un client (Architecture UX, S8).
 * Verbatims à faire valider et signer par leurs auteurs.
 */
export const testimonials: Testimonial[] = [
  {
    quote:
      "Ils ont compris notre métier avant de parler technologie. Le produit livré fait exactement ce que nos équipes attendaient — et il tient la charge.",
    name: "Claire Fontaine",
    role: "Directrice générale, Groupe Ardan",
    initials: "CF",
  },
  {
    quote:
      "Une rigueur rare, du cadrage à la mise en production. Les jalons annoncés ont tous été tenus, sans exception.",
    name: "Thomas Meunier",
    role: "DSI, Voltéis Industrie",
    initials: "TM",
  },
  {
    quote:
      "Le code nous appartient, la documentation est impeccable, la réversibilité est réelle. C’est la première fois qu’un prestataire nous laisse aussi libres.",
    name: "Awa Diallo",
    role: "CTO, Nexa Santé",
    initials: "AD",
  },
]
