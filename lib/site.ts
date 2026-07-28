/**
 * Constantes de marque, navigation et conversion.
 * Référence : "Heliara - Architecture UX" (01 Arborescence, 03 Système de CTA),
 * SiteHeader et SiteFooter.
 */

export const site = {
  name: "Heliara",
  baseline: "Votre métier, traduit en produit.",
  description:
    "Studio de conception et de développement de produits numériques : plateformes métiers, SaaS, applications et IA.",
  url: "https://heliara.fr",
  email: "contact@heliara.fr",
  // À remplacer par le numéro réel.
  phone: "+33 (0)0 00 00 00 00",
  responseCommitment: "Réponse d'un associé sous 48 heures.",
} as const

export const group = {
  name: "Hexceos",
  /** Formulation d'endossement : footer, /le-groupe, une ligne sur /a-propos. */
  endorsement: "Heliara, une marque du groupe Hexceos",
  href: "/le-groupe",
} as const

/** Six entrées de nav principale + un CTA permanent. Deux niveaux maximum. */
export const mainNav = [
  { label: "Expertises", href: "/expertises" },
  { label: "Réalisations", href: "/realisations" },
  { label: "Méthode", href: "/methode" },
  { label: "À propos", href: "/a-propos" },
  { label: "Ressources", href: "/ressources" },
  { label: "Carrières", href: "/carrieres" },
] as const

/** Trois niveaux d'engagement, jamais plus. */
export const cta = {
  primary: {
    label: "Parlons de votre projet",
    shortLabel: "Contact",
    href: "/contact",
  },
  secondary: {
    label: "Voir nos réalisations",
    href: "/realisations",
  },
  method: {
    label: "Découvrir la méthode",
    href: "/methode",
  },
} as const

/** Sous-liens Expertises repris dans le menu mobile et le footer. */
export const expertiseFamilies = [
  { label: "Plateformes & SaaS", href: "/expertises/plateformes-saas" },
  { label: "Sites & e-commerce", href: "/expertises/sites-e-commerce" },
  { label: "IA & API", href: "/expertises/ia-api" },
] as const

export const footerNav = [
  {
    title: "Expertises",
    links: [
      ...expertiseFamilies,
      {
        label: "Maintenance évolutive",
        href: "/expertises/maintenance-evolutive",
      },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "Méthode", href: "/methode" },
      { label: "À propos", href: "/a-propos" },
      { label: "Carrières", href: "/carrieres" },
      { label: "Ressources", href: "/ressources" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: cta.primary.label, href: cta.primary.href },
      { label: site.email, href: `mailto:${site.email}` },
      { label: `Le groupe ${group.name}`, href: group.href },
    ],
  },
] as const

export const legalNav = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
] as const
