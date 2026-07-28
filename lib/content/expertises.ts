/**
 * Trois familles d’expertise pour l’accueil (le visiteur se reconnaît dans un
 * problème, pas dans un catalogue), neuf services pour le hub et le SEO
 * d’intention. Référence : Architecture UX, S4 et fiche « Expertises ».
 */

export type ExpertiseFamilySlug =
  "plateformes-saas" | "sites-e-commerce" | "ia-api"

export type ExpertiseFamily = {
  slug: ExpertiseFamilySlug
  /** Libellé court, utilisé en navigation et en pied de page. */
  label: string
  /** Titre de la carte d’accueil. */
  title: string
  summary: string
  /** Étiquette technique du visuel schématique. */
  tag: string
  halo: "warm" | "cool"
  /** Largeurs en % des barres du visuel : trois valeurs. */
  lines: [number, number, number]
}

export const expertiseFamilies: ExpertiseFamily[] = [
  {
    slug: "plateformes-saas",
    label: "Plateformes & SaaS",
    title: "Plateformes & SaaS",
    summary:
      "Votre processus métier devient un produit : plateformes de gestion, portails clients, SaaS multi-tenants. Conçus pour durer et évoluer.",
    tag: "saas",
    halo: "warm",
    lines: [70, 45, 58],
  },
  {
    slug: "sites-e-commerce",
    label: "Sites & e-commerce",
    title: "Sites & e-commerce",
    summary:
      "Sites institutionnels et boutiques qui portent votre crédibilité : rapides, accessibles, pensés pour convertir sans crier.",
    tag: "web",
    halo: "cool",
    lines: [55, 72, 40],
  },
  {
    slug: "ia-api",
    label: "IA & API",
    title: "IA & API",
    summary:
      "Des capacités d’intelligence intégrées à vos outils — copilotes métier, automatisations, API robustes qui connectent votre écosystème.",
    tag: "ia · api",
    halo: "warm",
    lines: [48, 62, 76],
  },
]

export type ExpertiseService = {
  slug: string
  family: ExpertiseFamilySlug
  /** Titre de la page et de la carte du hub. */
  title: string
  /** Une phrase : à qui ça sert et pourquoi. */
  tagline: string
  /** Le problème du visiteur, en tête de page. */
  problem: string
  /** Ce que nous livrons : des items nommés, pas des promesses. */
  deliverables: { title: string; text: string }[]
  /** Choix techniques assumés, avec leur raison. */
  techChoices: { title: string; text: string }[]
  /** Étude de cas illustrant ce service. */
  relatedCase: string
  /** FAQ d’objections : les vraies questions, pas du remplissage. */
  faq: { question: string; answer: string }[]
  /** CTA contextualisé. */
  ctaTitle: string
}

export const expertiseServices: ExpertiseService[] = [
  {
    slug: "plateformes-saas",
    family: "plateformes-saas",
    title: "Plateformes métiers & SaaS",
    tagline:
      "Quand votre processus est votre avantage concurrentiel, aucun logiciel du marché ne le portera.",
    problem:
      "Vous avez essayé les progiciels du marché et votre métier n’entre pas dans leurs cases. Vos équipes contournent l’outil avec des fichiers parallèles, et vos indicateurs ont trois semaines de retard. La question n’est plus de savoir s’il faut un outil sur mesure, mais comment le construire sans y engloutir deux ans.",
    deliverables: [
      {
        title: "Une plateforme centrée sur les postes de travail",
        text: "Une interface par métier plutôt qu’un écran générique avec des droits : chaque utilisateur voit ce qu’il doit faire, alimenté par les mêmes données.",
      },
      {
        title: "Une architecture multi-tenant si vous comptez commercialiser",
        text: "Isolation des données par client, facturation, essai gratuit et autonomie complète à l’inscription. Prévu dès le premier jour, pas ajouté après.",
      },
      {
        title: "Les intégrations à votre écosystème existant",
        text: "API documentée, connexion à votre ERP, votre comptabilité, vos transporteurs. Nous remplaçons ce qui doit l’être et branchons le reste.",
      },
      {
        title: "La reprise de vos données historiques",
        text: "Pipeline de nettoyage, arbitrage humain sur les cas ambigus, bascule réversible par vagues. Aucune migration en une nuit.",
      },
    ],
    techChoices: [
      {
        title: "TypeScript de bout en bout",
        text: "Un seul langage du navigateur à la base de données : moins de surface d’erreur, et des compétences disponibles dans dix ans.",
      },
      {
        title: "PostgreSQL, pas un choix exotique",
        text: "Les bases de données de niche coûtent cher en recrutement et en exploitation. PostgreSQL couvre l’essentiel des besoins métiers, y compris le relationnel complexe.",
      },
      {
        title: "Mise en production continue",
        text: "Chaque itération est déployable. Une plateforme qui n’atteint la production qu’au dernier mois est une plateforme dont on ignore les vrais problèmes.",
      },
    ],
    relatedCase: "pilotage-production",
    faq: [
      {
        question: "Combien de temps avant d’avoir quelque chose d’utilisable ?",
        answer:
          "Un premier flux métier en production entre le troisième et le cinquième mois, selon le périmètre. Nous découpons pour qu’une partie serve avant que le tout soit terminé.",
      },
      {
        question: "Que se passe-t-il si nous voulons changer de prestataire ?",
        answer:
          "Le code, la documentation et les environnements vous appartiennent dès le premier commit. Nous produisons un dossier de réversibilité qui permet à une autre équipe de reprendre sans nous.",
      },
      {
        question: "Un progiciel du marché ne serait-il pas moins cher ?",
        answer:
          "Souvent oui, si votre processus est standard — et nous le disons quand c’est le cas. Le sur-mesure se justifie quand le processus est justement ce qui vous différencie.",
      },
      {
        question: "Qui maintient la plateforme ensuite ?",
        answer:
          "Nous, par contrat de maintenance évolutive, ou votre équipe interne que nous formons. Les deux options sont prévues au cadrage, pas subies après.",
      },
    ],
    ctaTitle: "Parlons de votre plateforme",
  },
  {
    slug: "portails-clients",
    family: "plateformes-saas",
    title: "Portails clients & extranets",
    tagline:
      "Donnez à vos clients un accès autonome à ce qu’ils vous demandent par téléphone.",
    problem:
      "Vos équipes passent leurs journées à renvoyer des documents, des états d’avancement et des factures que vos clients pourraient consulter seuls. Le standard sature, et vos clients trouvent votre relation moins fluide que celle de vos concurrents.",
    deliverables: [
      {
        title: "Un espace client réellement utilisé",
        text: "Documents, suivi de commandes ou de dossiers, échanges tracés. Le contenu est celui que vos clients réclament, identifié avant la conception.",
      },
      {
        title: "Une authentification adaptée à vos usages",
        text: "Comptes multi-utilisateurs par organisation, délégation de droits, connexion par votre annuaire ou par France Connect selon le contexte.",
      },
      {
        title: "Des notifications qui ne sont pas du bruit",
        text: "Chaque alerte porte une action possible. Un portail qui envoie dix courriels par semaine est un portail que l’on désabonne.",
      },
    ],
    techChoices: [
      {
        title: "Rendu serveur pour les contenus sensibles",
        text: "Les données confidentielles ne transitent jamais dans un état client persistant : le serveur ne rend que ce que l’utilisateur a le droit de voir.",
      },
      {
        title: "Traçabilité par défaut",
        text: "Chaque consultation et chaque téléchargement sont journalisés, ce qui règle la plupart des litiges avant qu’ils n’en deviennent.",
      },
    ],
    relatedCase: "portail-patients",
    faq: [
      {
        question: "Comment garantir que nos clients l’utiliseront ?",
        answer:
          "En partant des motifs d’appel réels : nous analysons ce que le standard reçoit avant de définir le périmètre. Un portail qui ne couvre pas les trois premiers motifs ne réduit rien.",
      },
      {
        question: "Peut-on le brancher sur notre outil de gestion ?",
        answer:
          "Oui, c’est le cas général. Si votre outil n’expose pas d’API, nous construisons une synchronisation intermédiaire plutôt que de vous demander de le changer.",
      },
      {
        question: "Et la conformité RGPD ?",
        answer:
          "Registre des traitements, durées de conservation, export et suppression des données sur demande font partie du livrable. Hébergement en France par défaut.",
      },
    ],
    ctaTitle: "Parlons de votre portail",
  },
  {
    slug: "applications-web",
    family: "plateformes-saas",
    title: "Applications web",
    tagline:
      "Un outil ciblé, livré vite, qui résout un problème précis sans devenir un projet de deux ans.",
    problem:
      "Un besoin identifié, un périmètre clair, et l’envie d’éviter le cycle interminable d’un grand projet. Vous cherchez une équipe capable de livrer une application utile en quelques mois, et de la faire évoluer ensuite.",
    deliverables: [
      {
        title: "Un périmètre tenu",
        text: "Ce qui entre dans la première version et ce qui attend sont écrits noir sur blanc au cadrage. Les demandes en cours de route rejoignent une liste, pas le périmètre.",
      },
      {
        title: "Une application accessible et rapide",
        text: "Accessibilité AA, utilisable au clavier, correcte sur mobile. Ce ne sont pas des options facturées en plus.",
      },
      {
        title: "Des tests là où ils comptent",
        text: "Les règles métier critiques sont couvertes automatiquement. Nous ne visons pas un pourcentage de couverture, nous visons les endroits où une régression coûte cher.",
      },
    ],
    techChoices: [
      {
        title: "Next.js et React",
        text: "Un socle mature et largement adopté, qui rend votre application maintenable par d’autres que nous.",
      },
      {
        title: "Pas de dépendance inutile",
        text: "Chaque bibliothèque ajoutée est une dette de mise à jour. Ce que la plateforme fait nativement, nous ne l’importons pas.",
      },
    ],
    relatedCase: "saas-interventions",
    faq: [
      {
        question: "Travaillez-vous au forfait ou en régie ?",
        answer:
          "Au forfait sur un périmètre cadré, ce qui vous protège. Les évolutions ultérieures se traitent au fil de l’eau, par enveloppes courtes.",
      },
      {
        question: "Pouvez-vous reprendre une application existante ?",
        answer:
          "Oui, après un audit de quelques jours qui dit honnêtement si la reprise est plus raisonnable qu’une reconstruction. Il arrive que nous recommandions de ne rien toucher.",
      },
    ],
    ctaTitle: "Parlons de votre application",
  },
  {
    slug: "sites-e-commerce",
    family: "sites-e-commerce",
    title: "Sites & e-commerce",
    tagline:
      "Une boutique qui sert des acheteurs pressés, pas une vitrine qui cherche à séduire.",
    problem:
      "Votre boutique existe mais vos clients continuent de commander par téléphone ou par fichier. Souvent parce qu’elle ignore leurs tarifs négociés, parce que la recherche ne trouve pas leurs références, ou parce que la commande demande huit écrans.",
    deliverables: [
      {
        title: "Une recherche qui trouve",
        text: "Tolérante aux références partielles et aux fautes de frappe, indexée sur vos caractéristiques techniques. Sur un catalogue profond, la recherche est le produit.",
      },
      {
        title: "Des tarifs justes pour chaque client",
        text: "Prix négociés, remises par volume, conditions de paiement par compte. Afficher un prix public à un client sous contrat détruit la confiance dans tout le site.",
      },
      {
        title: "Le réassort en trois clics",
        text: "L’historique de commandes devient le point d’entrée du compte. Un acheteur professionnel recommande, il ne découvre pas.",
      },
      {
        title: "Une disponibilité réelle",
        text: "Stocks synchronisés avec votre gestion. Une disponibilité optimiste génère l’appel qui suit la commande.",
      },
    ],
    techChoices: [
      {
        title: "Rendu serveur et pages pré-calculées",
        text: "Les pages catalogue sont servies statiques : rapides pour l’acheteur, lisibles pour les moteurs de recherche.",
      },
      {
        title: "Paiement délégué",
        text: "Nous n’hébergeons jamais de données de carte : le paiement passe par un prestataire certifié, ce qui sort votre site du périmètre PCI le plus lourd.",
      },
    ],
    relatedCase: "boutique-b2b",
    faq: [
      {
        question: "Faut-il quitter notre plateforme e-commerce actuelle ?",
        answer:
          "Pas forcément. Si le blocage est la recherche ou la tarification, nous pouvons intervenir dessus sans tout remplacer. Nous le disons après audit, pas avant.",
      },
      {
        question: "Et le référencement pendant la refonte ?",
        answer:
          "Plan de redirections établi avant la bascule, structure d’URL préservée quand elle est saine, et suivi des positions sur les huit semaines qui suivent.",
      },
      {
        question: "Gérez-vous aussi le B2C ?",
        answer:
          "Oui, mais notre valeur est plus nette en B2B et sur les catalogues techniques, là où la difficulté est fonctionnelle plutôt que promotionnelle.",
      },
    ],
    ctaTitle: "Parlons de votre boutique",
  },
  {
    slug: "sites-institutionnels",
    family: "sites-e-commerce",
    title: "Sites institutionnels",
    tagline:
      "Votre site est souvent le premier livrable que vos prospects examinent. Il doit tenir.",
    problem:
      "Votre site actuel raconte ce que vous faisiez il y a cinq ans, met quatre secondes à s’afficher, et vos équipes ne peuvent rien y modifier sans appeler un prestataire. Il travaille contre vous.",
    deliverables: [
      {
        title: "Une architecture de contenu qui suit un argumentaire",
        text: "Chaque page répond à une question que se pose réellement un décideur. Nous ne présentons pas des services, nous déroulons une conversation.",
      },
      {
        title: "Un espace de rédaction autonome",
        text: "Vos équipes publient et modifient sans nous. Le modèle de contenu est conçu pour éviter les pages cassées par une saisie inattendue.",
      },
      {
        title: "Des performances mesurées",
        text: "Core Web Vitals au vert sur mobile en conditions réelles, pas seulement en laboratoire. La vitesse est un argument commercial.",
      },
    ],
    techChoices: [
      {
        title: "Pages statiques par défaut",
        text: "Un site institutionnel n’a presque jamais besoin d’être calculé à chaque visite. Statique signifie rapide, robuste et peu coûteux à héberger.",
      },
      {
        title: "Accessibilité AA vérifiée",
        text: "Contrastes, navigation clavier, structure de titres, alternatives textuelles. C’est une obligation pour beaucoup de nos clients et un signal de sérieux pour tous.",
      },
    ],
    relatedCase: "guichet-unique",
    faq: [
      {
        question: "Quel CMS utilisez-vous ?",
        answer:
          "Un CMS découplé, choisi selon votre volume éditorial et vos habitudes. Nous ne poussons pas un outil unique : le bon CMS est celui que vos équipes utiliseront.",
      },
      {
        question: "Pouvez-vous reprendre notre charte existante ?",
        answer:
          "Oui. Nous pouvons aussi la faire évoluer, ou en construire une si elle n’existe pas encore de façon utilisable en numérique.",
      },
    ],
    ctaTitle: "Parlons de votre site",
  },
  {
    slug: "ux-ui",
    family: "sites-e-commerce",
    title: "Conception UX & UI",
    tagline:
      "Concevoir avant de construire, et tester avant de s’engager sur un budget de développement.",
    problem:
      "Vous avez un projet et des avis divergents en interne sur ce qu’il doit être. Lancer le développement dans cet état, c’est financer un désaccord. Il faut d’abord rendre le produit visible et testable.",
    deliverables: [
      {
        title: "Une cartographie du parcours réel",
        text: "Pas le parcours théorique décrit en réunion : celui que nous observons chez vos utilisateurs. L’écart entre les deux est toujours instructif.",
      },
      {
        title: "Un prototype cliquable testé",
        text: "Testé avec de vrais utilisateurs, dans leurs conditions réelles. Les hypothèses invalidées le sont avant la première ligne de code.",
      },
      {
        title: "Un design system documenté",
        text: "Composants, états, règles d’usage. Livré de façon exploitable par n’importe quelle équipe de développement, y compris la vôtre.",
      },
    ],
    techChoices: [
      {
        title: "Des maquettes reliées au code",
        text: "Les tokens du design system sont les valeurs réellement utilisées en développement : pas de dérive entre la maquette et le produit.",
      },
      {
        title: "Des tests aux contraintes réelles",
        text: "Gants, luminosité, bruit, connexion lente, écran de six ans. Ces contraintes changent une interface plus que dix ateliers en salle.",
      },
    ],
    relatedCase: "pilotage-production",
    faq: [
      {
        question: "Peut-on vous confier la conception seule ?",
        answer:
          "Oui, et c’est une mission fréquente. Le livrable est conçu pour être développé par quelqu’un d’autre, y compris une équipe interne.",
      },
      {
        question: "Combien de temps dure une phase de conception ?",
        answer:
          "De quatre à huit semaines selon l’ampleur, prototype testé inclus. Au-delà, c’est généralement le signe d’un périmètre mal découpé.",
      },
    ],
    ctaTitle: "Parlons de votre projet",
  },
  {
    slug: "ia-api",
    family: "ia-api",
    title: "IA & copilotes métier",
    tagline:
      "Des capacités d’intelligence utiles et vérifiables, intégrées dans les outils que vos équipes utilisent déjà.",
    problem:
      "L’IA est un sujet de comité de direction et vous cherchez un usage qui tienne devant vos équipes, votre juridique et vos clients. Le risque n’est pas de ne rien faire : c’est de déployer un outil qui se trompe sans que personne le voie.",
    deliverables: [
      {
        title: "Un cas d’usage choisi pour sa valeur et son risque",
        text: "Nous commençons par écrire ce que l’IA ne fera pas. Le périmètre exclu rassure davantage que la démonstration de ce qu’elle sait faire.",
      },
      {
        title: "Une proposition, jamais une décision automatique",
        text: "Le modèle rédige un brouillon, l’humain reste l’auteur. Chaque proposition affiche la source qui la justifie et se vérifie d’un coup d’œil.",
      },
      {
        title: "Une piste d’audit complète",
        text: "Ce qui a été proposé, par quel modèle, validé par qui et quand. Exploitable en cas de contestation.",
      },
      {
        title: "Une évaluation avant mise à disposition",
        text: "Jeu de cas de test métier, relecture humaine, mesure du taux de propositions conservées telles quelles. Sans cette étape, on déploie à l’aveugle.",
      },
    ],
    techChoices: [
      {
        title: "Des modèles accessibles par API, pas un modèle maison",
        text: "Entraîner un modèle propriétaire se justifie rarement. Les modèles de premier plan accessibles par API donnent de meilleurs résultats pour une fraction du coût.",
      },
      {
        title: "Vos données ne servent pas à entraîner",
        text: "Contrats de sous-traitance vérifiés, données de santé hébergées en HDS en France, aucune réutilisation pour l’entraînement.",
      },
      {
        title: "Un champ vide plutôt qu’une approximation",
        text: "Quand le modèle n’est pas sûr, il laisse vide et le signale. Une valeur devinée coûte plus cher qu’une valeur manquante.",
      },
    ],
    relatedCase: "copilote-ia-sante",
    faq: [
      {
        question: "Comment évitez-vous les réponses fausses ?",
        answer:
          "En restreignant le périmètre, en reliant chaque proposition à sa source dans vos données, en gardant une validation humaine, et en mesurant la qualité sur un jeu de cas réels avant tout déploiement.",
      },
      {
        question: "Nos données sortent-elles de l’entreprise ?",
        answer:
          "Elles transitent vers le fournisseur du modèle, sous contrat, sans réutilisation pour l’entraînement. Sur les sujets les plus sensibles, nous étudions un déploiement en environnement dédié.",
      },
      {
        question: "Combien coûte l’usage à l’échelle ?",
        answer:
          "Nous estimons le coût par opération dès le cadrage et le suivons en production. C’est une ligne de coût variable qu’il faut piloter, pas découvrir sur la facture.",
      },
    ],
    ctaTitle: "Parlons de votre cas d’usage",
  },
  {
    slug: "api-integrations",
    family: "ia-api",
    title: "API & intégrations",
    tagline:
      "Faire parler vos outils entre eux, de façon documentée et durable.",
    problem:
      "Vos données existent en plusieurs exemplaires, dans plusieurs outils, avec des écarts que personne ne sait expliquer. Chaque nouvel outil ajoute une synchronisation artisanale de plus, et personne ne sait ce qui casse quand l’un change.",
    deliverables: [
      {
        title: "Une API documentée et versionnée",
        text: "Spécification OpenAPI publiée, versionnée dès la première mise à disposition. La compatibilité se prévoit, elle ne se rattrape pas.",
      },
      {
        title: "Des intégrations observables",
        text: "Journalisation, alertes sur échec, rejeu des messages perdus. Une intégration silencieuse est une intégration dont on découvre la panne par un client.",
      },
      {
        title: "Une source de vérité désignée",
        text: "Pour chaque donnée partagée, un outil fait référence et les autres suivent. C’est ce choix, plus que la technique, qui met fin aux écarts.",
      },
    ],
    techChoices: [
      {
        title: "REST par défaut, GraphQL si c’est justifié",
        text: "REST est compris par tous vos partenaires. GraphQL a du sens sur des besoins de lecture complexes, pas comme choix de principe.",
      },
      {
        title: "Idempotence et rejeu",
        text: "Toute opération peut être rejouée sans effet de bord. C’est ce qui rend les incidents réseau ennuyeux plutôt que graves.",
      },
    ],
    relatedCase: "saas-interventions",
    faq: [
      {
        question: "Faut-il un bus de données ou un ETL du marché ?",
        answer:
          "Rarement en dessous d’une dizaine d’intégrations. Ces outils apportent une complexité d’exploitation qui ne se rentabilise qu’à l’échelle.",
      },
      {
        question: "Pouvez-vous documenter des API existantes ?",
        answer:
          "Oui, et c’est souvent la première étape utile : on ne peut pas fiabiliser des échanges que personne n’a écrits.",
      },
    ],
    ctaTitle: "Parlons de vos intégrations",
  },
  {
    slug: "maintenance-evolutive",
    family: "plateformes-saas",
    title: "Maintenance évolutive",
    tagline:
      "Un produit qui vit, se corrige et progresse — sans que vous ayez à relancer un projet.",
    problem:
      "Votre produit est en production et le prestataire qui l’a construit n’est plus joignable, ou facture chaque correction comme un projet. Les mises à jour de sécurité s’accumulent et personne n’ose y toucher.",
    deliverables: [
      {
        title: "Une reprise documentée",
        text: "Audit du code, de l’infrastructure et de la dette, avec un plan chiffré et priorisé. Nous disons aussi ce qu’il ne faut pas toucher.",
      },
      {
        title: "Un engagement de disponibilité et de délai",
        text: "Supervision, astreinte selon le niveau souscrit, délais de prise en charge écrits. Pas de « meilleur effort » verbal.",
      },
      {
        title: "Des évolutions par enveloppes courtes",
        text: "Un budget d’évolution par trimestre, arbitré avec vous. Le produit progresse en continu au lieu d’attendre le prochain grand projet.",
      },
      {
        title: "Les mises à jour de sécurité tenues",
        text: "Dépendances suivies, correctifs appliqués, montées de version majeures planifiées plutôt que subies.",
      },
    ],
    techChoices: [
      {
        title: "Des environnements reproductibles",
        text: "Infrastructure décrite en code : un environnement de test identique à la production se recrée en quelques minutes.",
      },
      {
        title: "Une réversibilité maintenue",
        text: "Le dossier de reprise est mis à jour à chaque évolution majeure. Vous pouvez nous quitter à tout moment, et c’est ce qui rend la relation saine.",
      },
    ],
    relatedCase: "pilotage-production",
    faq: [
      {
        question: "Reprenez-vous un produit que vous n’avez pas construit ?",
        answer:
          "Oui, c’est le cas le plus fréquent. L’audit préalable de quelques jours dit honnêtement si la reprise est raisonnable.",
      },
      {
        question: "Comment se facture la maintenance ?",
        answer:
          "Un forfait couvrant supervision, correctifs et mises à jour de sécurité, plus une enveloppe d’évolution que vous arbitrez. Les deux lignes sont distinctes et lisibles.",
      },
      {
        question: "Que se passe-t-il si nous internalisons plus tard ?",
        answer:
          "Nous préparons la passation et formons votre équipe. C’est une issue prévue au contrat, pas une rupture.",
      },
    ],
    ctaTitle: "Parlons de votre produit en production",
  },
]

export function expertiseHref(slug: string) {
  return `/expertises/${slug}`
}

export function getExpertiseService(slug: string) {
  return expertiseServices.find((service) => service.slug === slug)
}

export function getFamily(slug: ExpertiseFamilySlug) {
  return expertiseFamilies.find((family) => family.slug === slug)
}

/** Services regroupés par famille, dans l’ordre des familles. */
export const servicesByFamily = expertiseFamilies.map((family) => ({
  family,
  services: expertiseServices.filter(
    (service) => service.family === family.slug
  ),
}))
