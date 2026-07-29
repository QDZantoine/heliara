/**
 * Études de cas : la page la plus persuasive du site.
 * Source unique pour l'accueil (trois cas mis en avant) et pour le hub
 * /realisations (six cas, filtrables par secteur).
 *
 * Tous les chiffres, noms et verbatims sont à faire valider par les clients
 * avant mise en ligne : le ton de voix impose des résultats vérifiables.
 */

export type CaseChapter = {
  num: string
  title: string
  text: string
  /** Encadré de décision structurante, filet orange à gauche. */
  callout?: string
}

export type CaseStudy = {
  slug: string
  sector: string
  year: string
  /** Étiquette du hero : secteur · type de produit. */
  badge: string
  /** Titre court, cartes de listing. */
  title: string
  /** Titre du hero : le résultat est dans le titre. */
  heroTitle: string
  /** Résumé long, carte de l'accueil. */
  teaser: string
  /** Résumé court, carte du hub. */
  summary: string
  figure: string
  measure: string
  halo: "warm" | "cool"
  accent: "brand" | "info"
  /** Mis en avant sur l'accueil. */
  featured: boolean
  /** Carte large dans la grille du hub. */
  wide: boolean
  meta: { label: string; value: string }[]
  chapters: CaseChapter[]
  resultsLabel: string
  results: { value: string; label: string }[]
  testimonial: { quote: string; name: string; role: string; initials: string }
  lessons: string[]
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "pilotage-production",
    sector: "Industrie",
    year: "2026",
    badge: "Industrie · Plateforme métier",
    title: "Pilotage de production Voltéis",
    heroTitle:
      "Quatre outils déconnectés. Une plateforme. −38 % de temps administratif",
    teaser:
      "Un ERP métier sur mesure qui remplace quatre outils déconnectés : ordres de fabrication, qualité et expéditions dans une seule interface.",
    summary:
      "Un ERP métier sur mesure qui remplace quatre outils déconnectés - ordres de fabrication, qualité, expéditions.",
    figure: "−38 %",
    measure: "de temps administratif par commande",
    halo: "warm",
    accent: "brand",
    featured: true,
    wide: true,
    meta: [
      {
        label: "Client",
        value: "Voltéis Industrie - équipementier, 340 salariés",
      },
      { label: "Secteur", value: "Industrie manufacturière" },
      {
        label: "Périmètre",
        value: "Plateforme métier : production, qualité, expéditions",
      },
      {
        label: "Durée",
        value: "7 mois jusqu'à la production, maintenance en cours",
      },
      {
        label: "Équipe",
        value: "1 designer produit, 3 ingénieurs, 1 chef de projet",
      },
      {
        label: "Stack",
        value: "TypeScript · React · Node.js · PostgreSQL · Docker",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "Voltéis fabrique des équipements hydrauliques sur commande. En quinze ans, l'entreprise avait accumulé quatre outils : un ERP comptable, un logiciel qualité, des plannings Excel et un suivi d'expéditions maison. Chaque commande traversait les quatre, avec re-saisie à chaque frontière.",
      },
      {
        num: "02",
        title: "Problématique",
        text: "Le coût n'était pas seulement du temps perdu : les écarts entre outils créaient des erreurs d'expédition, des non-conformités découvertes tard, et une direction pilotant avec des chiffres vieux de trois semaines. Le premier réflexe - acheter un ERP industriel du marché - avait échoué deux ans plus tôt : le processus de Voltéis, sa force commerciale, ne rentrait pas dans les cases.",
        callout:
          "Décision structurante : ne pas remplacer l'ERP comptable, qui fonctionnait. La plateforme s'y connecte par API et ne couvre que ce qui fait la spécificité de Voltéis. Périmètre réduit, valeur maximale.",
      },
      {
        num: "03",
        title: "Objectifs",
        text: "Trois objectifs contractualisés au cadrage : une saisie unique par commande de bout en bout ; des indicateurs de production à jour à la minute pour la direction ; une adoption complète des ateliers sans période de double saisie au-delà de six semaines.",
      },
      {
        num: "04",
        title: "Recherche",
        text: "Deux semaines d'immersion : observation des ateliers sur les trois équipes, entretiens avec quatorze utilisateurs, cartographie du parcours réel d'une commande - et non du parcours théorique, les deux différaient sur onze points. Cette cartographie est devenue le référentiel du projet.",
      },
      {
        num: "05",
        title: "Conception",
        text: "Le parti pris : une interface par poste de travail, pas une interface générique avec des droits. L'opérateur qualité, le planificateur et le cariste voient trois outils différents nourris par les mêmes données. Prototype cliquable testé en atelier dès la semaine 6 - deux hypothèses invalidées, corrigées avant toute ligne de code.",
        callout:
          "Test le plus utile du projet : faire saisir une non-conformité réelle par un opérateur portant des gants de manutention. Résultat : cibles tactiles agrandies à 56 px et saisie vocale des mesures ajoutée au périmètre.",
      },
      {
        num: "06",
        title: "Interface",
        text: "Design system produit dérivé de l'identité Voltéis : contrastes AAA en atelier, où les écrans sont exposés à la lumière directe, typographie 17 px minimum, mode sombre pour l'équipe de nuit. 34 écrans, 61 composants documentés.",
      },
      {
        num: "07",
        title: "Développement & stack",
        text: "Itérations de deux semaines, chacune conclue par une démonstration en conditions réelles. Le flux « commande → fabrication » est passé en production au mois 4, le reste a suivi par vagues. Stack volontairement standard - TypeScript, React, Node.js, PostgreSQL - pour garantir la disponibilité des compétences dans dix ans. API documentée en OpenAPI, connectée à l'ERP comptable et au portail transporteurs.",
      },
      {
        num: "08",
        title: "Difficultés - et ce qu'on en a fait",
        text: "Deux vraies difficultés. La reprise des données historiques : quinze ans de fichiers Excel hétérogènes, traités par un pipeline de nettoyage semi-automatique avec arbitrage humain sur 4 % des lignes. Et la résistance initiale de l'équipe de nuit, absente des ateliers de conception - corrigée par une vague de tests dédiée et deux évolutions demandées par elle, livrées avant la bascule.",
      },
    ],
    resultsLabel: "Résultats mesurés - 12 mois après mise en production",
    results: [
      { value: "−38 %", label: "de temps administratif par commande" },
      { value: "0", label: "double saisie - contre 4 outils traversés avant" },
      {
        value: "100 %",
        label: "des ateliers actifs sur la plateforme à 6 semaines",
      },
      { value: "−61 %", label: "d'erreurs d'expédition sur 12 mois" },
    ],
    testimonial: {
      quote:
        "Ils ont passé deux semaines dans nos ateliers avant d'écrire quoi que ce soit. Le résultat : un outil que personne ne contourne.",
      name: "Thomas Meunier",
      role: "Directeur des systèmes d'information, Voltéis Industrie",
      initials: "TM",
    },
    lessons: [
      "Le périmètre gagnant n'était pas « remplacer l'existant » mais « couvrir la différence » : brancher la plateforme sur l'ERP comptable plutôt que le remplacer a économisé quatre mois et un risque majeur.",
      "Tester avec les contraintes physiques réelles - gants, luminosité, bruit - change davantage l'interface que dix ateliers en salle de réunion.",
      "L'adoption se gagne avant la mise en production : les utilisateurs qui ont invalidé nos hypothèses en semaine 6 sont devenus les ambassadeurs de la bascule.",
    ],
  },
  {
    slug: "portail-patients",
    sector: "Santé",
    year: "2025",
    badge: "Santé · Portail public",
    title: "Portail patients CHU Rhône-Nord",
    heroTitle:
      "Un portail de santé adopté sans formation, par 92 % des patients concernés",
    teaser:
      "Prise de rendez-vous, documents et échanges sécurisés pour un groupement hospitalier - accessible RGAA, adopté sans formation.",
    summary:
      "Rendez-vous, documents et échanges sécurisés - accessible RGAA, adopté sans formation.",
    figure: "92 %",
    measure: "d'adoption en trois mois",
    halo: "cool",
    accent: "info",
    featured: true,
    wide: false,
    meta: [
      {
        label: "Client",
        value: "CHU Rhône-Nord - groupement de 4 établissements",
      },
      { label: "Secteur", value: "Santé publique" },
      {
        label: "Périmètre",
        value: "Portail patients et professionnels, messagerie sécurisée",
      },
      { label: "Durée", value: "9 mois, dont 2 de conformité et recette" },
      {
        label: "Équipe",
        value: "1 designer, 3 ingénieurs, 1 référent conformité",
      },
      {
        label: "Stack",
        value: "TypeScript · Next.js · PostgreSQL · hébergement HDS",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "Quatre établissements, quatre façons de prendre rendez-vous, et un standard téléphonique saturé. Les patients appelaient parce que c'était le seul canal fiable ; les secrétariats passaient la moitié de leur journée à répéter des informations déjà écrites quelque part.",
      },
      {
        num: "02",
        title: "Problématique",
        text: "La difficulté n'était pas technique mais humaine : le portail devait servir une population très large, dont des personnes âgées, malvoyantes ou peu à l'aise avec le numérique. Un service inutilisable par 20 % des patients aurait aggravé la charge du standard au lieu de la réduire.",
        callout:
          "Décision structurante : viser le RGAA au niveau AA dès la conception, et non en rattrapage d'audit. L'accessibilité a cadré les choix d'interface, ce qui a bénéficié à tous les publics et non aux seuls utilisateurs concernés.",
      },
      {
        num: "03",
        title: "Objectifs",
        text: "Réduire de moitié les appels de premier niveau, offrir un compte unique pour les quatre établissements, et garantir la conformité RGPD et HDS sans compromis sur la fluidité du parcours.",
      },
      {
        num: "04",
        title: "Recherche",
        text: "Tests d'utilisabilité avec dix-huit patients recrutés en salle d'attente, dont six de plus de soixante-dix ans et deux utilisateurs de lecteur d'écran. Trois parcours ont été réécrits entièrement à la suite de ces séances, dont la première connexion.",
      },
      {
        num: "05",
        title: "Conception",
        text: "Une seule action possible par écran, un vocabulaire de patient et non d'administration hospitalière, et aucun document caché derrière plus de deux clics. Les messages d'erreur ont été rédigés avec les secrétariats : ce sont eux qui savent ce que les patients comprennent.",
      },
      {
        num: "06",
        title: "Conformité & hébergement",
        text: "Hébergement certifié HDS en France, registre des traitements tenu avec le délégué à la protection des données du groupement, consentements traçables et export complet des données sur demande. La documentation de conformité fait partie du livrable, pas d'une annexe.",
      },
    ],
    resultsLabel: "Résultats mesurés - 3 mois après ouverture au public",
    results: [
      { value: "92 %", label: "des patients concernés ont activé leur compte" },
      { value: "−47 %", label: "d'appels de premier niveau au standard" },
      { value: "100 %", label: "des critères RGAA applicables satisfaits" },
      { value: "0", label: "incident de sécurité depuis l'ouverture" },
    ],
    testimonial: {
      quote:
        "C'est le premier outil numérique que nos secrétariats ont défendu au lieu de le subir. Ils ont été associés à l'écriture des messages, ça change tout.",
      name: "Awa Diallo",
      role: "Directrice de la transformation numérique, CHU Rhône-Nord",
      initials: "AD",
    },
    lessons: [
      "L'accessibilité traitée dès le cadrage coûte moins cher qu'un audit correctif, et améliore l'interface pour tout le monde.",
      "Faire écrire les messages d'erreur par les équipes qui répondent au téléphone est le raccourci le plus rentable vers un vocabulaire compréhensible.",
      "Sur un service public, la première connexion est le vrai produit : c'est là que se perdent les utilisateurs les plus fragiles.",
    ],
  },
  {
    slug: "saas-interventions",
    sector: "Services B2B",
    year: "2025",
    badge: "Services B2B · SaaS multi-tenant",
    title: "SaaS d'interventions Fieldsy",
    heroTitle:
      "D'un outil interne à un produit vendu à ses propres concurrents",
    teaser:
      "De l'outil interne au produit commercialisé : refonte complète, facturation intégrée, API publique. Aujourd'hui vendu à ses propres concurrents.",
    summary:
      "De l'outil interne au produit commercialisé : multi-tenant, facturation, API publique.",
    figure: "×3",
    measure: "de revenus récurrents en un an",
    halo: "warm",
    accent: "brand",
    featured: true,
    wide: false,
    meta: [
      {
        label: "Client",
        value: "Fieldsy - maintenance multitechnique, 90 salariés",
      },
      { label: "Secteur", value: "Services aux entreprises" },
      {
        label: "Périmètre",
        value: "Refonte produit, multi-tenant, facturation, API publique",
      },
      { label: "Durée", value: "11 mois, mise en production progressive" },
      { label: "Équipe", value: "1 designer, 4 ingénieurs, 1 product manager" },
      {
        label: "Stack",
        value: "TypeScript · Next.js · NestJS · PostgreSQL · Stripe",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "Fieldsy avait développé en interne un outil de planification d'interventions, utilisé quotidiennement par ses techniciens. Deux confrères avaient demandé à l'utiliser. La direction voyait un produit ; le code, lui, était mono-client jusque dans son modèle de données.",
      },
      {
        num: "02",
        title: "Problématique",
        text: "Vendre l'outil supposait trois chantiers simultanés : isoler les données par client, industrialiser la facturation, et rendre le produit compréhensible sans formation par quelqu'un qui ne connaît pas les habitudes de Fieldsy. Le tout sans interrompre l'exploitation quotidienne.",
        callout:
          "Décision structurante : garder la base de code existante et la faire évoluer par étapes plutôt que réécrire. La réécriture aurait gelé les évolutions métier pendant un an - inacceptable pour une équipe qui vit de cet outil.",
      },
      {
        num: "03",
        title: "Objectifs",
        text: "Ouvrir le produit à des clients tiers sans dégrader l'expérience des équipes internes, atteindre l'autonomie complète à l'inscription, et publier une API permettant l'intégration aux logiciels de gestion des clients.",
      },
      {
        num: "04",
        title: "Conception",
        text: "Le vocabulaire propre à Fieldsy a été extrait dans une couche de configuration : chaque client nomme ses objets métier comme il le fait au quotidien. L'ancien parcours de création d'intervention, hérité d'un usage expert, a été doublé d'un parcours guidé pour les nouveaux comptes.",
      },
      {
        num: "05",
        title: "Développement",
        text: "Isolation des données par client au niveau de la base, migration en huit vagues avec bascule réversible à chaque étape. Facturation branchée sur Stripe, avec essai gratuit et changement de formule sans intervention humaine. API publique documentée en OpenAPI, versionnée dès la première publication.",
      },
      {
        num: "06",
        title: "Difficultés",
        text: "La migration multi-tenant sur une base en exploitation a été la partie la plus délicate : chaque vague a été jouée deux fois sur une copie de production avant d'être appliquée. Une seule vague a nécessité un retour arrière, sans perte de données.",
      },
    ],
    resultsLabel: "Résultats mesurés - 12 mois après l'ouverture commerciale",
    results: [
      { value: "×3", label: "de revenus récurrents en un an" },
      {
        value: "14",
        label: "entreprises clientes, dont trois concurrents directs",
      },
      { value: "0", label: "intervention humaine nécessaire à l'inscription" },
      { value: "99,95 %", label: "de disponibilité constatée sur la période" },
    ],
    testimonial: {
      quote:
        "Nous vendons aujourd'hui à des concurrents un outil qu'on avait construit pour nous. Personne chez nous n'imaginait ça possible en un an.",
      name: "Claire Fontaine",
      role: "Directrice générale, Fieldsy",
      initials: "CF",
    },
    lessons: [
      "Transformer un outil interne en produit est d'abord un travail de vocabulaire : ce qui va de soi en interne est illisible en dehors.",
      "Migrer par vagues réversibles sur une base en exploitation coûte plus de temps de préparation, et beaucoup moins de nuits blanches.",
      "Une API publique versionnée dès le premier jour évite la dette de compatibilité qui bloque toutes les évolutions suivantes.",
    ],
  },
  {
    slug: "guichet-unique",
    sector: "Collectivités",
    year: "2024",
    badge: "Collectivités · Guichet numérique",
    title: "Guichet unique Métropole d'Auréa",
    heroTitle:
      "Un compte, zéro re-saisie, −54 % d'appels au standard métropolitain",
    teaser:
      "Les démarches des usagers unifiées derrière un compte unique : état civil, urbanisme, famille, sans re-saisie d'un service à l'autre.",
    summary:
      "Démarches des usagers unifiées : état civil, urbanisme, famille - un seul compte, zéro re-saisie.",
    figure: "−54 %",
    measure: "d'appels au standard",
    halo: "cool",
    accent: "info",
    featured: false,
    wide: false,
    meta: [
      {
        label: "Client",
        value: "Métropole d'Auréa - 38 communes, 420 000 habitants",
      },
      { label: "Secteur", value: "Collectivité territoriale" },
      {
        label: "Périmètre",
        value: "Guichet unique, 23 démarches, compte usager",
      },
      { label: "Durée", value: "14 mois, ouverture par lots de démarches" },
      { label: "Équipe", value: "2 designers, 4 ingénieurs, 1 chef de projet" },
      {
        label: "Stack",
        value: "TypeScript · Next.js · PostgreSQL · France Connect",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "Vingt-trois démarches réparties sur cinq sites différents, chacun avec son formulaire, son compte et sa logique de pièces justificatives. Un usager déménageant devait déclarer trois fois la même adresse.",
      },
      {
        num: "02",
        title: "Problématique",
        text: "Chaque service défendait son formulaire, et pour de bonnes raisons : les contraintes réglementaires diffèrent réellement d'une démarche à l'autre. Le projet ne pouvait donc pas imposer un formulaire unique, mais devait supprimer les redondances de saisie.",
        callout:
          "Décision structurante : ne pas unifier les démarches, mais unifier l'identité et les pièces. Chaque service garde sa procédure ; l'usager, lui, ne fournit jamais deux fois la même information.",
      },
      {
        num: "03",
        title: "Objectifs",
        text: "Un compte usager unique raccordé à France Connect, un coffre de pièces justificatives réutilisables, et un suivi d'avancement lisible pour chaque démarche déposée.",
      },
      {
        num: "04",
        title: "Conception",
        text: "Les formulaires ont été redécoupés en étapes courtes, avec enregistrement automatique : une démarche d'urbanisme peut être reprise trois jours plus tard sans rien perdre. Le suivi affiche l'état réel du dossier, y compris « en attente d'un autre service » - l'information que les usagers réclamaient le plus.",
      },
      {
        num: "05",
        title: "Déploiement",
        text: "Ouverture par lots de trois à quatre démarches, chaque lot précédé d'une formation des agents concernés et suivi de deux semaines d'observation du standard téléphonique. Les motifs d'appel résiduels ont alimenté le lot suivant.",
      },
    ],
    resultsLabel:
      "Résultats mesurés - 12 mois après l'ouverture du dernier lot",
    results: [
      {
        value: "−54 %",
        label: "d'appels au standard sur les démarches ouvertes",
      },
      { value: "23", label: "démarches disponibles derrière un compte unique" },
      { value: "0", label: "re-saisie d'une pièce déjà fournie" },
      { value: "4,6/5", label: "de satisfaction déclarée par les usagers" },
    ],
    testimonial: {
      quote:
        "Le projet a réussi parce qu'il n'a pas cherché à réformer les services, seulement à leur éviter de redemander ce que l'usager avait déjà donné.",
      name: "Pierre Vasseur",
      role: "Directeur général des services, Métropole d'Auréa",
      initials: "PV",
    },
    lessons: [
      "Sur un guichet public, l'unification qui marche est celle de l'identité et des pièces, pas celle des procédures.",
      "Afficher l'attente réelle d'un dossier, même quand elle est gênante, réduit plus les appels que n'importe quelle page d'aide.",
      "Déployer par lots avec observation du standard entre chaque lot transforme le support en instrument de conception.",
    ],
  },
  {
    slug: "boutique-b2b",
    sector: "E-commerce",
    year: "2024",
    badge: "E-commerce · Boutique B2B",
    title: "Boutique B2B Kerlon",
    heroTitle:
      "40 000 références, des tarifs négociés par client, une commande en trois clics",
    teaser:
      "Un catalogue technique de 40 000 références avec tarifs négociés par client et commande en trois clics, pour des acheteurs professionnels pressés.",
    summary:
      "Catalogue technique de 40 000 références, tarifs négociés par client, commande en 3 clics.",
    figure: "+31 %",
    measure: "de panier moyen",
    halo: "warm",
    accent: "brand",
    featured: false,
    wide: false,
    meta: [
      {
        label: "Client",
        value: "Kerlon - distribution de composants techniques",
      },
      { label: "Secteur", value: "E-commerce professionnel" },
      {
        label: "Périmètre",
        value: "Boutique B2B, tarification par compte, réassort",
      },
      { label: "Durée", value: "6 mois jusqu'à la production" },
      { label: "Équipe", value: "1 designer, 3 ingénieurs" },
      {
        label: "Stack",
        value: "TypeScript · Next.js · PostgreSQL · Elasticsearch",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "Les acheteurs de Kerlon commandaient par téléphone ou par fichier tableur, parce que la boutique existante ne connaissait pas leurs tarifs négociés et affichait des prix publics faux pour eux. Le site servait de catalogue, pas de canal de vente.",
      },
      {
        num: "02",
        title: "Problématique",
        text: "Un acheteur professionnel ne découvre pas un catalogue : il cherche une référence précise, vérifie un prix qui lui est propre, et recommande souvent la même chose. L'enjeu était la vitesse d'exécution d'une tâche connue, pas la séduction.",
        callout:
          "Décision structurante : construire la recherche avant la mise en page. Sur un catalogue de 40 000 références techniques, la qualité de la recherche est le produit ; le reste est de l'habillage.",
      },
      {
        num: "03",
        title: "Objectifs",
        text: "Afficher le tarif réel du client connecté partout, permettre le réassort d'une commande passée en trois clics, et rendre la recherche tolérante aux références partielles et aux fautes de frappe.",
      },
      {
        num: "04",
        title: "Conception",
        text: "La fiche produit a été réduite aux informations qu'un professionnel vérifie : référence, caractéristiques normalisées, disponibilité réelle, prix client. L'historique de commandes est devenu le point d'entrée principal du compte, avant le catalogue.",
      },
      {
        num: "05",
        title: "Développement",
        text: "Indexation des 40 000 références avec recherche tolérante aux erreurs et aux références partielles, tarification calculée par compte au moment de l'affichage, et synchronisation des stocks avec l'outil de gestion toutes les cinq minutes.",
      },
    ],
    resultsLabel: "Résultats mesurés - 9 mois après mise en production",
    results: [
      { value: "+31 %", label: "de panier moyen sur les comptes actifs" },
      {
        value: "68 %",
        label: "des commandes passées en ligne, contre 22 % avant",
      },
      { value: "3 clics", label: "pour réassortir une commande déjà passée" },
      { value: "180 ms", label: "de temps de réponse médian sur la recherche" },
    ],
    testimonial: {
      quote:
        "Nos acheteurs ne nous appellent plus pour vérifier un prix. C'est le signe le plus clair que la boutique fait enfin son travail.",
      name: "Sonia Berthier",
      role: "Directrice commerciale, Kerlon",
      initials: "SB",
    },
    lessons: [
      "En B2B, la recherche et l'historique de commandes valent plus que n'importe quelle page d'accueil.",
      "Afficher un prix public à un client qui a un tarif négocié détruit la confiance dans tout le site.",
      "La disponibilité réelle, même mauvaise, est préférable à une disponibilité optimiste : elle évite l'appel qui suit la commande.",
    ],
  },
  {
    slug: "copilote-ia-sante",
    sector: "Startup",
    year: "2026",
    badge: "Santé numérique · IA",
    title: "Copilote IA Nexa Santé",
    heroTitle:
      "Onze minutes gagnées par dossier, sans jamais retirer la décision au praticien",
    teaser:
      "Un copilote de pré-remplissage documentaire pour les équipes de soin : proposé par l'IA, validé par le praticien, tracé de bout en bout.",
    summary:
      "Pré-remplissage documentaire par IA pour les équipes de soin - validé par les praticiens, tracé, auditable.",
    figure: "11 min",
    measure: "gagnées par dossier",
    halo: "cool",
    accent: "info",
    featured: false,
    wide: true,
    meta: [
      { label: "Client", value: "Nexa Santé - éditeur logiciel, 45 salariés" },
      { label: "Secteur", value: "Santé numérique" },
      {
        label: "Périmètre",
        value: "Copilote de pré-remplissage, traçabilité, garde-fous",
      },
      { label: "Durée", value: "5 mois, dont 2 d'évaluation clinique" },
      {
        label: "Équipe",
        value: "1 designer, 3 ingénieurs, 1 référent clinique",
      },
      {
        label: "Stack",
        value:
          "TypeScript · Next.js · PostgreSQL · API Claude · hébergement HDS",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "Les équipes de soin de Nexa Santé passaient une part importante de leur journée à recopier dans des comptes rendus des informations déjà présentes dans le dossier du patient. Le besoin était identifié depuis longtemps ; la crainte de l'erreur automatisée bloquait tout.",
      },
      {
        num: "02",
        title: "Problématique",
        text: "Un modèle de langage qui se trompe sur un compte rendu médical n'est pas une gêne, c'est un risque. Le produit ne pouvait donc pas viser l'automatisation, mais la proposition : l'IA rédige un brouillon, le praticien reste l'auteur et le décideur.",
        callout:
          "Décision structurante : aucune donnée n'est écrite dans le dossier sans validation humaine explicite. Chaque proposition affiche sa source dans le dossier, et chaque validation est horodatée et attribuée.",
      },
      {
        num: "03",
        title: "Objectifs",
        text: "Réduire le temps de rédaction d'un compte rendu sans dégrader sa qualité, rendre chaque proposition vérifiable en un coup d'œil, et produire une piste d'audit complète exploitable en cas de contestation.",
      },
      {
        num: "04",
        title: "Conception",
        text: "Le brouillon apparaît à côté du dossier, jamais à sa place. Chaque phrase proposée est reliée à l'élément du dossier qui la justifie : un survol suffit à vérifier. Les champs que le modèle n'a pas su remplir restent vides et signalés, plutôt que devinés.",
      },
      {
        num: "05",
        title: "Garde-fous & évaluation",
        text: "Deux mois d'évaluation sur des dossiers anonymisés, avec relecture systématique par deux praticiens, avant toute mise à disposition. Les catégories de contenu jugées trop risquées ont été retirées du périmètre du copilote et le restent.",
      },
      {
        num: "06",
        title: "Conformité",
        text: "Hébergement HDS en France, aucune donnée de santé utilisée pour entraîner un modèle, contrats de sous-traitance conformes au RGPD, et journal d'audit conservé selon la durée réglementaire applicable.",
      },
    ],
    resultsLabel: "Résultats mesurés - 6 mois après mise à disposition",
    results: [
      { value: "11 min", label: "gagnées en moyenne par dossier" },
      { value: "100 %", label: "des propositions validées par un praticien" },
      { value: "0", label: "écriture automatique sans validation humaine" },
      { value: "94 %", label: "des propositions conservées telles quelles" },
    ],
    testimonial: {
      quote:
        "Ils ont commencé par nous dire ce que l'IA ne ferait pas. C'est ce qui a convaincu notre comité médical.",
      name: "Docteur Hélène Roussel",
      role: "Référente clinique, Nexa Santé",
      initials: "HR",
    },
    lessons: [
      "Sur un sujet à risque, définir le périmètre de ce que l'IA ne fera pas rassure davantage que démontrer ce qu'elle sait faire.",
      "Relier chaque proposition à sa source dans les données transforme une boîte noire en outil vérifiable.",
      "Un champ laissé vide et signalé est infiniment préférable à un champ rempli par approximation.",
    ],
  },
]

export const featuredCases = caseStudies.filter((study) => study.featured)

/** « Tous » plus les secteurs représentés, dans l'ordre des cas. */
export const caseSectors = [
  "Tous",
  ...Array.from(new Set(caseStudies.map((study) => study.sector))),
]

export function getCase(slug: string) {
  return caseStudies.find((study) => study.slug === slug)
}

/** Rebond de fin d'étude de cas : aucune impasse, on reste dans la preuve. */
export function getNextCase(slug: string) {
  const index = caseStudies.findIndex((study) => study.slug === slug)
  if (index === -1) {
    return undefined
  }
  return caseStudies[(index + 1) % caseStudies.length]
}

export function caseHref(slug: string) {
  return `/realisations/${slug}`
}
