import { hostingStatement } from "@/lib/content/group"
import { site } from "@/lib/site"

/**
 * Pages légales. Objectif : conformité irréprochable, qui est aussi un signal de
 * sérieux pour un DSI.
 *
 * Les mentions marquées « à compléter » attendent les informations réelles :
 * raison sociale, capital, immatriculation, coordonnées du délégué à la
 * protection des données. Elles ne doivent pas être publiées en l'état.
 */

export type LegalSection = {
  title: string
  /** Paragraphes, ou paires libellé / valeur pour les blocs d'identification. */
  paragraphs?: string[]
  rows?: { label: string; value: string }[]
}

export const legalNotice: LegalSection[] = [
  {
    title: "Éditeur du site",
    rows: [
      { label: "Raison sociale", value: "À compléter" },
      { label: "Forme juridique", value: "À compléter" },
      { label: "Capital social", value: "À compléter" },
      { label: "Immatriculation", value: "RCS à compléter" },
      { label: "Numéro de TVA", value: "À compléter" },
      { label: "Siège social", value: "À compléter" },
      { label: "Adresse électronique", value: site.email },
      { label: "Téléphone", value: site.phone },
      { label: "Directeur de la publication", value: "À compléter" },
    ],
  },
  {
    title: "Rattachement au groupe",
    paragraphs: [
      "Heliara est une marque du groupe, aux côtés de LessonSharing (formation IT) et Hexceos (cybersécurité, infogérance, hébergement). Les trois marques sont indépendantes dans leur métier et complémentaires dans leur mission.",
      "Dirigeant : Gaetan Maiuri. Siège : 76 rue du Trou Grillon, 91280 Saint-Pierre-du-Perray. Nom du groupe et SIREN de Heliara : à compléter.",
    ],
  },
  {
    title: "Hébergement",
    paragraphs: [hostingStatement],
  },
  {
    title: "Propriété intellectuelle",
    paragraphs: [
      "L'ensemble des contenus de ce site, textes, illustrations, éléments d'interface et code, est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.",
      "Les marques et logotypes des clients cités le sont avec leur accord, et restent la propriété de leurs titulaires respectifs.",
      "Le code produit dans le cadre de nos missions appartient à nos clients dès le premier jour, conformément à nos engagements contractuels. Il n'entre pas dans le champ de la présente clause.",
    ],
  },
  {
    title: "Accessibilité",
    paragraphs: [
      "Ce site est conçu pour respecter le niveau AA des règles pour l'accessibilité des contenus web. Si vous rencontrez une difficulté d'accès à une information, signalez-le à " +
        site.email +
        " : nous corrigeons et vous répondons.",
    ],
  },
]

export const privacyPolicy: LegalSection[] = [
  {
    title: "Responsable du traitement",
    paragraphs: [
      "Les données collectées sur ce site sont traitées par l'éditeur identifié dans les mentions légales. Pour toute question relative à vos données, écrivez à " +
        site.email +
        ".",
      "Coordonnées du délégué à la protection des données : à compléter.",
    ],
  },
  {
    title: "Données collectées et finalités",
    rows: [
      {
        label: "Formulaire de contact",
        value:
          "Nom, société, adresse électronique, description du projet et enveloppe envisagée. Finalité : répondre à votre demande. Base légale : votre consentement.",
      },
      {
        label: "Abonnement aux ressources",
        value:
          "Adresse électronique seule. Finalité : vous envoyer nos publications. Base légale : votre consentement, retirable à tout moment.",
      },
      {
        label: "Mesure d'audience",
        value:
          "À compléter selon l'outil retenu. Aucun traceur publicitaire n'est déposé, et aucun traceur non nécessaire ne l'est sans votre accord.",
      },
    ],
  },
  {
    title: "Durées de conservation",
    paragraphs: [
      "Demandes de contact : trois ans à compter du dernier échange, puis suppression.",
      "Abonnement aux ressources : jusqu'à votre désabonnement, puis suppression sous trente jours.",
    ],
  },
  {
    title: "Destinataires et sous-traitants",
    paragraphs: [
      "Vos données ne sont ni vendues, ni cédées, ni utilisées à des fins de prospection automatisée.",
      "Elles sont traitées par nos sous-traitants techniques dans le seul cadre de leur mission, sous contrat conforme au règlement général sur la protection des données : hébergement, acheminement des messages électroniques. La liste détaillée est disponible sur demande.",
    ],
  },
  {
    title: "Hébergement et localisation",
    paragraphs: [hostingStatement],
  },
  {
    title: "Vos droits",
    paragraphs: [
      "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données. Pour l'exercer, écrivez à " +
        site.email +
        ". Nous répondons sous un mois.",
      "Vous pouvez introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés si vous estimez que le traitement de vos données n'est pas conforme.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "Ce site ne dépose aucun cookie publicitaire. Seuls les traceurs strictement nécessaires à son fonctionnement peuvent être utilisés, sans consentement requis. Votre préférence de thème clair ou sombre est conservée dans le stockage local de votre navigateur, et n'est jamais transmise.",
    ],
  },
]
