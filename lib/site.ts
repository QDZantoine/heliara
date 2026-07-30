/**
 * Constantes de marque, navigation et conversion.
 * Référence : "Heliara - Architecture UX" (01 Arborescence, 03 Système de CTA),
 * SiteHeader et SiteFooter.
 */

import { expertiseFamilies, expertiseHref } from "@/lib/content/expertises"

export const site = {
  name: "Heliara",
  baseline: "Votre métier, traduit en produit.",
  description:
    "Studio de conception et de développement de produits numériques : plateformes métiers, SaaS, applications et IA.",
  url: "https://heliara.fr",
  email: "contact@heliara.fr",
  // À remplacer par le numéro réel.
  phone: "+33 (0)0 00 00 00 00",
  responseCommitment: "Réponse d’un associé sous 48 heures.",
} as const

/**
 * Les profils publics du studio, pour le `sameAs` des données structurées.
 *
 * **C'est ce qui relie « Heliara » à une entité et non à un mot.** Un moteur - et
 * plus encore un moteur générateur de réponses - a besoin de recouper le nom avec des
 * comptes existants pour être sûr de parler de la bonne organisation. Sans `sameAs`,
 * rien ne distingue ce studio d'un homonyme.
 *
 * **La liste est vide, et elle doit le rester tant que les URL ne sont pas
 * vérifiées.** Un `sameAs` vers un compte qui n'est pas le nôtre relie l'entité à
 * quelqu'un d'autre, et c'est plus dommageable que l'absence. Les schémas omettent la
 * propriété quand la liste est vide.
 *
 * À compléter : page LinkedIn de l'entreprise en priorité, puis tout profil que le
 * studio tient réellement à jour.
 */
export const socialProfiles: readonly string[] = []

/**
 * Endossement de groupe. **Le nom du holding n’apparaît nulle part sur le site
 * public** : il ne vit que dans les mentions légales. Hexceos et LessonSharing
 * sont des marques sœurs, pas une maison mère, et /le-groupe met en avant les
 * trois marques plutôt que le holding.
 */
export const group = {
  endorsement: "Heliara, une marque du groupe",
  label: "Le groupe",
  href: "/le-groupe",
} as const

/** Cinq entrées de nav principale + un CTA permanent. Deux niveaux maximum. */
export const mainNav = [
  { label: "Expertises", href: "/expertises" },
  { label: "Réalisations", href: "/realisations" },
  { label: "Méthode", href: "/methode" },
  { label: "À propos", href: "/a-propos" },
  { label: "Ressources", href: "/ressources" },
] as const

/** Trois niveaux d’engagement, jamais plus. */
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

/**
 * Sous-liens Expertises, **en secours seulement**.
 *
 * Les familles sont administrables : la nav est donc lue en base par
 * `publicExpertiseNav()` et passée au chrome du site. Cette liste sert de repli quand
 * la base ne répond pas - et le repli compte double ici, puisque ces entrées sont
 * présentes sur chaque page : une base muette ne doit pas vider le menu.
 */
export const expertiseNavFallback = expertiseFamilies.map((family) => ({
  label: family.label,
  href: expertiseHref(family.slug),
}))

export const footerNav = [
  {
    title: "Expertises",
    links: [
      ...expertiseNavFallback,
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
      { label: "Ressources", href: "/ressources" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: cta.primary.label, href: cta.primary.href },
      { label: site.email, href: `mailto:${site.email}` },
      { label: group.label, href: group.href },
    ],
  },
] as const

export const legalNav = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
] as const
