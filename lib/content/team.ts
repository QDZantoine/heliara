/**
 * L'équipe réelle.
 *
 * **Elle a remplacé six personnes inventées** - Léa Roussel, Marc Bianchi et quatre
 * autres, avec parcours détaillés. Le contenu de démonstration portait des noms
 * plausibles et des antécédents précis : c'était le point le plus exposé du site, un
 * homonyme réel suffisant à créer un préjudice.
 *
 * Ce qui suit vient de l'auteur du site et décrit des personnes existantes. **Toute
 * modification se fait avec l'intéressé**, en particulier les diplômes, les employeurs
 * passés et les rôles : ce sont des affirmations opposables, pas de la copie.
 */

export type Person = {
  name: string
  role: string
  initials: string
  /** Le parcours, en trois ou quatre phrases. Ce qui rend le rôle crédible. */
  bio: string
  /** Les spécialités, en puces. Quatre au plus : au-delà, on ne les lit plus. */
  skills: string[]
  /**
   * Teinte de la pastille d'initiales.
   *
   * Trois valeurs, et un seul orange : la DA n'autorise qu'un geste orange par écran,
   * donc la première carte le porte et les deux autres prennent le bleu
   * d'information et l'encre.
   */
  accent: "brand" | "info" | "ink"
  /**
   * Le portrait, en deux variantes de fond.
   *
   * Les deux existent parce qu'aucune ne tient sur les deux thèmes : un détourage sur
   * blanc posé sur une carte encre devient un pavé lumineux, et le fond orange sur une
   * carte claire écrase tout le reste de la page. La carte affiche donc `white` en
   * clair et `orange` en sombre.
   *
   * 800 × 800, tête et épaules, sujet légèrement décentré vers la droite - d'où le
   * cadrage par le haut plutôt que centré, sinon le crop coupe le front.
   */
  photo: { white: string; orange: string }
}

/**
 * Les associés : ce sont eux qui répondent aux messages de contact.
 *
 * La page de contact promet une réponse d'un associé sous 48 heures et affiche cette
 * liste sous « Vos interlocuteurs ». Y ajouter quelqu'un qui ne répond pas aux messages
 * rendrait la promesse fausse.
 */
export const partners: Person[] = [
  {
    initials: "AQ",
    name: "Antoine Quendez",
    role: "Associé - conception & développement",
    bio: "Développeur full-stack, consultant-formateur et expert IA, spécialisé en Node.js, TypeScript, React et Next.js. Il conçoit des plateformes web, SaaS et des solutions d’IA souveraine alliant performance, sécurité et évolutivité. Ancien cadre de la Marine nationale, il associe rigueur opérationnelle et expertise technique au service des projets les plus exigeants.",
    skills: [
      "Next.js / TypeScript",
      "Node.js",
      "Sécurité applicative",
      "IA souveraine (RAG)",
    ],
    accent: "brand",
    photo: {
      white: "/team/antoine-white.png",
      orange: "/team/antoine-orange.png",
    },
  },
  {
    initials: "GM",
    name: "Gaëtan Maiuri",
    role: "Fondateur du groupe - stratégie, sécurité & infrastructure",
    bio: "Fondateur et président d'Hexceos et de LessonSharing, expert en cybersécurité offensive et défensive et en infrastructures. Il conçoit et opère le datacenter privé du groupe et porte, sur chaque projet Heliara, l'exigence de souveraineté et de sécurité.",
    skills: [
      "Cybersécurité (Red/Blue)",
      "Infrastructure & datacenter",
      "Golang",
      "Souveraineté",
    ],
    accent: "info",
    photo: {
      white: "/team/gaetan-white.png",
      orange: "/team/gaetan-orange.png",
    },
  },
]

export const team: Person[] = [
  ...partners,
  {
    initials: "AR",
    name: "Alexandre Robine Decourcelle",
    role: "Expert cybersécurité - DG Hexceos",
    bio: "Consultant et formateur en cybersécurité, directeur général d'Hexceos. Ancien référent cybersécurité et ingénieur DevOps chez Thales. Lead pentester (architectures, services applicatifs, embarqué), il sécurise les produits Heliara dès la conception - du durcissement applicatif au cloud (AWS, Azure, Terraform).",
    skills: [
      "Pentest & audit",
      "DevOps / Cloud",
      "OSINT",
      "Sécurité bas niveau (kernel, eBPF)",
    ],
    accent: "ink",
    photo: {
      white: "/team/alexandre-white.png",
      orange: "/team/alexandre-orange.png",
    },
  },
]

/**
 * Les classes de la pastille d'initiales, par accent.
 *
 * **Ici plutôt que dans chaque page**, sur le modèle de `brandAccent` dans `group.ts` :
 * `/a-propos` et `/contact` affichent tous deux ces pastilles, et chacun portait son
 * propre ternaire. À deux valeurs cela tenait ; à trois, la page de contact aurait rendu
 * l'encre en bleu sans que rien ne le signale, parce qu'un `else` attrape tout ce qu'il
 * ne connaît pas.
 *
 * **Chaque valeur est une paire fond + texte qui s'inversent ensemble**, sinon le
 * contraste ne tient pas dans les deux thèmes. Deux pièges rencontrés, tous deux
 * relevés par la mesure et invisibles à la lecture du code :
 *
 * - `bg-info text-white` tombait à **2,67:1 en sombre** : `--hel-info` y devient un bleu
 *   clair, et du blanc dessus ne se lit plus. D'où la paire `info-solid` /
 *   `info-on-solid`, calquée sur `brand-solid`.
 * - `bg-ink` s'inverse entre les thèmes, donc un texte clair dessus disparaîtrait en
 *   sombre. `bg-inverse`, lui, reste sombre dans les deux.
 */
export const pastilleAccent: Record<Person["accent"], string> = {
  brand: "bg-brand-solid text-brand-on-solid",
  info: "bg-info-solid text-info-on-solid",
  // Le filet n'est là que pour le thème sombre : `bg-inverse` (#0b0b0d) y est plus
  // sombre que la carte (#101012), donc le disque disparaissait comme forme - son texte
  // restait lisible à 17,5:1, mais on ne voyait plus la pastille. En thème clair le
  // filet est invisible sur un disque encre, il ne coûte donc rien.
  ink: "bg-inverse text-inverse-fg ring-1 ring-line-strong",
}

/**
 * L'en-tête de la section, et la ligne qui la referme.
 *
 * Ici plutôt que dans le JSX, comme tout contenu éditorial. Le titre est un `h2` et non
 * un `h1` : la page en a déjà un, dans son hero, et deux titres de niveau 1 cassent la
 * structure que lisent les lecteurs d'écran.
 */
export const teamSection = {
  eyebrow: "L'équipe",
  title: "Une équipe resserrée. Des expertises pointues.",
  lead: "Chez Heliara, vos interlocuteurs sont ceux qui conçoivent, codent et sécurisent - pas de commercial intermédiaire, pas de sous-traitance cachée. Deux associés, un expert cybersécurité, et l'appui d'un groupe qui forme, héberge et sécurise.",
  /** La profondeur de banc, dite sans la surjouer. */
  reach:
    "Pour les projets d'ampleur, Heliara mobilise les experts du groupe et les formateurs-praticiens de LessonSharing. Développement, cloud, cybersécurité.",
}

/** Le manifeste : court, déclaratif, sans exclamation. */
export const manifesto = {
  lead: "Nous concevons des produits numériques pour des organisations dont le métier est trop particulier pour rentrer dans un logiciel du marché.",
  body: [
    // « Six personnes » a été corrigé en même temps que l'équipe : le manifeste
    // annonçait un effectif que la section suivante démentait, et une page qui se
    // contredit à trois paragraphes d'intervalle perd sa crédibilité entière.
    "Un studio à taille humaine, délibérément. Une équipe resserrée, un seul projet majeur à la fois, et l'associé qui cadre est celui qui livre. Cette contrainte nous coûte des affaires ; elle nous évite les projets que personne ne porte vraiment.",
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
    title: "La technologie suit le besoin",
    text: "TypeScript, Next.js et MariaDB sont nos choix par défaut : documentés, et recrutables dans dix ans. Ce ne sont pas des passages obligés. Quand votre contexte demande autre chose , une contrainte d'un système existant, un besoin que ces outils servent mal, une plateforme du marché qui fait déjà le travail. Nous en changeons, et nous vous disons pourquoi avant de commencer.",
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
    text: "En visio ou au studio. On clarifie le besoin, on pose les bonnes questions - y compris celles qui fâchent.",
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
  "50 - 150 k€",
  "150 - 400 k€",
  "Plus de 400 k€",
] as const
