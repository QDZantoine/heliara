import { absoluteUrl } from "@/lib/seo"

/**
 * Les cartes de visite numériques, et le fichier `.vcf` qu'elles servent.
 *
 * **Pourquoi ces données ne vivent pas dans `lib/content/team.ts`.** L'équipe est
 * administrable et décrit des personnes telles que le site les présente : parcours,
 * spécialités, portrait. Une carte de visite est un autre objet - une adresse à donner,
 * un numéro à composer - et toute personne de l'équipe n'en a pas forcément une. Les
 * deux listes se recoupent sans se confondre, et fusionner les deux ferait qu'ajouter
 * un collaborateur au site publierait son numéro de téléphone.
 *
 * **Ce fichier est en clair dans le dépôt, et c'est un choix à assumer** : les adresses
 * et les numéros qui y figurent sont ceux qu'on tend à un prospect. Ne rien y mettre
 * qu'on ne donnerait pas sur une carte de papier.
 */

export type VCard = {
  slug: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  /**
   * L'adresse professionnelle, **facultative**.
   *
   * Absente, le bouton n'est pas rendu et la propriété `EMAIL` ne part pas dans le
   * `.vcf`. Une adresse devinée d'après le motif d'une autre - même juste neuf fois sur
   * dix - est un contact qui rebondit, sur une carte qu'on vient de tendre.
   */
  email?: string
  /** Format international sans séparateur : la seule forme qu'un lien `tel:` compose. */
  phone: string
  /** Le même numéro, écrit pour être lu. */
  phoneDisplay: string
  website: string
  /** Prise de rendez-vous. Absente, le bouton n'est pas rendu. */
  calUrl?: string
  initials: string
  /**
   * Le portrait, en deux variantes de fond.
   *
   * **Deux fichiers et non un seul, pour la même raison que les cartes d'équipe** : un
   * détourage sur blanc posé sur une carte encre devient un pavé lumineux, et le fond
   * orange sur une carte claire écrase le reste. Le thème étant une classe sur `<html>`,
   * les deux images sont rendues et le CSS en masque une.
   *
   * `light` est aussi celle qui part dans le `.vcf` : une fiche contact s'affiche sur
   * fond clair dans les deux systèmes.
   */
  photo?: { light: string; dark: string }
}

export const VCARDS: Record<string, VCard> = {
  antoine: {
    slug: "antoine",
    firstName: "Antoine",
    lastName: "Quendez",
    fullName: "Antoine Quendez",
    role: "Associé - Lead Developer",
    email: "quendez.antoine@heliara.fr",
    phone: "+33743752572",
    phoneDisplay: "07 43 75 25 72",
    website: "https://heliara.fr",
    calUrl: "https://cal.com/antoine-quendez-gcmupq",
    initials: "AQ",
    photo: {
      light: "/team/antoine-white.png",
      dark: "/team/antoine-orange.png",
    },
  },
  gaetan: {
    slug: "gaetan",
    firstName: "Gaëtan",
    lastName: "Maiuri",
    fullName: "Gaëtan Maiuri",
    /* Le même intitulé qu'en base et sur `/a-propos` : une personne, un rôle. */
    role: "Fondateur du groupe - stratégie, sécurité & infrastructure",
    phone: "+33763674595",
    phoneDisplay: "07 63 67 45 95",
    website: "https://heliara.fr",
    initials: "GM",
    photo: { light: "/team/gaetan-white.png", dark: "/team/gaetan-orange.png" },
  },
  // Alexandre n'en a pas : hors du périmètre pour l'instant, et publier le numéro
  // direct de quelqu'un ne se décide pas à sa place.
}

/** La baseline de la carte. Reprise du site, à un endroit près : elle y est plus courte. */
export const VCARD_BASELINE =
  "Studio de conception et de développement de produits numériques sur mesure. Votre métier, traduit en produit."

/**
 * La note du fichier `.vcf`.
 *
 * Elle atterrit dans le champ « Notes » de la fiche contact, qui est souvent la seule
 * chose que le destinataire relira six mois plus tard : elle dit le métier, pas la
 * baseline.
 */
const VCARD_NOTE =
  "Studio de conception et développement de produits numériques sur mesure : plateformes, SaaS, ERP, sites, automatisations."

export function getVCard(slug: string): VCard | undefined {
  return VCARDS[slug]
}

/** Les slugs, pour `generateStaticParams` des deux routes. */
export function vcardSlugs(): string[] {
  return Object.keys(VCARDS)
}

/**
 * Échappe une valeur de propriété vCard.
 *
 * `\`, `;` et `,` ont un sens dans la grammaire, et une virgule non échappée dans une
 * note coupe la valeur en deux au lieu d'être affichée. L'antislash est traité en premier,
 * sinon on échapperait les antislashes qu'on vient d'ajouter.
 */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/**
 * Le contenu du fichier `.vcf`, en vCard 3.0.
 *
 * **3.0 et non 4.0**, parce que c'est la version que les Contacts d'iOS et d'Android
 * importent sans discuter depuis quinze ans. La 4.0 est plus propre et moins bien reçue.
 *
 * **Fins de ligne en CRLF**, comme la spécification l'exige. Les analyseurs tolèrent le
 * LF seul, mais c'est exactement le genre de tolérance sur laquelle un import échoue sur
 * un appareil et pas sur un autre.
 *
 * **Les lignes ne sont pas repliées à 75 octets**, bien que la spécification le
 * recommande : seule la note dépasse, tous les analyseurs modernes l'acceptent entière,
 * et un repli mal placé au milieu d'une séquence UTF-8 casserait le fichier pour de bon.
 * Le risque est du mauvais côté.
 *
 * **La photo part en URI et non en base64.** Un portrait de 800 px encodé pèserait
 * quelques centaines de kilo-octets dans un fichier censé être instantané, et l'URI se
 * corrige en remplaçant le fichier - un base64 se corrige en rediffusant la carte.
 */
export function vcardText(card: VCard): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeValue(card.lastName)};${escapeValue(card.firstName)};;;`,
    `FN:${escapeValue(card.fullName)}`,
    "ORG:Heliara",
    `TITLE:${escapeValue(card.role)}`,
    `TEL;TYPE=CELL,VOICE:${escapeValue(card.phone)}`,
    `URL:${escapeValue(card.website)}`,
    `NOTE:${escapeValue(VCARD_NOTE)}`,
  ]

  if (card.email) {
    lines.push(`EMAIL;TYPE=WORK,INTERNET:${escapeValue(card.email)}`)
  }

  if (card.calUrl) {
    // Une seconde URL, étiquetée : la fiche contact garde alors le lien de prise de
    // rendez-vous à côté du site, au lieu de le perdre.
    lines.push(`URL;TYPE=Rendez-vous:${escapeValue(card.calUrl)}`)
  }

  if (card.photo) {
    lines.push(`PHOTO;VALUE=URI:${absoluteUrl(card.photo.light)}`)
  }

  lines.push("END:VCARD")
  return lines.join("\r\n") + "\r\n"
}

/** Le nom du fichier téléchargé. C'est ce que le destinataire verra dans ses fichiers. */
export function vcardFilename(card: VCard): string {
  return `${card.slug}-heliara.vcf`
}
