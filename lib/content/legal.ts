import { hostingStatement } from "@/lib/content/group"
import { site } from "@/lib/site"

/**
 * Pages légales. Objectif : conformité irréprochable, qui est aussi un signal de
 * sérieux pour un DSI.
 *
 * **Heliara n'est pas encore une personne morale**, et c'est le fait qui commande toute
 * cette page. Le site est édité par Hexceos SARL, qui exploite la marque Heliara ; une
 * structure propre sera immatriculée quand l'activité le justifiera, et ces mentions
 * seront alors reprises. D'ici là, les identifiants publiés sont ceux de l'éditeur réel.
 *
 * **Ce qui ne doit jamais être fait ici** : porter le nom « Heliara » en raison sociale
 * au-dessus du SIREN, du RCS ou de la TVA d'Hexceos. L'article 6-III de la loi LCEN
 * demande d'identifier l'éditeur, c'est-à-dire celui qui répond juridiquement du site.
 * Nommer une société qui n'existe pas au registre, en lui attribuant les identifiants
 * d'une autre, serait faux deux fois - et vérifiable en trente secondes par n'importe
 * quel visiteur sur l'annuaire des entreprises.
 *
 * La structure suit celle des mentions légales d'Hexceos, dont le texte est repris et
 * adapté à ce site. La seule mention encore ouverte est celle du délégué à la protection
 * des données, dans la politique de confidentialité.
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
    paragraphs: [
      "Le présent site, heliara.fr, est édité par Hexceos SARL, société à responsabilité limitée de droit français, qui exploite la marque Heliara.",
      "Une structure juridique propre à Heliara sera immatriculée lorsque l'activité le justifiera. Les présentes mentions seront alors mises à jour, et l'éditeur identifié ci-dessous demeure responsable du site jusque-là.",
    ],
    rows: [
      { label: "Raison sociale", value: "Hexceos SARL" },
      {
        label: "Forme juridique",
        value: "Société à responsabilité limitée",
      },
      { label: "Capital social", value: "1 000 euros" },
      { label: "SIREN", value: "919 321 182" },
      { label: "SIRET", value: "919 321 182 00017" },
      { label: "Immatriculation", value: "RCS Évry 919 321 182" },
      { label: "Numéro de TVA intracommunautaire", value: "FR00919321182" },
      { label: "Code APE / NAF", value: "6202A" },
      {
        label: "Siège social",
        value: "76 rue du Trou Grillon, 91280 Saint-Pierre-du-Perray, France",
      },
      { label: "Adresse électronique", value: site.email },
      /*
        `site.phone` et non une constante d'ici : c'est le même numéro que celui de
        `/contact`, et l'écrire deux fois garantirait qu'ils divergent. Un téléphone qui
        diffère entre la page de contact et les mentions légales fait douter des deux.
      */
      { label: "Téléphone", value: site.phone },
    ],
  },
  {
    title: "Directeur de la publication",
    paragraphs: [
      "Gaëtan Maiuri, gérant d'Hexceos SARL, au sens de l'article 6-III-1° de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.",
    ],
  },
  {
    title: "Rattachement au groupe",
    paragraphs: [
      "Heliara est une marque du groupe, aux côtés de LessonSharing (formation IT) et Hexceos (cybersécurité, infogérance, hébergement). Les trois marques sont indépendantes dans leur métier et complémentaires dans leur mission.",
      "Les marques LessonSharing et Hexceos sont citées sur ce site à ce titre. Les références clientes présentées comme les nôtres sont les nôtres : celles des marques sœurs leur restent attribuées.",
    ],
  },
  {
    title: "Hébergement",
    paragraphs: [
      hostingStatement,
      "L'éditeur et l'hébergeur de ce site sont la même personne morale. Aucune donnée du site n'est confiée à un hébergeur tiers.",
    ],
  },
  {
    title: "Propriété intellectuelle",
    paragraphs: [
      "L'ensemble des contenus de ce site, textes, illustrations, éléments d'interface, charte graphique et code, est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite et constitue une contrefaçon au sens des articles L. 335-2 et suivants du Code de la propriété intellectuelle.",
      "Les marques et logotypes des clients cités le sont avec leur accord, et restent la propriété de leurs titulaires respectifs.",
      "Le code produit dans le cadre de nos missions appartient à nos clients dès le premier jour, conformément à nos engagements contractuels. Il n'entre pas dans le champ de la présente clause.",
    ],
  },
  {
    title: "Liens hypertextes",
    paragraphs: [
      "La mise en place d'un lien vers ce site est libre, à condition qu'elle ne porte pas atteinte à l'image de Heliara et qu'elle n'induise pas en erreur sur l'origine du contenu. Nous nous réservons le droit d'en demander le retrait.",
      "Les liens sortants de ce site pointent vers des contenus dont nous n'avons pas la maîtrise, et leur présence n'engage pas notre responsabilité quant à leur contenu.",
    ],
  },
  {
    title: "Données personnelles",
    paragraphs: [
      "Le traitement des données collectées sur ce site est décrit dans notre politique de confidentialité, accessible depuis le pied de page.",
    ],
  },
  {
    title: "Responsabilité",
    paragraphs: [
      "Nous nous efforçons de maintenir ce site accessible et ses informations exactes et à jour, sans pouvoir garantir l'absence d'erreur ni la disponibilité permanente du service.",
      "Les informations publiées ici ont une valeur d'information générale et ne constituent pas un engagement contractuel. Seuls les documents signés avec un client engagent Heliara.",
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
  {
    title: "Droit applicable",
    paragraphs: [
      "Les présentes mentions sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux du ressort du siège social de l'éditeur sont seuls compétents.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Pour toute question relative à ce site ou aux présentes mentions : " +
        site.email +
        ", ou par courrier à l'adresse du siège social indiquée ci-dessus.",
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
      /*
        Pas de délégué désigné, et le dire est plus juste qu'un « à compléter ».
        L'article 37 du RGPD n'en impose un ni à raison de la taille de l'éditeur, ni des
        traitements de ce site - un formulaire de contact et une inscription à des
        publications. Le jour où un délégué est désigné, ses coordonnées viennent ici.
      */
      "Aucun délégué à la protection des données n'est désigné : les traitements de ce site n'entrent dans aucun des cas où l'article 37 du règlement général sur la protection des données l'impose. Les demandes sont traitées par l'éditeur, à l'adresse ci-dessus.",
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
        /*
          Décrit ce que fait réellement `ViewCounter` : aucun cookie, un compteur par
          article et une clé dans le stockage de session pour ne pas compter deux fois la
          même lecture. C'est aussi pour cela que le chiffre affiché est présenté comme une
          indication de lecture et non comme une mesure d'audience - laquelle fait l'objet
          de l'entrée suivante, et repose sur un mécanisme entièrement distinct.
        */
        label: "Lecture des publications",
        value:
          "Un compteur de lectures est tenu par article, sans identifiant de visiteur ni cookie : une clé technique est simplement déposée dans le stockage de session de votre navigateur pour ne pas compter deux fois la même lecture, et elle disparaît à la fermeture de l'onglet.",
      },
      {
        /*
          **À maintenir d'accord avec `components/analytics/umami.tsx`.** Cette entrée
          décrit un traitement réel : la modifier sans toucher au code, ou l'inverse, rend
          la page fausse. Elle a remplacé une phrase qui affirmait qu'aucun outil de mesure
          d'audience n'était utilisé, devenue fausse le jour où Umami a été posé.

          Umami n'écrit aucun cookie et ne conserve pas l'adresse IP : il en dérive une
          empreinte de session qui change chaque jour, ce qui interdit de suivre une même
          personne d'un jour sur l'autre. C'est ce qui permet de s'en tenir à l'intérêt
          légitime, sans demande de consentement.
        */
        label: "Mesure d'audience",
        value:
          "La fréquentation du site est mesurée avec Umami, un outil libre que nous hébergeons nous-mêmes : aucune donnée ne part vers une régie publicitaire ni vers un service tiers. Il ne dépose aucun cookie, ne conserve pas votre adresse IP et ne permet pas de vous suivre d'un jour sur l'autre. Seules des données agrégées sont produites : pages consultées, provenance, type d'appareil, pays. Finalité : comprendre quelles pages sont utiles. Base légale : notre intérêt légitime.",
      },
      {
        /*
          **À maintenir d'accord avec `components/contact/booking-link.tsx`.** Cette entrée
          décrit un traitement réel, et surtout le moment où il commence.

          Le lien de prise de rendez-vous est une ancre ordinaire tant qu'on ne clique pas :
          **rien n'est chargé depuis Cal.com au rendu de la page**, ce qui est précisément ce
          qui permet de fonder le traitement sur le clic plutôt que d'ouvrir la question
          d'un bandeau de consentement. Poser l'embed au rendu rendrait ce paragraphe faux
          et le reste de la section avec.
        */
        label: "Prise de rendez-vous",
        value:
          "La page de contact propose de réserver un créneau par Cal.com. Rien n'est chargé depuis ce service tant que vous ne cliquez pas : c'est l'ouverture de la fenêtre de réservation, et elle seule, qui établit une connexion vers cal.com - lequel reçoit alors votre adresse IP et peut déposer ses propres traceurs. Les informations que vous y saisissez, nom, adresse électronique et créneau choisi, sont traitées par Cal.com en qualité de sous-traitant. Finalité : convenir d'un rendez-vous. Base légale : votre consentement, matérialisé par ce clic. Vous pouvez vous en dispenser : le formulaire, l'adresse électronique et le téléphone mènent au même endroit.",
      },
      {
        /*
          **À maintenir d'accord avec `components/layout/whatsapp-bubble.tsx`.** La bulle
          est une ancre `https://wa.me/...` : aucun widget, aucune iframe, donc aucune
          connexion vers Meta tant que le visiteur ne clique pas. Poser le widget officiel
          rendrait ce paragraphe faux - le même défaut que celui rencontré avec Umami, puis
          évité avec Cal.com.

          Ce qui suit le clic ne nous appartient plus : la conversation a lieu dans
          WhatsApp, sous la politique de Meta, et c'est ce que dit la dernière phrase
          plutôt que de laisser croire que nous en maîtrisons le traitement.
        */
        label: "Messagerie WhatsApp",
        value:
          "Un bouton flottant permet de nous écrire ou de nous appeler sur WhatsApp. Ce n'est qu'un lien : rien n'est chargé depuis WhatsApp ni depuis Meta tant que vous ne cliquez pas, et aucun traceur n'est déposé par cette page. Si vous cliquez, la conversation se déroule dans WhatsApp, dont l'éditeur Meta est alors responsable du traitement de votre numéro et de vos messages, selon sa propre politique de confidentialité. Nous conservons ces échanges comme une demande de contact. Finalité : répondre à votre demande. Base légale : votre consentement, matérialisé par ce clic. Vous pouvez vous en dispenser : le formulaire, l'adresse électronique et le téléphone mènent au même endroit.",
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
      "Elles sont traitées par nos sous-traitants techniques dans le seul cadre de leur mission, sous contrat conforme au règlement général sur la protection des données : hébergement, acheminement des messages électroniques, prise de rendez-vous. La liste détaillée est disponible sur demande.",
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
      // La conséquence concrète du choix d'Umami, et la raison pour laquelle ce site n'a
      // pas de bandeau de consentement : il n'y a rien à consentir.
      "Notre mesure d'audience n'utilise pas de cookie non plus. C'est pourquoi ce site ne vous demande rien à votre arrivée : aucun traceur soumis à consentement n'y est déposé.",
      /*
        La nuance qui garde le paragraphe précédent vrai. « À votre arrivée » y fait tout
        le travail : le seul tiers du site n'est joint qu'après un clic délibéré, donc
        aucune arrivée sur une page ne dépose quoi que ce soit.
      */
      "Une seule exception, et elle dépend de vous : si vous ouvrez la fenêtre de prise de rendez-vous, Cal.com peut y déposer ses propres traceurs. Ne pas cliquer suffit à s'en tenir à l'écart.",
    ],
  },
]
