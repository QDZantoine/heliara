import { describe, expect, it } from "vitest"

import {
  articleCategories,
  articleHref,
  articles,
  categoryTone,
  featuredArticle,
  feedArticles,
  getArticle,
  getRelatedArticles,
} from "@/lib/content/articles"
import {
  caseHref,
  caseSectors,
  caseStudies,
  featuredCases,
  getCase,
  getNextCase,
} from "@/lib/content/cases"
import { clients } from "@/lib/content/clients"
import { guarantees } from "@/lib/content/guarantees"
import {
  expertiseFamilies,
  expertiseHref,
  expertiseServices,
  getExpertiseService,
  getFamily,
  servicesByFamily,
} from "@/lib/content/expertises"
import {
  brandAccent,
  brands,
  complianceBadges,
  groupFigures,
  valueChain,
} from "@/lib/content/group"
import { kpis } from "@/lib/content/kpis"
import { legalNotice, privacyPolicy } from "@/lib/content/legal"
import { commitments, methodPhases, methodPreview } from "@/lib/content/method"
import { budgetRanges, partners, team } from "@/lib/content/team"
import { testimonials } from "@/lib/content/testimonials"

/** Un slug d'URL : minuscules, chiffres, tirets simples, ni début ni fin en tiret. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Les fichiers d'un logo : un seul, ou les deux variantes de thème. */
function fichiersDe(client: (typeof clients)[number]): string[] {
  return typeof client.logo === "string"
    ? [client.logo]
    : [client.logo.light, client.logo.dark]
}

function duplicates(values: string[]) {
  const seen = new Set<string>()
  return values.filter((value) => (seen.has(value) ? true : !seen.add(value)))
}

describe("réalisations", () => {
  /*
    Ce fichier est le repli public : ce qu'il contient s'affiche en ligne le jour où la
    base est muette, et c'est aussi ce que `pnpm db:seed` publie à l'initialisation.
    Les deux gardes ci-dessous portent donc sur du contenu qui peut devenir public sans
    que personne l'ait décidé.
  */

  /*
    Les marqueurs de rédaction ont leur place dans un fichier de reprise, jamais ici.

    Ils sont arrivés en base par `db:import-cases`, qui les signale sans les effacer - et
    ils ont été retirés au moment de rendre les fiches publiables. Ce test empêche qu'un
    prochain import court-circuite cette étape : un « [ajoute un résultat si tu en as un] »
    dans un `heroTitle` serait le grand titre d'une fiche en ligne.
  */
  it("ne laisse aucun marqueur de rédaction dans le repli public", () => {
    const marqueurs =
      /\[à compléter\]|\[à confirmer\]|\(à confirmer\)|ajoute un résultat|20XX/i
    for (const study of caseStudies) {
      const champs = [
        study.title,
        study.heroTitle,
        study.badge,
        study.summary,
        study.teaser,
        study.year,
        study.figure,
        study.measure,
        ...study.meta.flatMap((line) => [line.label, line.value]),
        ...study.chapters.flatMap((chapter) => [
          chapter.title,
          chapter.text,
          chapter.callout ?? "",
        ]),
        ...study.lessons,
      ]
      for (const champ of champs) {
        expect(marqueurs.test(champ), `${study.slug} : ${champ}`).toBe(false)
      }
    }
  })

  /*
    Les six fiches de démonstration nommaient des entreprises qui n'existent pas et leur
    attribuaient des verbatims signés. Elles ont été remplacées par des réalisations
    réelles ; ce test nomme les quatre marques inventées pour qu'un copier-coller de
    gabarit les fasse échouer plutôt que de les remettre en ligne.
  */
  it("ne fait pas revenir les clients inventés du contenu de démonstration", () => {
    const inventes = /Voltéis|Rhône-Nord|Kerlon|Nexa Santé|Ardan/i
    const tout = JSON.stringify(caseStudies)
    expect(inventes.test(tout)).toBe(false)
  })

  it("a des slugs uniques et bien formés", () => {
    expect(duplicates(caseStudies.map((study) => study.slug))).toEqual([])
    for (const study of caseStudies) {
      expect(study.slug, study.title).toMatch(SLUG)
    }
  })

  it("porte sur chaque cas ce dont les cartes et la fiche ont besoin", () => {
    for (const study of caseStudies) {
      expect(study.title, study.slug).not.toBe("")
      expect(study.summary, study.slug).not.toBe("")
      expect(study.teaser, study.slug).not.toBe("")
      expect(study.sector, study.slug).not.toBe("")
      expect(study.year, study.slug).not.toBe("")
      expect(study.chapters.length, study.slug).toBeGreaterThan(0)
    }
  })

  /*
    Le chiffre et sa mesure vont par deux, ou pas du tout.

    Ce test exigeait auparavant les deux sur **chaque** fiche, ce qui encodait la forme
    du contenu de démonstration : ses six fiches inventées portaient toutes un chiffre,
    puisqu'on les avait écrites ainsi. Les nouvelles fiches sont réelles et aucun client
    n'a communiqué de mesure - exiger un chiffre partout pousserait à en inventer un, ce
    qui est exactement ce que le contenu de démonstration avait de faux.

    L'invariant qui reste vrai est le couplage : `figure` seul afficherait une valeur
    sans savoir ce qu'elle mesure, `measure` seul une légende sans valeur.
  */
  it("porte le chiffre et sa mesure ensemble, ou aucun des deux", () => {
    for (const study of caseStudies) {
      expect(Boolean(study.figure), study.slug).toBe(Boolean(study.measure))
    }
  })

  /*
    Un témoignage est tout ou rien, la même règle que `withTestimonialRule` côté schéma.
    Aucune fiche n'en porte aujourd'hui : les neuf verbatims restent à demander à leurs
    auteurs et à faire valider par écrit.
  */
  it("ne porte un témoignage qu'au complet", () => {
    for (const study of caseStudies) {
      const parts = [
        study.testimonial.quote,
        study.testimonial.name,
        study.testimonial.role,
      ].map(Boolean)
      expect(
        parts.every(Boolean) || parts.every((one) => !one),
        study.slug
      ).toBe(true)
    }
  })

  it("numérote les chapitres de chaque cas sans trou ni doublon", () => {
    for (const study of caseStudies) {
      const nums = study.chapters.map((chapter) => chapter.num)
      expect(nums, study.slug).toEqual(
        Array.from({ length: nums.length }, (_, i) =>
          String(i + 1).padStart(2, "0")
        )
      )
    }
  })

  it("expose au moins une mise en avant pour l'accueil", () => {
    expect(featuredCases.length).toBeGreaterThan(0)
    expect(featuredCases.every((study) => study.featured)).toBe(true)
  })

  describe("caseSectors", () => {
    it("commence par « Tous » puis liste chaque secteur une seule fois", () => {
      expect(caseSectors[0]).toBe("Tous")
      expect(duplicates([...caseSectors])).toEqual([])
    })

    it("ne propose aucun filtre qui donnerait une grille vide", () => {
      for (const sector of caseSectors.slice(1)) {
        expect(
          caseStudies.some((study) => study.sector === sector),
          sector
        ).toBe(true)
      }
    })
  })

  describe("getCase", () => {
    it("retrouve un cas par son slug", () => {
      expect(getCase(caseStudies[0].slug)).toBe(caseStudies[0])
    })

    it("renvoie undefined sur un slug inconnu, ce qui déclenche le notFound de la page", () => {
      expect(getCase("nexiste-pas")).toBeUndefined()
    })
  })

  describe("getNextCase", () => {
    it("passe au cas suivant", () => {
      expect(getNextCase(caseStudies[0].slug)).toBe(caseStudies[1])
    })

    it("boucle sur le premier après le dernier : aucune impasse en fin de fiche", () => {
      const last = caseStudies[caseStudies.length - 1]
      expect(getNextCase(last.slug)).toBe(caseStudies[0])
    })

    it("ne se renvoie jamais lui-même", () => {
      for (const study of caseStudies) {
        expect(getNextCase(study.slug)?.slug, study.slug).not.toBe(study.slug)
      }
    })

    it("renvoie undefined sur un slug inconnu", () => {
      expect(getNextCase("nexiste-pas")).toBeUndefined()
    })
  })

  it("caseHref pointe vers la route existante", () => {
    expect(caseHref("refonte")).toBe("/realisations/refonte")
  })
})

describe("expertises", () => {
  it("a des slugs uniques et bien formés, familles comme services", () => {
    expect(duplicates(expertiseServices.map((s) => s.slug))).toEqual([])
    expect(duplicates(expertiseFamilies.map((f) => f.slug))).toEqual([])
    for (const service of expertiseServices) {
      expect(service.slug, service.title).toMatch(SLUG)
    }
  })

  it("rattache chaque service à une famille qui existe", () => {
    const known = new Set(expertiseFamilies.map((family) => family.slug))
    for (const service of expertiseServices) {
      expect(known.has(service.family), service.slug).toBe(true)
    }
  })

  it("donne à chaque famille au moins un service, sinon sa page serait vide", () => {
    for (const { family, services } of servicesByFamily) {
      expect(services.length, family.slug).toBeGreaterThan(0)
    }
  })

  it("répartit tous les services sans en perdre ni en dupliquer", () => {
    const grouped = servicesByFamily.flatMap((entry) => entry.services)
    expect(grouped).toHaveLength(expertiseServices.length)
    expect(new Set(grouped).size).toBe(expertiseServices.length)
  })

  it("garde le nom de famille comme slug de service : c'est ce qui rend la nav valide", () => {
    // `expertiseNav` fabrique ses liens avec `expertiseHref(family.slug)`, et la
    // route /expertises/[slug] ne connaît que les services. Les deux jeux de
    // slugs doivent donc se recouvrir.
    for (const family of expertiseFamilies) {
      expect(getExpertiseService(family.slug), family.slug).toBeDefined()
    }
  })

  it("getFamily retrouve une famille, et rien sur un slug inconnu", () => {
    expect(getFamily(expertiseFamilies[0].slug)).toBe(expertiseFamilies[0])
    expect(
      getFamily("inconnue" as (typeof expertiseFamilies)[number]["slug"])
    ).toBeUndefined()
  })

  it("expertiseHref pointe vers la route existante", () => {
    expect(expertiseHref("ux-ui")).toBe("/expertises/ux-ui")
  })
})

describe("articles", () => {
  it("a des slugs uniques et bien formés", () => {
    expect(duplicates(articles.map((article) => article.slug))).toEqual([])
    for (const article of articles) {
      expect(article.slug, article.title).toMatch(SLUG)
    }
  })

  it("date chaque article en ISO, pour que le tri et le sitemap soient justes", () => {
    for (const article of articles) {
      expect(article.publishedAt, article.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(article.publishedAt)), article.slug).toBe(
        false
      )
    }
  })

  it("donne un corps non vide à chaque article", () => {
    for (const article of articles) {
      expect(article.body.length, article.slug).toBeGreaterThan(0)
    }
  })

  it("connaît une teinte pour chaque catégorie utilisée", () => {
    for (const article of articles) {
      expect(categoryTone[article.category], article.category).toBeTruthy()
    }
  })

  it("n'a qu'un seul article mis en avant, et le flux ne le reprend pas", () => {
    expect(articles.filter((article) => article.featured)).toHaveLength(1)
    expect(feedArticles).not.toContain(featuredArticle)
    expect(feedArticles).toHaveLength(articles.length - 1)
  })

  describe("articleCategories", () => {
    it("commence par « Tout » puis liste chaque catégorie une seule fois", () => {
      expect(articleCategories[0]).toBe("Tout")
      expect(duplicates([...articleCategories])).toEqual([])
    })

    it("ne propose aucun filtre qui donnerait un flux vide", () => {
      for (const category of articleCategories.slice(1)) {
        expect(
          feedArticles.some((article) => article.category === category) ||
            featuredArticle.category === category,
          category
        ).toBe(true)
      }
    })
  })

  describe("getRelatedArticles", () => {
    it("propose deux lectures par défaut", () => {
      expect(getRelatedArticles(articles[0].slug)).toHaveLength(2)
    })

    it("n'inclut jamais l'article courant", () => {
      for (const article of articles) {
        const related = getRelatedArticles(article.slug, articles.length)
        expect(
          related.map((r) => r.slug),
          article.slug
        ).not.toContain(article.slug)
      }
    })

    it("préfère la même catégorie, et retombe sur le plus récent à égalité", () => {
      const source = articles.find((article) =>
        articles.some(
          (other) =>
            other.slug !== article.slug && other.category === article.category
        )
      )
      expect(source, "il faut deux articles d'une même catégorie").toBeDefined()
      const first = getRelatedArticles(source!.slug, 1)[0]
      expect(first.category).toBe(source!.category)
    })

    it("respecte le nombre demandé", () => {
      expect(getRelatedArticles(articles[0].slug, 1)).toHaveLength(1)
      expect(getRelatedArticles(articles[0].slug, 3)).toHaveLength(3)
    })

    it("répond quand même sur un slug inconnu, sans planter", () => {
      expect(getRelatedArticles("nexiste-pas")).toHaveLength(2)
    })
  })

  describe("getArticle", () => {
    it("retrouve un article par son slug", () => {
      expect(getArticle(articles[0].slug)).toBe(articles[0])
    })

    it("renvoie undefined sur un slug inconnu", () => {
      expect(getArticle("nexiste-pas")).toBeUndefined()
    })
  })

  it("articleHref pointe vers la route existante", () => {
    expect(articleHref("dette-technique")).toBe("/ressources/dette-technique")
  })
})

describe("groupe", () => {
  it("présente trois marques sœurs", () => {
    expect(brands).toHaveLength(3)
    expect(duplicates(brands.map((brand) => brand.name))).toEqual([])
  })

  it("connaît une teinte pour chaque marque", () => {
    for (const brand of brands) {
      expect(brandAccent[brand.accent], brand.name).toBeTruthy()
    }
  })

  it("donne à chaque marque un logo dimensionné, servi depuis public/", () => {
    for (const brand of brands) {
      expect(brand.logo.src, brand.name).toMatch(/^\/logos\/.+\.(svg|png)$/)
      // Les dimensions sont indispensables : sans elles, next/image ne peut pas
      // réserver la place et l'arrivée du logo décalerait la mise en page.
      expect(brand.logo.width, brand.name).toBeGreaterThan(0)
      expect(brand.logo.height, brand.name).toBeGreaterThan(0)
    }
  })

  it("ordonne la chaîne de valeur en trois temps, chacun rattaché à une marque", () => {
    expect(valueChain).toHaveLength(3)
    const names = new Set(brands.map((brand) => brand.name))
    for (const step of valueChain) {
      expect(names.has(step.brand), step.brand).toBe(true)
    }
  })

  it("associe une illustration à chaque temps de la chaîne", () => {
    for (const step of valueChain) {
      expect(step.scene.src, step.brand).toMatch(/^\/.+\.json$/)
    }
  })

  it("chiffre les preuves et badge la conformité", () => {
    expect(groupFigures.length).toBeGreaterThan(0)
    expect(complianceBadges.length).toBeGreaterThan(0)
    for (const figure of groupFigures) {
      expect(figure.value, figure.label).not.toBe("")
    }
  })
})

describe("méthode", () => {
  it("condense les 8 temps en 4 sur l'accueil : la maquette gagne sur la fiche UX", () => {
    expect(methodPhases).toHaveLength(8)
    expect(methodPreview).toHaveLength(4)
  })

  it("numérote les phases de 01 à 08, dans l'ordre", () => {
    expect(methodPhases.map((phase) => phase.num)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
    ])
  })

  it("nomme un livrable pour chaque phase : c'est ce qui rend la méthode vérifiable", () => {
    for (const phase of methodPhases) {
      expect(phase.title, phase.num).not.toBe("")
      expect(phase.text, phase.num).not.toBe("")
      expect(phase.deliverable, phase.num).not.toBe("")
    }
  })

  it("borne les jauges de chaque phase entre 0 et 100 %", () => {
    for (const phase of methodPhases) {
      expect(phase.gauges.length, phase.num).toBeGreaterThan(0)
      for (const gauge of phase.gauges) {
        expect(gauge.width, `${phase.num} / ${gauge.label}`).toBeGreaterThan(0)
        expect(
          gauge.width,
          `${phase.num} / ${gauge.label}`
        ).toBeLessThanOrEqual(100)
      }
    }
  })

  it("numérote l'aperçu de l'accueil comme les quatre premiers temps", () => {
    expect(methodPreview.map((step) => step.num)).toEqual([
      "01",
      "02",
      "03",
      "04",
    ])
  })

  it("liste des engagements titrés et explicités", () => {
    expect(commitments.length).toBeGreaterThan(0)
    for (const commitment of commitments) {
      expect(commitment.title).not.toBe("")
      expect(commitment.text, commitment.title).not.toBe("")
    }
  })
})

describe("équipe et contact", () => {
  it("compte des associés parmi l'équipe", () => {
    expect(partners.length).toBeGreaterThan(0)
    expect(team.length).toBeGreaterThanOrEqual(partners.length)
  })

  it("donne des initiales cohérentes avec le nom", () => {
    for (const person of team) {
      expect(person.initials, person.name).toMatch(/^[A-ZÀ-Ý]{2}$/)
    }
  })

  it("propose des enveloppes distinctes au formulaire", () => {
    expect(budgetRanges.length).toBeGreaterThan(1)
    expect(duplicates([...budgetRanges])).toEqual([])
  })
})

describe("preuve sociale", () => {
  /**
   * Le test précédent exigeait des témoignages non vides, ce qui garantissait surtout
   * que trois verbatims inventés restent en place. Ce qui compte est l'inverse : s'il y
   * en a, chacun doit être attribuable à une personne identifiée. Une liste vide est un
   * état valide - et c'est l'état actuel.
   */
  it("attribue chaque témoignage à une personne identifiée, s'il y en a", () => {
    for (const testimonial of testimonials) {
      expect(testimonial.quote, testimonial.name).not.toBe("")
      expect(testimonial.name).not.toBe("")
      expect(testimonial.role, testimonial.name).not.toBe("")
    }
  })

  /**
   * Chaque référence du bandeau porte ce qu'il faut pour être affichée et retrouvée.
   *
   * Le `site` n'est pas rendu mais il est vérifié : c'est lui qui garde la provenance de
   * chaque logo traçable, et une entrée sans source est une autorisation qu'on ne saura
   * plus où redemander.
   */
  it("porte un nom, un logo et une source pour chaque référence", () => {
    const noms = clients.map((one) => one.name)
    expect(duplicates(noms)).toEqual([])
    for (const client of clients) {
      expect(client.name).not.toBe("")
      expect(client.site, client.name).toMatch(/^https:\/\//)
      // Une chaîne, ou une paire de variantes par thème pour une marque monochrome.
      for (const fichier of fichiersDe(client)) {
        expect(fichier, client.name).toMatch(/^\/trusts-logos\//)
      }
    }
  })

  /**
   * Le fond transparent n'est pas une préférence esthétique.
   *
   * La bande pose les logos sur la surface de la page : un fichier opaque y dessine un
   * rectangle. Le JPEG n'a pas de canal alpha, donc il ne peut pas convenir - et le
   * dossier en contient justement un, doublon d'un PNG qui, lui, va bien.
   */
  it("n'accepte aucun logo dans un format sans transparence", () => {
    for (const client of clients) {
      for (const fichier of fichiersDe(client)) {
        expect(fichier, client.name).not.toMatch(/\.(jpe?g)$/i)
      }
    }
  })

  it("énonce chaque principe avec sa valeur et son explication", () => {
    expect(kpis.length).toBeGreaterThan(0)
    for (const kpi of kpis) {
      expect(kpi.value, kpi.label).not.toBe("")
      expect(kpi.label).not.toBe("")
      // La description porte ce que la valeur seule ne dit pas : « 0 » n'a de sens
      // qu'accompagné de « verrou fournisseur » et de sa phrase.
      expect(kpi.description, kpi.label).not.toBe("")
    }
  })

  it("garantit des artefacts non vides dans le bandeau de l'accueil", () => {
    expect(guarantees.length).toBeGreaterThan(0)
    for (const guarantee of guarantees) {
      expect(guarantee).not.toBe("")
    }
  })

  /**
   * Les deux bandes de l'accueil ne doivent pas dire la même chose.
   *
   * Le défaut est arrivé une fois : quatre des sept lignes du bandeau reprenaient mot
   * pour mot les quatre principes de la section suivante - « développement sur
   * mesure », « pensé pour évoluer », « aucune dépendance fournisseur ». Le visiteur
   * lisait deux fois la même promesse sur une page, ce qui affaiblit les deux
   * sections.
   *
   * Le contrôle porte sur les mots pleins partagés plutôt que sur l'égalité des
   * chaînes : c'est la reformulation qui pose problème, pas la copie exacte, et une
   * copie exacte ne serait jamais écrite.
   */
  it("ne fait pas redire aux garanties ce que les principes affirment déjà", () => {
    const banal = new Set([
      "pour",
      "dans",
      "avec",
      "chaque",
      "votre",
      "vos",
      "vous",
      "une",
      "des",
      "les",
      "aucun",
      "aucune",
    ])
    const words = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3 && !banal.has(word))

    const principles = new Set(kpis.flatMap((kpi) => words(kpi.label)))

    for (const guarantee of guarantees) {
      const shared = words(guarantee).filter((word) => principles.has(word))
      expect(shared, `« ${guarantee} » reprend un principe de S7`).toEqual([])
    }
  })
})

describe("pages légales", () => {
  it("structure les deux pages en sections titrées, chacune portant du contenu", () => {
    for (const [name, sections] of [
      ["mentions légales", legalNotice],
      ["confidentialité", privacyPolicy],
    ] as const) {
      expect(sections.length, name).toBeGreaterThan(0)
      for (const section of sections) {
        expect(section.title, name).not.toBe("")
        // Une section porte des paragraphes, un tableau d'identification, ou
        // les deux - mais jamais rien : elle s'afficherait comme un titre seul.
        const paragraphs = section.paragraphs?.length ?? 0
        const rows = section.rows?.length ?? 0
        expect(paragraphs + rows, `${name} / ${section.title}`).toBeGreaterThan(
          0
        )
      }
    }
  })

  it("ne répète pas un titre de section dans une même page", () => {
    for (const sections of [legalNotice, privacyPolicy]) {
      expect(duplicates(sections.map((section) => section.title))).toEqual([])
    }
  })

  it("libelle chaque ligne d'identification et lui donne une valeur", () => {
    for (const sections of [legalNotice, privacyPolicy]) {
      for (const row of sections.flatMap((section) => section.rows ?? [])) {
        expect(row.label).not.toBe("")
        expect(row.value, row.label).not.toBe("")
      }
    }
  })
})
