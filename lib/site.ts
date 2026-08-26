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
  /*
    La ligne du studio, portée par l'éditeur Hexceos SARL - c'est aussi celle que
    portent les mentions légales, et il n'y en a qu'une : `/contact` et les mentions
    lisent cette constante, deux numéros différents feraient douter des deux.

    **Elle a remplacé un numéro de remplissage**, `+33 (0)0 00 00 00 00`, qui s'affichait
    sur `/contact` avec un lien `tel:+330000000000` : la seule information fausse qui
    restait sur le site, et la plus visible, puisqu'un visiteur qui compose un numéro
    inexistant en tire une conclusion immédiate sur le sérieux du studio.
  */
  phone: "+33 1 59 35 35 56",
  responseCommitment: "Réponse d’un associé sous 48 heures.",
} as const

/**
 * Le numéro du studio en E.164, et son lien d'appel.
 *
 * **Une seule fois, ici.** Trois endroits ont besoin de cette forme sans espaces - le
 * lien d'appel de `/contact`, le `telephone` des données structurées, et demain le
 * suivant - et la regex recopiée est exactement le genre de détail qui finit par
 * diverger d'une copie à l'autre.
 */
/**
 * Le titre de l'accueil dans un onglet et dans un résultat de recherche.
 *
 * **Il ne reprend plus la baseline, et c'est une décision de référencement.** « Heliara -
 * Votre métier, traduit en produit » ne contient aucun mot de catégorie : rien n'y dit
 * qu'il s'agit de développement. Or « Heliara » est déjà le nom d'une autrice-compositrice
 * d'Ottawa présente sur Spotify, Apple Music et la presse musicale, plus celui d'une
 * société sans lien au registre. Un moteur qui doit trancher entre plusieurs entités du
 * même nom se sert d'abord de ce que la page dit d'elle-même.
 *
 * La baseline n'est pas perdue : elle reste le `h1` du hero, à l'endroit où elle est lue
 * par un humain plutôt que par un désambiguïsateur.
 *
 * Longueur tenue sous 65 caractères, au-delà desquels Google coupe. Si la coupe tombe
 * quand même, elle laisse « Heliara - Studio de développement web… », qui reste juste.
 */
export const homeTitle = `${site.name} - Studio de développement web et de produits numériques`

export const phoneE164 = site.phone.replace(/[^+\d]/g, "")
export const phoneTel = `tel:${phoneE164}`

/**
 * Les villes où le studio intervient.
 *
 * **Elles sont affichées avant d'être balisées** - pied de page de chaque écran, page
 * de contact, `llms.txt` - et le nœud `areaServed` reprend cette liste. Une ville
 * balisée mais absente de l'écran est un écart signalable, et c'est la même règle que
 * pour une FAQ ou un fil d'Ariane.
 *
 * **Ce ne sont pas des adresses, et rien ne le laisse croire.** Le studio n'a pas
 * d'agence dans chacune : aucune `PostalAddress` par ville, aucun `LocalBusiness`,
 * aucune page « développeur web à … ». Déclarer un établissement qui n'existe pas est
 * le premier motif de sanction en référencement local, et le nier ensuite coûte plus
 * cher que ce que la mention rapporte.
 *
 * L'ordre suit l'ancrage réel : le bassin de Montpellier d'abord, Paris en dernier.
 */
export const serviceAreas = [
  "Montpellier",
  "Béziers",
  "Nîmes",
  "Paris",
] as const

/**
 * La même liste, en une ligne : c'est ce que lisent le pied de page, `/contact` et
 * `llms.txt`.
 *
 * **Pas de tiret avant le complément**, et c'est délibéré : la règle du projet autorise
 * le tiret simple comme séparateur, mais dans une phrase qu'un visiteur lit il sonne
 * « rédigé par une machine ». Une virgule fait le même travail.
 */
export const serviceAreaLine = `${serviceAreas.join(", ")}, et à distance partout en France`

/**
 * La prise de rendez-vous, chez Cal.com.
 *
 * **Une troisième voie, jamais la première.** Le formulaire reste la porte par défaut de
 * `/contact` : il apporte le contexte du projet, un créneau n'apporte qu'un créneau. Le
 * rendez-vous se propose à côté de l'e-mail et du téléphone, dans le même bloc et du même
 * poids.
 *
 * `url` est l'adresse publique, celle que suit un visiteur sans JavaScript. `calLink` est
 * la même chose amputée du domaine, forme qu'attend l'API de l'embed.
 */
export const booking = {
  url: "https://cal.com/antoine-quendez-gcmupq",
  calLink: "antoine-quendez-gcmupq",
  label: "Réserver un créneau",
} as const

/**
 * Le canal WhatsApp Business, celui que porte la bulle flottante.
 *
 * **`number` est au format international sans aucun séparateur**, seule forme que
 * `wa.me` accepte : `33743752572`. Un `+`, un espace ou un `0` de tête y donnent une
 * page d'erreur de WhatsApp, pas une conversation. `display` est le même numéro écrit
 * pour être lu, et `tel:` se construit depuis `number` : un seul chiffre à corriger le
 * jour où le numéro change.
 *
 * **C'est un second numéro, et c'est voulu.** `site.phone` est la ligne du studio, celle
 * de `/contact` et des mentions légales ; celui-ci est le mobile professionnel, le seul
 * qui porte un compte WhatsApp. La bulle est le seul endroit du site où il figure, pour
 * qu'aucune page n'affiche deux numéros à la fois.
 *
 * **Rien n'est chargé depuis Meta avant le clic**, et c'est ce qui garde la page de
 * confidentialité vraie : la bulle est une ancre `https://wa.me/...` ordinaire, sans
 * script ni iframe. Même exigence que la prise de rendez-vous, pour la même raison.
 */
export const whatsapp = {
  label: "WhatsApp",
  number: "33743752572",
  display: "+33 7 43 75 25 72",
  /*
    Le message pré-rempli, que le visiteur peut effacer. Il sert surtout à ne pas
    laisser une conversation s'ouvrir sur un champ vide, qui fait hésiter.
  */
  greeting: "Bonjour, je souhaite échanger au sujet d'un projet.",
} as const

/**
 * Deux adresses, et la distinction compte.
 *
 * `whatsappUrl` est l'adresse nue de la conversation : c'est celle que citent les
 * données structurées et `llms.txt`, parce qu'une URL traînant un message pré-rempli
 * encodé se recopie mal et n'apprend rien à un moteur. `whatsappChatUrl` est celle
 * qu'ouvre la bulle, message compris.
 */
export const whatsappUrl = `https://wa.me/${whatsapp.number}`
export const whatsappChatUrl = `${whatsappUrl}?text=${encodeURIComponent(
  whatsapp.greeting
)}`

/** Le même numéro, en E.164, et en lien d'appel. */
export const whatsappE164 = `+${whatsapp.number}`
export const whatsappTel = `tel:${whatsappE164}`

/**
 * Les comptes publics du studio.
 *
 * **Une seule entrée, et c'est voulu** : un profil ne figure ici que si le studio le
 * tient réellement à jour. Un lien vers un compte mort dit qu'il n'y a personne
 * derrière la marque, ce qui est pire que ne rien afficher.
 *
 * Le libellé sert le pied de page, l'URL sert aussi le `sameAs` des données
 * structurées : les deux lisent la même constante, deux adresses différentes
 * feraient douter des deux.
 */
export const social = {
  linkedin: {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/heliara-fr/",
  },
} as const

/**
 * Les profils publics du studio, pour le `sameAs` des données structurées.
 *
 * **C'est ce qui relie « Heliara » à une entité et non à un mot.** Un moteur - et
 * plus encore un moteur générateur de réponses - a besoin de recouper le nom avec des
 * comptes existants pour être sûr de parler de la bonne organisation. Sans `sameAs`,
 * rien ne distingue ce studio d'un homonyme.
 *
 * **Une URL n'entre ici qu'une fois vérifiée.** Un `sameAs` vers un compte qui n'est
 * pas le nôtre relie l'entité à quelqu'un d'autre, et c'est plus dommageable que
 * l'absence. Les schémas omettent la propriété quand la liste est vide.
 */
export const socialProfiles: readonly string[] = [social.linkedin.href]

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
    label: "Découvrir nos réalisations",
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
      { label: social.linkedin.label, href: social.linkedin.href },
      { label: group.label, href: group.href },
    ],
  },
] as const

export const legalNav = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
] as const
