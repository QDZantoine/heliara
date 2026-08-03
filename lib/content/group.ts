/**
 * Page « Le groupe ».
 *
 * Parti pris : on met en avant les trois marques sœurs et leur complémentarité,
 * pas le holding. Aucune section n'est consacrée au rattachement, et **le nom du
 * holding n'apparaît nulle part sur le site public** : il ne vit que dans les
 * mentions légales. L'appartenance à un même groupe se comprend par le récit.
 *
 * Les données marquées « à compléter » attendent des valeurs réelles. Les
 * chiffres présentés doivent rester exacts et vérifiables : c'est la règle du
 * ton de voix, et elle vaut aussi pour les certifications.
 */

export type Brand = {
  slug: "lessonsharing" | "heliara" | "hexceos"
  name: string
  /** Le rôle en un mot, tel qu'affiché en italique sous le nom. */
  role: string
  text: string
  bullets: string[]
  href: string
  /** Domaine affiché comme libellé du lien sortant. */
  domain: string
  /** Filet de couleur en tête de carte : une teinte par marque. */
  accent: "blue" | "orange" | "ink"
  /**
   * Marque figurative, dans public/logos. Les trois sont carrées et portent leur
   * propre fond : le conteneur n'a qu'à les arrondir pour les unifier.
   */
  logo: { src: string; width: number; height: number; vector?: boolean }
  /** La marque courante est mise en avant. */
  current: boolean
}

export const brands: Brand[] = [
  {
    slug: "lessonsharing",
    name: "LessonSharing",
    role: "Former.",
    text: "Organisme de formation IT. Connecte les meilleurs experts du numérique avec les établissements et les entreprises qui forment les talents de demain.",
    bullets: [
      "Développement · Cloud · Cybersécurité",
      "Formateurs qualifiés et sélectionnés",
      "Ingénierie pédagogique",
      "Organisme de formation déclaré (n° 11911034291)",
    ],
    href: "https://lessonsharing.fr",
    domain: "lessonsharing.fr",
    accent: "blue",
    logo: { src: "/logos/logo-lessonsharing.png", width: 1632, height: 1632 },
    current: false,
  },
  {
    slug: "heliara",
    name: "Heliara",
    role: "Concevoir & développer.",
    text: "Studio de conception et de développement web. Transforme un métier en produit numérique clair, rapide et performant.",
    bullets: [
      "Sites vitrines & institutionnels · E-commerce",
      "Web-apps · SaaS · ERP · CRM",
      "UX / UI",
      "IA & API",
    ],
    href: "https://heliara.fr",
    domain: "heliara.fr",
    accent: "orange",
    logo: {
      src: "/logos/logo-orange-heliara.svg",
      width: 339,
      height: 339,
      vector: true,
    },
    current: true,
  },
  {
    slug: "hexceos",
    name: "Hexceos",
    role: "Opérer & protéger.",
    text: "Cybersécurité, infogérance et cloud, opérés par une équipe humaine 24/7. Sécurise, exploite et héberge votre système d'information.",
    bullets: [
      "SOC 24/7 en 3×8, internalisé",
      "EDR/XDR propriétaire « Sentinel »",
      "Datacenter propre en France (Île-de-France et Occitanie)",
      "ISO 27001 · ISO 27005 · RGPD · HDS · aligné ANSSI",
    ],
    href: "https://hexceos.fr",
    domain: "hexceos.fr",
    accent: "ink",
    logo: { src: "/logos/logo-hexceos.png", width: 96, height: 96 },
    current: false,
  },
]

/** Micro-preuves du hero : trois puces, factuelles. */
export const groupProofs = [
  "Équipes internalisées, sans offshore",
  "Hébergement souverain en France",
  "De l'Île-de-France jusqu'à Montréal",
]

export const groupManifesto =
  "Trois sociétés sœurs, indépendantes dans leur métier et complémentaires dans leur mission. Chacune est experte de son domaine ; ensemble, elles couvrent l'intégralité du cycle de vie d'un projet numérique, de la montée en compétences à l'hébergement souverain, en passant par la conception et le développement."

/**
 * La chaîne de valeur : c'est le récit qui montre l'utilité de chaque marque.
 *
 * Chaque temps porte son illustration animée. Les trois fichiers pèsent lourd
 * (778 ko au total), d'où le chargement à l'approche du champ plutôt qu'à
 * l'inoccupation : un visiteur qui ne descend pas jusqu'ici ne télécharge rien.
 * Les vitesses sont ralenties pour rester dans le registre posé de la DA.
 */
export const valueChain = [
  {
    num: "01",
    step: "Former",
    brand: "LessonSharing",
    text: "On développe les compétences et on mobilise les talents.",
    accent: "blue" as const,
    scene: {
      src: "/animated-illustrations/chain-former.json",
      speed: 0.7,
      scale: "scale-95",
    },
  },
  {
    num: "02",
    step: "Concevoir & construire",
    brand: "Heliara",
    text: "On traduit le besoin en produit : conception, design et développement.",
    accent: "orange" as const,
    scene: {
      src: "/animated-illustrations/chain-concevoir.json",
      speed: 0.75,
      scale: "scale-110",
    },
  },
  {
    num: "03",
    step: "Opérer & protéger",
    brand: "Hexceos",
    text: "On exploite, on sécurise et on héberge dans la durée, 24/7.",
    accent: "ink" as const,
    scene: {
      src: "/animated-illustrations/chain-operer.json",
      speed: 0.75,
      scale: "scale-110",
    },
  },
]

export const valueChainClosing =
  "Trois briques d'un même écosystème, former et construire, opérer et protéger, pour un numérique maîtrisé de bout en bout."

/** Bénéfices client : le « et alors ? » de la complémentarité. */
export const groupBenefits = [
  {
    icon: "user-round" as const,
    title: "Un interlocuteur, toute la chaîne",
    text: "Du cadrage à la maintenance, le même groupe répond. Plus de zones grises entre prestataires.",
  },
  {
    icon: "shield-check" as const,
    title: "Souveraineté par défaut",
    text: "Hébergement dans notre propre datacenter en France, conformité RGPD et HDS, alignement ANSSI. Vos données restent dans notre périmètre.",
  },
  {
    icon: "repeat" as const,
    title: "Continuité build vers run",
    text: "Nous ne livrons pas un produit avant de disparaître : Heliara construit, Hexceos opère et sécurise, dans la durée.",
  },
  {
    icon: "graduation-cap" as const,
    title: "Des équipes qui montent en compétence",
    text: "L'ingénierie pédagogique de LessonSharing irrigue les projets. Et zéro offshore : équipes internalisées, en France et au Québec.",
  },
]

export const groupFigures = [
  { value: "24/7", label: "SOC opérationnel en 3×8" },
  {
    value: "11 min",
    label: "de MTTR moyen en 2025, sur 187 incidents qualifiés",
  },
  {
    value: "6",
    label:
      "zones d'implantation : Île-de-France, Montpellier, Béziers, Nîmes, Avignon, Montréal",
  },
  {
    value: "100 % France",
    label: "datacenter propre, sans sous-traitance d'hébergement",
  },
]

export const complianceBadges = [
  "ISO 27001",
  "ISO 27005",
  "RGPD",
  "HDS",
  "Aligné ANSSI",
  "Loi 25 (Québec)",
]

/**
 * Formulation d'hébergement et de conformité. Hexceos y figure comme la marque
 * sœur qui opère l'infrastructure, jamais comme une maison mère.
 */
export const hostingStatement =
  "L'hébergement est assuré par Hexceos, marque sœur de Heliara, en France, dans son propre datacenter, sur une infrastructure certifiée HDS (Hébergeur de Données de Santé), certifiée ISO 27001 et conforme au RGPD."

/** Teintes de filet par marque. L'orange reste l'accent dominant de la page. */
export const brandAccent = {
  blue: { rule: "bg-[#1E40AF]", text: "text-[#1E40AF]" },
  orange: { rule: "bg-brand", text: "text-brand-text" },
  ink: { rule: "bg-ink", text: "text-ink" },
}
