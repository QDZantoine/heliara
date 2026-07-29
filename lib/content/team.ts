/**
 * Équipe et convictions. Noms, rôles et parcours à faire valider par les
 * intéressés avant mise en ligne : la fiche « À propos » repose entièrement sur
 * des visages réels, c'est ce qui la rend crédible.
 */

export type Person = {
  name: string
  role: string
  initials: string
  /** Une ligne de parcours : ce qui rend le rôle crédible. */
  background: string
  /** Teinte de la pastille d'initiales. */
  accent: "brand" | "info"
}

/** Les deux associés : ce sont eux qui répondent aux messages de contact. */
export const partners: Person[] = [
  {
    name: "Léa Roussel",
    role: "Associée — produit, cadrage, design",
    initials: "LR",
    background:
      "Douze ans de conception de produits métiers, dont six à diriger le design d'une plateforme logistique utilisée par 4 000 opérateurs.",
    accent: "brand",
  },
  {
    name: "Marc Bianchi",
    role: "Associé — architecture, technique, sécurité",
    initials: "MB",
    background:
      "Quinze ans d'ingénierie logicielle, ancien responsable technique d'un éditeur santé certifié HDS. Intervient sur les choix d'architecture de chaque projet.",
    accent: "info",
  },
]

export const team: Person[] = [
  ...partners,
  {
    name: "Awa Traoré",
    role: "Designer produit",
    initials: "AT",
    background:
      "Recherche utilisateur et design system. Anime les tests en conditions réelles, y compris en atelier et en service de soin.",
    accent: "info",
  },
  {
    name: "Julien Pérez",
    role: "Ingénieur logiciel",
    initials: "JP",
    background:
      "TypeScript de bout en bout, bases de données, reprise de données historiques. Le pipeline de nettoyage de Voltéis, c'est lui.",
    accent: "brand",
  },
  {
    name: "Nora Belkacem",
    role: "Ingénieure logiciel",
    initials: "NB",
    background:
      "Accessibilité et front-end. Tient le niveau AA sur chaque livraison, et le RGAA quand le client y est soumis.",
    accent: "info",
  },
  {
    name: "Samuel Ott",
    role: "Chef de projet",
    initials: "SO",
    background:
      "Interlocuteur unique du cadrage à la mise en production. Ne passe jamais un projet à quelqu'un d'autre en cours de route.",
    accent: "brand",
  },
]

/** Le manifeste : court, déclaratif, sans exclamation. */
export const manifesto = {
  lead: "Nous concevons des produits numériques pour des organisations dont le métier est trop particulier pour rentrer dans un logiciel du marché.",
  body: [
    "Un studio à taille humaine, délibérément. Six personnes, un seul projet majeur à la fois par binôme, et l'associé qui cadre est celui qui livre. Cette contrainte nous coûte des affaires ; elle nous évite les projets que personne ne porte vraiment.",
    "Nous ne vendons pas de la technologie, nous traduisons un métier. Ce qui suppose de passer du temps dans vos ateliers, vos services, vos bureaux, avant d'écrire une ligne de code. C'est la partie du travail qui ne se voit pas dans un devis, et celle qui décide de tout.",
  ],
}

/** Convictions de conception : des partis pris, pas des valeurs affichées. */
export const convictions = [
  {
    title: "Le périmètre le plus petit qui serve",
    text: "Un produit qui couvre 60 % du besoin et qui est utilisé vaut mieux qu'un produit complet livré dans deux ans. Nous découpons pour qu'une partie serve avant que le tout soit terminé.",
  },
  {
    title: "Une stack ennuyeuse",
    text: "TypeScript, React, Node, PostgreSQL. Des choix disponibles sur le marché du recrutement dans dix ans. La nouveauté technique est un risque que le client paie, pas un argument.",
  },
  {
    title: "L'accessibilité au cadrage, pas en audit",
    text: "Traitée dès la conception, elle coûte moins cher qu'un rattrapage et améliore l'interface pour tout le monde. Traitée à la fin, c'est une facture et un compromis.",
  },
  {
    title: "Dire non quand c'est la bonne réponse",
    text: "Il nous arrive de recommander un logiciel du marché, ou de ne rien toucher à un existant qui fonctionne. Nous préférons perdre une affaire que livrer un projet dont nous doutons.",
  },
]

/** Les trois étapes qui suivent un message de contact. */
export const contactSteps = [
  {
    num: "01",
    title: "Réponse personnelle sous 48 h",
    text: "Pas d'accusé automatique : un associé lit votre message et vous répond directement.",
  },
  {
    num: "02",
    title: "Échange de trente minutes",
    text: "En visio ou au studio. On clarifie le besoin, on pose les bonnes questions — y compris celles qui fâchent.",
  },
  {
    num: "03",
    title: "Pré-cadrage honnête",
    text: "Périmètre, risques, ordre de grandeur budgétaire. Y compris « achetez un logiciel du marché » si c'est la bonne réponse.",
  },
]

/** Enveloppes proposées au formulaire : aide à cadrer la réponse. */
export const budgetRanges = [
  "Je préfère en parler",
  "Moins de 50 k€",
  "50 – 150 k€",
  "150 – 400 k€",
  "Plus de 400 k€",
] as const
