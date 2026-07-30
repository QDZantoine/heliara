import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CaseGrid } from "@/components/realisations/case-grid"
import { ArticleFeed } from "@/components/ressources/article-feed"
import { Faq } from "@/components/sections/faq"
import { articleCategories, feedArticles } from "@/lib/content/articles"
import { caseSectors, caseStudies } from "@/lib/content/cases"

/** Le premier secteur réel, celui d'au moins un cas. */
const sector = caseSectors[1]
const inSector = caseStudies.filter((study) => study.sector === sector)

describe("CaseGrid", () => {
  const setup = () =>
    render(<CaseGrid cases={caseStudies} sectors={[...caseSectors]} />)

  it("affiche tous les cas au premier rendu", () => {
    setup()
    expect(screen.getAllByRole("listitem")).toHaveLength(caseStudies.length)
  })

  it("désigne le filtre actif par aria-pressed, pas seulement par la couleur", () => {
    setup()
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: sector })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("réduit la grille au secteur choisi", async () => {
    setup()
    await userEvent.click(screen.getByRole("button", { name: sector }))
    expect(screen.getAllByRole("listitem")).toHaveLength(inSector.length)
    expect(screen.getByRole("button", { name: sector })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("revient à la grille complète en repassant par « Tous »", async () => {
    setup()
    await userEvent.click(screen.getByRole("button", { name: sector }))
    await userEvent.click(screen.getByRole("button", { name: "Tous" }))
    expect(screen.getAllByRole("listitem")).toHaveLength(caseStudies.length)
  })

  it("annonce le décompte dans une région vivante, accordé en nombre", async () => {
    setup()
    const count = screen.getByRole("status")
    expect(count).toHaveAttribute("aria-live", "polite")
    expect(count).toHaveTextContent(`${caseStudies.length} réalisations`)

    await userEvent.click(screen.getByRole("button", { name: sector }))
    expect(screen.getByRole("status")).toHaveTextContent(
      inSector.length > 1
        ? `${inSector.length} réalisations · secteur ${sector}`
        : `${inSector.length} réalisation · secteur ${sector}`
    )
  })

  it("ne mentionne aucun secteur quand tout est affiché", () => {
    setup()
    expect(screen.getByRole("status")).not.toHaveTextContent("secteur")
  })

  it("donne à chaque carte un lien vers sa fiche", () => {
    setup()
    for (const study of caseStudies) {
      expect(
        screen.getByRole("link", { name: new RegExp(study.title) })
      ).toHaveAttribute("href", `/realisations/${study.slug}`)
    }
  })

  it("groupe les filtres avec un libellé, et les garde tactiles à 44 px", () => {
    setup()
    const group = screen.getByRole("group", { name: "Filtrer par secteur" })
    expect(group).toBeInTheDocument()
    for (const button of screen.getAllByRole("button")) {
      expect(button, button.textContent ?? "").toHaveClass("h-11")
    }
  })

  it("n'élargit une carte que dans la grille complète", async () => {
    const wide = caseStudies.find((study) => study.wide)
    if (!wide) {
      return
    }
    setup()
    const item = () =>
      screen.getByRole("link", { name: new RegExp(wide.title) }).closest("li")!

    expect(item()).toHaveClass("md:col-span-2")
    await userEvent.click(screen.getByRole("button", { name: wide.sector }))
    expect(item()).not.toHaveClass("md:col-span-2")
  })

  it("affiche une grille vide sans casser quand aucun cas ne correspond", () => {
    render(<CaseGrid cases={[]} sectors={["Tous"]} />)
    expect(screen.queryAllByRole("listitem")).toHaveLength(0)
    expect(screen.getByText("0 réalisation")).toBeInTheDocument()
  })
})

describe("ArticleFeed", () => {
  const category = articleCategories.find((name) =>
    feedArticles.some((article) => article.category === name)
  )!
  const inCategory = feedArticles.filter(
    (article) => article.category === category
  )

  const setup = () =>
    render(
      <ArticleFeed
        articles={feedArticles}
        categories={[...articleCategories]}
      />
    )

  it("affiche tout le flux au premier rendu", () => {
    setup()
    expect(screen.getAllByRole("listitem")).toHaveLength(feedArticles.length)
  })

  it("filtre par catégorie et met à jour le décompte", async () => {
    setup()
    await userEvent.click(screen.getByRole("button", { name: category }))
    expect(screen.getAllByRole("listitem")).toHaveLength(inCategory.length)
    expect(screen.getByText(/article/)).toHaveTextContent(
      category.toLowerCase()
    )
  })

  it("désigne le filtre actif par aria-pressed", async () => {
    setup()
    expect(screen.getByRole("button", { name: "Tout" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    await userEvent.click(screen.getByRole("button", { name: category }))
    expect(screen.getByRole("button", { name: "Tout" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("donne à chaque carte son lien, sa catégorie et son temps de lecture", () => {
    setup()
    for (const article of feedArticles) {
      const link = screen.getByRole("link", {
        name: new RegExp(article.title.slice(0, 30)),
      })
      expect(link).toHaveAttribute("href", `/ressources/${article.slug}`)
      expect(link).toHaveTextContent(article.readingTime)
      expect(link).toHaveTextContent(article.author)
    }
  })

  it("groupe les filtres avec un libellé", () => {
    setup()
    expect(
      screen.getByRole("group", { name: "Filtrer par catégorie" })
    ).toBeInTheDocument()
  })
})

describe("Faq", () => {
  const items = [
    { question: "Combien de temps ?", answer: "Six semaines pour un cadrage." },
    { question: "Et si ça glisse ?", answer: "Le glissement est signalé." },
  ]

  it("bâtit chaque entrée sur details/summary : ouvrable sans JavaScript", () => {
    render(<Faq items={items} />)
    for (const item of items) {
      const summary = screen.getByText(item.question)
      expect(summary.tagName).toBe("SUMMARY")
      expect(summary.closest("details")).not.toBeNull()
    }
  })

  it("laisse toutes les réponses dans le document, donc trouvables à la recherche", () => {
    render(<Faq items={items} />)
    for (const item of items) {
      expect(screen.getByText(item.answer)).toBeInTheDocument()
    }
  })

  it("s'ouvre au clic, et une entrée ouverte n'en referme pas une autre", async () => {
    render(<Faq items={items} />)
    const [first, second] = items.map((item) =>
      screen.getByText(item.question).closest("details")!
    )
    expect(first.open).toBe(false)

    await userEvent.click(screen.getByText(items[0].question))
    expect(first.open).toBe(true)

    await userEvent.click(screen.getByText(items[1].question))
    expect(first.open).toBe(true)
    expect(second.open).toBe(true)
  })

  it("titre la section, avec un libellé par défaut", () => {
    render(<Faq items={items} />)
    expect(
      screen.getByRole("heading", { name: "Vos questions, nos réponses" })
    ).toBeInTheDocument()
  })

  it("accepte un titre propre", () => {
    render(<Faq title="Objections fréquentes" items={items} />)
    expect(
      screen.getByRole("heading", { name: "Objections fréquentes" })
    ).toBeInTheDocument()
  })

  it("n'utilise qu'un h2 : le h1 reste celui de la page", () => {
    render(<Faq items={items} />)
    expect(screen.getByRole("heading").tagName).toBe("H2")
  })
})
