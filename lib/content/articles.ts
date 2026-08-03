/**
 * Ressources. Objectif : démontrer la pensée, pas produire du contenu marketing.
 * Auteurs nommés avec leur rôle, dates réelles, profondeur assumée.
 *
 * Les corps d'articles sont volontairement partiels : à compléter avec vos
 * équipes. Ils sont écrits en blocs typés plutôt qu'en HTML, pour rester
 * migrables vers un CMS sans réécrire les pages.
 */

export type ArticleCategory =
  "Guide" | "Analyse" | "Retour d'expérience" | "Veille"

export type ArticleBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "callout"; lead: string; text: string }
  | { kind: "numbered"; items: { num: string; title: string; text: string }[] }

export type Article = {
  slug: string
  category: ArticleCategory
  title: string
  /** Chapô : la promesse de l'article, en une phrase ou deux. */
  lead: string
  author: string
  authorRole: string
  authorInitials: string
  /** Date lisible, telle qu'affichée. */
  date: string
  /** Date ISO, pour les métadonnées et le tri. */
  publishedAt: string
  readingTime: string
  featured: boolean
  body: ArticleBlock[]
  /** Cas ou expertise liés : aucune impasse en fin d'article. */
  relatedCase?: string
}

export const articles: Article[] = [
  {
    slug: "acheter-ou-construire",
    category: "Guide",
    title:
      "Faut-il un logiciel du marché ou une plateforme sur mesure ? La grille de décision honnête.",
    lead: "Sur mesure n'est pas toujours la bonne réponse, et nous vivons pourtant du sur-mesure. Voici les sept questions qui tranchent, avec les cas où nous recommandons d'acheter.",
    author: "Léa Roussel",
    authorRole: "Associée, direction produit",
    authorInitials: "LR",
    date: "12 juillet 2026",
    publishedAt: "2026-07-12",
    readingTime: "18 min",
    featured: true,
    relatedCase: "pilotage-production",
    body: [
      {
        kind: "paragraph",
        text: "Chaque mois, un dirigeant nous décrit son besoin et attend que nous lui vendions du développement. Une fois sur trois, nous lui répondons d'acheter un logiciel existant. Cet article explique pourquoi, et surtout comment prendre cette décision sans dépendre de l'avis d'un vendeur, quel qu'il soit.",
      },
      {
        kind: "heading",
        text: "La question n'est pas le coût. C'est la différence.",
      },
      {
        kind: "paragraph",
        text: "Un logiciel du marché encode les pratiques moyennes d'un secteur. Si votre processus est standard (paie, comptabilité, notes de frais), cette moyenne est exactement ce qu'il vous faut, au meilleur prix. Le sur-mesure ne se justifie que là où votre façon de faire constitue un avantage : ce que vos clients achètent chez vous et pas ailleurs.",
      },
      {
        kind: "callout",
        lead: "La règle que nous appliquons :",
        text: "achetez pour vos processus standards, construisez pour votre différence. Une entreprise qui fait l'inverse paie deux fois, un sur-mesure banal et un outil générique qui bride ce qu'elle a d'unique.",
      },
      { kind: "heading", text: "Les sept questions" },
      {
        kind: "numbered",
        items: [
          {
            num: "01",
            title:
              "Ce processus est-il ce que vos clients achètent chez vous ?",
            text: "Si oui, il mérite un outil qui l'épouse exactement.",
          },
          {
            num: "02",
            title:
              "Existe-t-il trois logiciels du marché qui le couvrent à 80 % ?",
            text: "Si oui, le sur-mesure devra justifier chaque point des 20 % restants.",
          },
          {
            num: "03",
            title: "Les 20 % manquants sont-ils contournables sans re-saisie ?",
            text: "La re-saisie quotidienne est le vrai coût caché de l'outil générique.",
          },
          {
            num: "04",
            title: "Votre processus va-t-il changer dans les 24 mois ?",
            text: "Un outil du marché suit son éditeur ; le vôtre vous suit, vous.",
          },
          {
            num: "05",
            title: "Combien d'outils ce système devra-t-il connecter ?",
            text: "Au-delà de trois intégrations profondes, le sur-mesure devient souvent plus simple.",
          },
          {
            num: "06",
            title: "Qui portera l'outil en interne dans cinq ans ?",
            text: "Sans propriétaire interne, ni l'achat ni le sur-mesure ne survivent.",
          },
          {
            num: "07",
            title:
              "Le budget couvre-t-il la vie du produit, pas seulement sa naissance ?",
            text: "Comptez la maintenance : un sur-mesure sans budget d'évolution meurt en trois ans.",
          },
        ],
      },
      {
        kind: "paragraph",
        text: "Quatre réponses ou plus du côté « différence » : le sur-mesure se défend. Trois ou moins : achetez, configurez, et gardez votre budget pour ce qui vous distingue.",
      },
      {
        kind: "paragraph",
        text: "La suite de ce guide, grille téléchargeable et méthode d'évaluation des éditeurs, reste à rédiger avec vos équipes.",
      },
    ],
  },
  {
    slug: "ia-outils-metiers",
    category: "Analyse",
    title:
      "L'IA dans les outils métiers : ce qui marche déjà, ce qui reste du théâtre",
    lead: "Trois usages tiennent en production aujourd'hui, deux relèvent encore de la démonstration. Comment distinguer les deux avant d'engager un budget.",
    author: "Marc Bianchi",
    authorRole: "Associé, architecture et sécurité",
    authorInitials: "MB",
    date: "3 juillet 2026",
    publishedAt: "2026-07-03",
    readingTime: "11 min",
    featured: false,
    relatedCase: "copilote-ia-sante",
    body: [
      {
        kind: "paragraph",
        text: "L'écart entre ce qu'un modèle de langage sait faire en démonstration et ce qu'il tient en production quotidienne reste large. Cet écart n'est pas technique, il est organisationnel : il tient à qui vérifie, à quelle fréquence, et à ce qui se passe quand le modèle se trompe.",
      },
      { kind: "heading", text: "Ce qui tient en production" },
      {
        kind: "paragraph",
        text: "Le pré-remplissage documentaire, la recherche en langage naturel sur un corpus interne, et la classification de flux entrants. Les trois ont un point commun : un humain valide, et l'erreur du modèle coûte une correction, pas un incident.",
      },
      {
        kind: "callout",
        lead: "Le test que nous appliquons :",
        text: "si personne ne relit la sortie du modèle, l'usage n'est pas prêt. Un modèle sans relecteur désigné est un modèle dont on découvrira les erreurs par un client.",
      },
      {
        kind: "paragraph",
        text: "La suite de cette analyse reste à rédiger.",
      },
    ],
  },
  {
    slug: "tester-avec-des-gants",
    category: "Retour d'expérience",
    title:
      "Tester une interface avec des gants de manutention : ce que l'atelier nous a appris",
    lead: "Deux hypothèses invalidées en une après-midi, et une saisie vocale ajoutée au périmètre. Le compte rendu d'une séance de test en conditions réelles.",
    author: "Awa Traoré",
    authorRole: "Designer produit",
    authorInitials: "AT",
    date: "19 juin 2026",
    publishedAt: "2026-06-19",
    readingTime: "8 min",
    featured: false,
    relatedCase: "pilotage-production",
    body: [
      {
        kind: "paragraph",
        text: "Nous avions conçu des cibles tactiles à 44 px, conformes aux recommandations. Un opérateur portant des gants de manutention en a manqué une sur trois. La recommandation n'était pas fausse, elle ne prévoyait simplement pas ce contexte.",
      },
      { kind: "heading", text: "Ce que change le contexte physique" },
      {
        kind: "paragraph",
        text: "Gants, luminosité directe, bruit, mains occupées, écran à hauteur inhabituelle. Chacune de ces contraintes déplace une décision d'interface, et aucune n'apparaît en salle de réunion.",
      },
      {
        kind: "paragraph",
        text: "La suite de ce retour d'expérience reste à rédiger.",
      },
    ],
  },
  {
    slug: "rgaa-back-office",
    category: "Guide",
    title:
      "RGAA en pratique : rendre un back-office accessible sans le ralentir",
    lead: "L'accessibilité d'un outil interne se joue sur cinq décisions, prises au cadrage. Prises après, elles coûtent dix fois plus.",
    author: "Nora Belkacem",
    authorRole: "Ingénieure logiciel",
    authorInitials: "NB",
    date: "5 juin 2026",
    publishedAt: "2026-06-05",
    readingTime: "14 min",
    featured: false,
    relatedCase: "portail-patients",
    body: [
      {
        kind: "paragraph",
        text: "Un back-office accessible n'est pas un back-office plus lent à utiliser. C'est presque toujours l'inverse : la navigation clavier, les libellés explicites et les états d'erreur clairs profitent d'abord aux utilisateurs experts, ceux qui passent leur journée dans l'outil.",
      },
      { kind: "heading", text: "Les cinq décisions de cadrage" },
      {
        kind: "paragraph",
        text: "La suite de ce guide reste à rédiger.",
      },
    ],
  },
  {
    slug: "dette-technique",
    category: "Analyse",
    title:
      "La dette technique n'est pas une fatalité : la mesurer, la négocier, la rembourser",
    lead: "Une dette qu'on ne chiffre pas est une dette qu'on ne rembourse jamais. Trois indicateurs suffisent à la rendre discutable en comité.",
    author: "Julien Pérez",
    authorRole: "Ingénieur logiciel",
    authorInitials: "JP",
    date: "22 mai 2026",
    publishedAt: "2026-05-22",
    readingTime: "10 min",
    featured: false,
    relatedCase: "saas-interventions",
    body: [
      {
        kind: "paragraph",
        text: "« Il faudrait refactorer » n'est pas un argument budgétaire. « Cette zone du code concentre 40 % de nos incidents et double le délai de chaque évolution » en est un.",
      },
      { kind: "heading", text: "Trois indicateurs qui se défendent" },
      {
        kind: "paragraph",
        text: "La suite de cette analyse reste à rédiger.",
      },
    ],
  },
  {
    slug: "souverainete-numerique",
    category: "Veille",
    title:
      "Souveraineté numérique : ce que les nouvelles obligations changent pour vos plateformes",
    lead: "Hébergement, sous-traitance, transferts hors UE : le point sur ce qui s'applique déjà et ce qui arrive.",
    author: "Marc Bianchi",
    authorRole: "Associé, architecture et sécurité",
    authorInitials: "MB",
    date: "7 mai 2026",
    publishedAt: "2026-05-07",
    readingTime: "6 min",
    featured: false,
    body: [
      {
        kind: "paragraph",
        text: "La question n'est plus « où sont mes données » mais « qui peut y accéder, sous quelle juridiction, et que puis-je prouver ». Un hébergement en France ne suffit pas si la chaîne de sous-traitance sort de l'UE.",
      },
      {
        kind: "paragraph",
        text: "La suite de cette veille reste à rédiger.",
      },
    ],
  },
]

export const articleCategories = [
  "Tout",
  ...Array.from(new Set(articles.map((article) => article.category))),
]

export const featuredArticle =
  articles.find((article) => article.featured) ?? articles[0]

export const feedArticles = articles.filter((article) => !article.featured)

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug)
}

export function articleHref(slug: string) {
  return `/ressources/${slug}`
}

/** Deux suggestions de lecture, jamais l'article courant. */
export function getRelatedArticles(slug: string, count = 2) {
  const current = getArticle(slug)
  return articles
    .filter((article) => article.slug !== slug)
    .sort((a, b) => {
      const sameCategory =
        Number(b.category === current?.category) -
        Number(a.category === current?.category)
      return sameCategory || b.publishedAt.localeCompare(a.publishedAt)
    })
    .slice(0, count)
}

/** Teintes d'étiquette par catégorie. */
export const categoryTone: Record<ArticleCategory, string> = {
  Guide: "text-brand-text bg-brand-subtle",
  Analyse: "text-info-text bg-info-subtle",
  "Retour d'expérience": "text-success-text bg-success-subtle",
  Veille: "text-body bg-inset",
}
