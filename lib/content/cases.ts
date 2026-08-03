/**
 * Études de cas : la page la plus persuasive du site.
 *
 * **Ce fichier a deux rôles, et c'est ce qui le rend sensible.** Il est le repli du
 * site public quand la base est muette, et la source de `pnpm db:seed` - donc ce qui
 * est en ligne le jour d'une initialisation en production. Une erreur ici est publique
 * deux fois.
 *
 * **Les six fiches de démonstration ont été remplacées par neuf réalisations réelles**,
 * rédigées d'après le contenu public de chaque site client puis importées. Les fiches
 * inventées - Voltéis, CHU Rhône-Nord, Kerlon, Nexa Santé - portaient des noms de
 * clients, des verbatims signés et vingt-quatre résultats chiffrés qui n'existaient
 * pas. Ne pas les faire revenir, pas même en exemple de gabarit.
 *
 * Ce qui reste volontairement vide sur les neuf fiches, et pourquoi :
 *
 * - **`figure` / `measure` / `results`** : aucun chiffre n'a été communiqué par les
 *   clients. Un chiffre absent fait disparaître son bloc ; un chiffre inventé serait
 *   une affirmation fausse sur une entreprise nommée.
 * - **`testimonial`** : un verbatim se demande à son auteur et se fait valider par
 *   écrit. C'est le contenu le plus exposé qu'un site puisse porter.
 * - **La ligne `Stack` de `meta`** : les piles n'ont pas été confirmées projet par
 *   projet. Un tableau technique public est une affirmation vérifiable par le lecteur.
 *
 * Ces trois manques se comblent dans l'administration, fiche par fiche, à mesure que
 * l'information est confirmée. Le site est conçu pour s'en passer.
 */

export type CaseChapter = {
  num: string
  title: string
  /**
   * Le corps du chapitre, en **HTML restreint** : c'est ce que produit l'éditeur riche
   * de l'administration, et `RichHtml` le rend tel quel. Les balises acceptées sont
   * celles de `lib/rich-text.ts`, et rien d'autre - un fragment hors liste serait
   * refusé à l'amorçage.
   */
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
    slug: "hexceos-site-cybersecurite",
    sector: "Cybersécurité",
    year: "2025",
    badge: "Cybersécurité · Site institutionnel multilingue",
    title: "Hexceos - site cybersécurité multilingue",
    heroTitle: "Le site d'Hexceos, cybersécurité et cloud opérés 24/7.",
    teaser:
      "Hexceos opère un SOC 24/7 et une offre cybersécurité, infogérance et cloud, de l'Île-de-France jusqu'à Montréal. Le site devait installer la crédibilité technique, couvrir plusieurs zones et plusieurs langues, et orienter chaque profil (dirigeant, DSI, acheteur) vers le bon service. Nous avons conçu un site multilingue, structuré par métiers et par produits, pensé pour le référencement et la conversion vers le diagnostic.",
    summary:
      "Site institutionnel d'un acteur de la cybersécurité, de l'infogérance et du cloud, décliné en français, anglais et québécois, avec pages services, produits, cas clients et agences.",
    figure: "",
    measure: "",
    halo: "warm",
    accent: "brand",
    featured: true,
    wide: true,
    meta: [
      {
        label: "Périmètre",
        value:
          "Site multilingue (FR / EN / QC), pages services, produits, cas clients, agences, FAQ et blog",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>Hexceos sécurise, exploite et héberge des systèmes d'information avec une équipe internalisée et un centre d'opérations de sécurité disponible en continu.</p><p>L'entreprise avait besoin d'un site à la hauteur de cette exigence : lisible pour des dirigeants comme pour des équipes techniques, disponible en français, anglais et pour le marché québécois, et capable de présenter à la fois des services et des produits.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré un site institutionnel multilingue organisé autour de trois métiers (cybersécurité, infogérance, cloud) et de pages produits dédiées, avec des sections cas clients, agences, FAQ et ressources.</p><p>La navigation oriente chaque visiteur vers la demande de diagnostic, avec des animations discrètes et une structure pensée pour le référencement local sur chaque zone d'implantation.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "bsl-portage-simulateur",
    sector: "Services B2B",
    year: "2025",
    badge: "Portage salarial · Vitrine et simulateur",
    title: "BSL Portage - site avec simulateur de revenus",
    heroTitle: "Le site de BSL Portage, avec simulateur de revenus intégré.",
    teaser:
      "BSL Portage accompagne consultants et entreprises en portage salarial, avec une promesse de réactivité et une gestion 100 pour cent digitale. Le site devait expliquer le concept, rassurer sur les garanties et permettre à un indépendant d'estimer ses revenus. Nous avons conçu une vitrine claire avec un simulateur de revenus interactif et des parcours de contact distincts.",
    summary:
      "Site d'une société de portage salarial : présentation du concept, simulateur de revenus (TJM, frais, jours travaillés), formulaires consultants et entreprises, blog.",
    figure: "",
    measure: "",
    halo: "cool",
    accent: "info",
    featured: true,
    wide: false,
    meta: [
      {
        label: "Périmètre",
        value:
          "Vitrine, simulateur de revenus, formulaires consultant et entreprise, blog",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>BSL Portage propose une solution de portage salarial digitalisée, avec accompagnement dédié et garanties sociales.</p><p>L'objectif du site : rendre le concept immédiatement compréhensible, donner envie d'estimer ses revenus et distinguer les parcours consultant et entreprise.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré un site vitrine avec un simulateur de revenus interactif (taux journalier, frais, jours travaillés) et des formulaires séparés pour les consultants et les entreprises.</p><p>Le site met en avant les garanties, les protections sociales et un blog d'actualités pour le référencement.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "luundi-experience-rh",
    sector: "RH",
    year: "2025",
    badge: "Expérience collaborateur · Vitrine et boutique",
    title: "Luundi - site RH et boutique",
    heroTitle:
      "Le site de Luundi, box et expériences RH pour les moments clés du parcours collaborateur.",
    teaser:
      "Luundi transforme les moments RH (arrivée, départ, reconnaissance) en expériences, à travers des box et des ateliers. Le site devait présenter les solutions par moment clé, permettre de composer ou commander des box, et capter des contacts via des ressources. Nous avons construit une vitrine et une boutique, avec pages solutions, catalogue, blog, podcasts et formulaires de téléchargement.",
    summary:
      "Site d'une marque d'expériences RH (box onboarding, offboarding, reconnaissance) : présentation des solutions, boutique, ressources, podcasts et lead magnets.",
    figure: "",
    measure: "",
    halo: "warm",
    accent: "brand",
    featured: true,
    wide: false,
    meta: [
      {
        label: "Périmètre",
        value:
          "Vitrine, boutique en ligne, catalogue, blog, ressources téléchargeables",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>Luundi conçoit des box et des expériences pour accompagner les moments clés du parcours collaborateur : intégration, départ, retour de congé, reconnaissance.</p><p>Le site devait rendre lisible une offre riche, organisée par moment, et proposer aussi bien des box clé en main que des compositions sur mesure.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré une vitrine structurée par solutions et par box, adossée à une boutique en ligne, avec catalogue à personnaliser, blog, podcasts et formulaires de téléchargement de ressources.</p><p>Les parcours orientent les RH et dirigeants vers la demande de contact ou la commande.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "be-skilled-lab-catalogue-formations",
    sector: "Formation",
    year: "2025",
    badge: "Formation · Site vitrine et catalogue",
    title: "Be Skilled Lab - catalogue de formations",
    heroTitle:
      "Le site de Be Skilled Lab, organisme de formation IT et IA certifié Qualiopi.",
    teaser:
      "Be Skilled Lab forme les professionnels de la cybersécurité, du cloud, du DevOps et de l'IA. Le site devait présenter un catalogue clair, filtrable par domaine, afficher prix et durées, et guider les visiteurs vers le financement (CPF, OPCO) et la prise de contact. Nous avons construit une vitrine et un catalogue structurés, avec fiches de formation, dispositifs de financement et téléchargement de brochure.",
    summary:
      "Site d'un organisme de formation IT et IA certifié Qualiopi : catalogue de formations filtrable, pages financement (CPF, OPCO), brochure et blog.",
    figure: "",
    measure: "",
    halo: "cool",
    accent: "info",
    featured: false,
    wide: false,
    meta: [
      {
        label: "Périmètre",
        value:
          "Vitrine, catalogue de formations filtrable, fiches formation, financement, brochure, blog",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>Be Skilled Lab propose des formations en cybersécurité, cloud, DevOps, développement, gestion de projet et intelligence artificielle, animées par des experts en activité.</p><p>L'enjeu était de rendre lisible une offre large, de rassurer sur la certification Qualiopi et le financement, et de faciliter la demande de renseignements.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons mis en place un catalogue filtrable par domaine, avec des fiches de formation détaillant prix, durée, prérequis et éligibilité au financement.</p><p>Le site intègre les pages financement (CPF, OPCO), une brochure téléchargeable, un blog et des parcours de contact clairs pour les particuliers comme pour les entreprises.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "dk-clim-artisan-devis",
    sector: "Artisanat",
    year: "2025",
    badge: "Artisanat · Site vitrine one-page",
    title: "DK Clim - site vitrine artisan avec devis",
    heroTitle: "Le site de DK Clim, artisan du confort thermique à Frontignan.",
    teaser:
      "DK Clim installe plomberie, pompes à chaleur, climatisation réversible et solaire thermique dans le bassin de Thau. Le site devait présenter les métiers, rassurer par les qualifications RGE et les avis, et générer des demandes de devis. Nous avons conçu un site vitrine d'une page, orienté conversion, avec formulaire de devis, contact WhatsApp et carte.",
    summary:
      "Site vitrine d'un artisan plomberie, chauffage, climatisation et solaire thermique : services, réalisations, avis, FAQ et formulaire de devis avec contact WhatsApp.",
    figure: "",
    measure: "",
    halo: "warm",
    accent: "brand",
    featured: false,
    wide: false,
    meta: [
      {
        label: "Périmètre",
        value:
          "Site vitrine one-page, services, réalisations, avis, FAQ, formulaire de devis, WhatsApp",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>DK Clim est un artisan certifié RGE intervenant à Frontignan, Sète, Balaruc et Montpellier, pour les particuliers et les entreprises.</p><p>L'enjeu était de présenter clairement quatre métiers, de mettre en avant les qualifications et les aides de l'État, et de faciliter la demande de devis.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré un site vitrine d'une page structuré par services, avec galerie de réalisations, avis clients, FAQ et bloc de qualifications RGE.</p><p>La conversion passe par un formulaire de devis, un bouton WhatsApp et une carte de localisation, pour capter la demande au moment où elle se présente.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "lessonsharing-organisme-formation",
    sector: "Formation",
    year: "2025",
    badge: "Formation · Site institutionnel",
    title: "LessonSharing - site organisme de formation",
    heroTitle: "Le site de LessonSharing, organisme de formation IT.",
    teaser:
      "LessonSharing connecte les experts du numérique avec les établissements et entreprises qui forment les talents de demain. Le site devait présenter le positionnement, rassurer sur la qualité des formateurs et faciliter la mise en relation. Nous avons conçu un site institutionnel clair, centré sur l'offre de formation et le contact.",
    summary:
      "Site d'un organisme de formation qui connecte des formateurs IT qualifiés avec les établissements et entreprises : présentation de l'offre et mise en relation.",
    figure: "",
    measure: "",
    halo: "cool",
    accent: "info",
    featured: false,
    wide: false,
    meta: [
      {
        label: "Périmètre",
        value: "Site institutionnel, présentation de l'offre, contact",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>LessonSharing est un organisme de formation IT qui met en relation des formateurs qualifiés avec des établissements et des entreprises, sur le développement, le cloud et la cybersécurité.</p><p>Le site devait installer la crédibilité de l'offre et faciliter la prise de contact.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré un site institutionnel présentant le positionnement et les domaines de formation, avec un parcours de contact clair et une base saine pour le référencement.</p><p>Le site sert de vitrine à l'activité de mise en relation et de formation.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "southclean-detailing-auto",
    sector: "Services",
    year: "2025",
    badge: "Detailing automobile · Site vitrine",
    title: "SouthClean - site vitrine detailing auto",
    heroTitle:
      "Le site de SouthClean, nettoyage et detailing automobile premium.",
    teaser:
      "SouthClean propose du nettoyage et du detailing automobile haut de gamme dans le Gard et l'Hérault. Le site devait traduire ce positionnement premium et générer des demandes de devis. Nous avons conçu une vitrine soignée, centrée sur les prestations et la prise de contact.",
    summary:
      "Site vitrine d'un spécialiste du nettoyage et du detailing automobile dans le Gard et l'Hérault : prestations, positionnement premium et demande de devis.",
    figure: "",
    measure: "",
    halo: "warm",
    accent: "brand",
    featured: false,
    wide: false,
    meta: [
      {
        label: "Périmètre",
        value: "Site vitrine, prestations, demande de devis",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>SouthClean intervient sur le nettoyage et le detailing automobile, avec une exigence de qualité premium et des prestations sur mesure.</p><p>L'enjeu était de présenter une image soignée et de convertir la visite en demande de devis.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré un site vitrine mettant en avant les prestations et le positionnement premium, avec un parcours simple vers le devis gratuit.</p><p>La présentation privilégie la clarté et la mise en valeur du savoir-faire.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "rabbitweb-sites-express",
    sector: "Web",
    year: "2025",
    badge: "Offre web · Landing et productisation",
    title: "RabbitWeb - offre de sites web express",
    heroTitle: "RabbitWeb, un site web professionnel livré en 1 à 4 jours.",
    teaser:
      "RabbitWeb propose des sites web professionnels livrés en un à quatre jours, avec hébergement, emails et maintenance inclus. La page devait rendre l'offre immédiatement compréhensible et déclencher la demande. Nous avons conçu une landing claire, orientée conversion, qui met en avant la rapidité et le caractère clé en main de l'offre.",
    summary:
      "Landing d'une offre de création de sites web express et clé en main à Montpellier : hébergement sécurisé, emails professionnels et maintenance inclus.",
    figure: "",
    measure: "",
    halo: "cool",
    accent: "info",
    featured: false,
    wide: false,
    meta: [
      { label: "Périmètre", value: "Landing d'offre, présentation, contact" },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>RabbitWeb est une offre de création de sites web express et clé en main, pensée pour les petites structures qui veulent une présence en ligne rapide et sans friction.</p><p>L'enjeu de la page était de clarifier la promesse (délai, contenu inclus) et de simplifier le passage à l'action.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré une landing structurée autour de la promesse de rapidité et du caractère tout compris (hébergement, emails, maintenance), avec un parcours de contact direct.</p><p>La page sert de point d'entrée à une offre productisée de sites vitrines.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
  {
    slug: "yoginette-studio-yoga",
    sector: "Bien-être",
    year: "2025",
    badge: "Bien-être · Site vitrine local",
    title: "Yoginette - site d'un studio de yoga",
    heroTitle: "Le site de Yoginette, cours de yoga à Calvisson.",
    teaser:
      "Yoginette propose des cours de yoga à Calvisson et alentours dans une ambiance bienveillante. Le site devait transmettre cette atmosphère, présenter les différents cours et faciliter le premier contact. Nous avons conçu une vitrine sobre et chaleureuse, centrée sur l'ambiance et la prise de contact locale.",
    summary:
      "Site vitrine d'une professeure de yoga (Vinyasa, Yin, Power Yoga) à Calvisson : présentation des cours, de l'approche et prise de contact.",
    figure: "",
    measure: "",
    halo: "warm",
    accent: "brand",
    featured: false,
    wide: false,
    meta: [
      {
        label: "Périmètre",
        value: "Site vitrine local, présentation des cours, contact",
      },
    ],
    chapters: [
      {
        num: "01",
        title: "Contexte",
        text: "<p>Yoginette anime des cours de yoga (Vinyasa, Yin, Power Yoga) et souhaitait une présence en ligne à son image, simple et accueillante.</p><p>L'objectif : donner envie d'essayer un cours et permettre un contact facile, sans complexité inutile.</p>",
      },
      {
        num: "02",
        title: "Notre réponse",
        text: "<p>Nous avons livré un site vitrine léger et lisible, qui présente les cours et l'approche, avec une identité douce et un référencement local sur Calvisson et ses alentours.</p><p>Le contact et l'information pratique sont mis en avant pour transformer la visite en premier cours.</p>",
      },
    ],
    resultsLabel: "Résultats",
    results: [],
    testimonial: { quote: "", name: "", role: "", initials: "" },
    lessons: [],
  },
]

export const featuredCases = caseStudies.filter((study) => study.featured)

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
