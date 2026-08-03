export type MethodStep = {
  num: string
  title: string
  summary: string
}

/**
 * Aperçu en quatre temps pour l’accueil (S5) : on installe le sentiment de
 * maîtrise, le détail vit sur /methode.
 */
export const methodPreview: MethodStep[] = [
  {
    num: "01",
    title: "Cadrer",
    summary:
      "Comprendre le métier avant d’écrire une ligne. Périmètre, risques et jalons posés noir sur blanc.",
  },
  {
    num: "02",
    title: "Concevoir",
    summary:
      "Parcours, maquettes, prototype testé avec vos équipes. Vous validez ce que vous verrez en production.",
  },
  {
    num: "03",
    title: "Construire",
    summary:
      "Développement par itérations courtes. Chaque quinzaine, une version démontrable de plus.",
  },
  {
    num: "04",
    title: "Faire durer",
    summary:
      "Mise en production, supervision, maintenance évolutive. Le code vous appartient, la réversibilité est garantie.",
  },
]

/** Une barre du petit visuel accompagnant chaque temps. */
export type MethodGauge = {
  /** Largeur en % de la barre. */
  width: number
  label: string
  tone: "brand" | "info" | "neutral"
}

export type MethodPhase = {
  num: string
  title: string
  text: string
  /** Le livrable, formulé du point de vue du client. */
  deliverable: string
  gaugeTitle: string
  gauges: MethodGauge[]
}

/**
 * Les huit temps de /methode. Chaque temps nomme son livrable : c’est ce qui
 * transforme une promesse de process en engagement vérifiable.
 *
 * Écart connu et assumé : la fiche de l’Architecture UX annonce cinq temps, la
 * maquette Méthode en montre huit. La maquette gagne, et l’accueil en garde une
 * version condensée en quatre.
 */
export const methodPhases: MethodPhase[] = [
  {
    num: "01",
    title: "Découverte",
    text: "Immersion dans votre métier : entretiens, observation des équipes, cartographie de l’existant. Nous cherchons le problème réel, pas le problème déclaré.",
    deliverable: "une synthèse de découverte et la cartographie de vos flux.",
    gaugeTitle: "Entretiens menés",
    gauges: [
      { width: 62, label: "direction", tone: "neutral" },
      { width: 84, label: "équipes terrain", tone: "brand" },
      { width: 46, label: "IT / DSI", tone: "neutral" },
    ],
  },
  {
    num: "02",
    title: "Cadrage",
    text: "Périmètre minimal viable, risques nommés, jalons datés, budget ferme sur la première phase. Tout est écrit avant de commencer.",
    deliverable:
      "la note de cadrage - l’unique document contractuel de référence.",
    gaugeTitle: "Périmètre",
    gauges: [
      { width: 90, label: "flux critique", tone: "brand" },
      { width: 54, label: "phase 2", tone: "neutral" },
      { width: 32, label: "plus tard", tone: "neutral" },
    ],
  },
  {
    num: "03",
    title: "Conception des parcours",
    text: "Parcours, arborescences, prototype cliquable testé avec vos vrais utilisateurs - dans leurs conditions réelles de travail.",
    deliverable: "un prototype navigable et les comptes rendus de tests.",
    gaugeTitle: "Hypothèses testées",
    gauges: [
      { width: 76, label: "validées · 9", tone: "info" },
      { width: 28, label: "invalidées · 2", tone: "brand" },
    ],
  },
  {
    num: "04",
    title: "Interface",
    text: "Design system produit et maquettes haute fidélité de tous les écrans. Accessibilité AA vérifiée maquette par maquette.",
    deliverable: "les maquettes finales et le design system documenté.",
    gaugeTitle: "Écrans conçus",
    gauges: [
      { width: 88, label: "34 écrans", tone: "info" },
      { width: 64, label: "61 composants", tone: "neutral" },
    ],
  },
  {
    num: "05",
    title: "Développement",
    text: "Itérations de deux semaines, chacune conclue par une démonstration. Vous suivez l’avancement sur un tableau partagé, pas dans des comptes rendus.",
    deliverable: "une version démontrable toutes les deux semaines.",
    gaugeTitle: "Vélocité",
    gauges: [
      { width: 40, label: "sprint 1", tone: "brand" },
      { width: 58, label: "sprint 2", tone: "brand" },
      { width: 74, label: "sprint 3", tone: "brand" },
    ],
  },
  {
    num: "06",
    title: "Recette",
    text: "Tests automatisés, revue d’accessibilité RGAA, tests de charge, audit de sécurité. La qualité se mesure, elle ne se déclare pas.",
    deliverable:
      "le rapport de recette : couverture, performances, conformité.",
    gaugeTitle: "Couverture",
    gauges: [
      { width: 92, label: "tests · 92 %", tone: "info" },
      { width: 86, label: "RGAA · AA", tone: "info" },
      { width: 96, label: "charge · OK", tone: "info" },
    ],
  },
  {
    num: "07",
    title: "Déploiement",
    text: "Mise en production progressive, réversible à chaque étape. Formation des équipes et période d’accompagnement rapproché.",
    deliverable: "un plan de bascule, et un produit en ligne.",
    gaugeTitle: "Bascule",
    gauges: [
      { width: 30, label: "pilote · 10 %", tone: "brand" },
      { width: 62, label: "vague 2 · 50 %", tone: "brand" },
      { width: 96, label: "complet", tone: "brand" },
    ],
  },
  {
    num: "08",
    title: "Maintenance",
    text: "Supervision, corrections, évolutions continues. Le produit vit, la dette reste maîtrisée, et vous gardez le même interlocuteur.",
    deliverable:
      "un rapport mensuel : disponibilité, évolutions livrées, backlog.",
    gaugeTitle: "Disponibilité",
    gauges: [
      { width: 97, label: "99,9 %", tone: "info" },
      { width: 70, label: "évolutions · 14/an", tone: "neutral" },
    ],
  },
]

/** Ce qui est écrit au contrat : c’est ce qui lève l’objection du risque. */
export const commitments = [
  {
    title: "Le code vous appartient",
    text: "Dépôt à votre nom dès le premier jour. Aucune brique propriétaire cachée, réversibilité contractuelle.",
  },
  {
    title: "Des jalons tenus",
    text: "Chaque jalon est daté au cadrage. Un glissement se signale au sprint où il apparaît - jamais à la fin.",
  },
  {
    title: "Un interlocuteur unique",
    text: "Le chef de projet qui cadre est celui qui livre. Pas de passage de relais commercial vers production.",
  },
  {
    title: "Aucune surprise budgétaire",
    text: "Budget ferme par phase. Tout arbitrage de périmètre se décide avec vous, chiffres en main.",
  },
]
