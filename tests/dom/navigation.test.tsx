import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { MobileMenu } from "@/components/layout/mobile-menu"
import { NavLink } from "@/components/layout/nav-link"
import { cta, group, legalNav, mainNav } from "@/lib/site"
import { navigation } from "@/tests/setup-dom"

describe("NavLink", () => {
  it("marque la page courante avec aria-current", () => {
    navigation.pathname = "/methode"
    render(<NavLink href="/methode">Méthode</NavLink>)
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page")
  })

  it("ne marque pas une autre page", () => {
    navigation.pathname = "/contact"
    render(<NavLink href="/methode">Méthode</NavLink>)
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-current")
  })

  it("marque aussi la branche : une fiche allume son entrée de nav", () => {
    navigation.pathname = "/realisations/pilotage-production"
    render(<NavLink href="/realisations">Réalisations</NavLink>)
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page")
  })

  it("n'allume l'accueil que sur l'accueil, jamais sur toute route", () => {
    navigation.pathname = "/methode"
    const { unmount } = render(<NavLink href="/">Accueil</NavLink>)
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-current")
    unmount()

    navigation.pathname = "/"
    render(<NavLink href="/">Accueil</NavLink>)
    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page")
  })

  it("n'ajoute les classes actives que sur la branche active", () => {
    navigation.pathname = "/methode"
    const active = render(
      <NavLink href="/methode" className="base" activeClassName="allumé">
        Méthode
      </NavLink>
    )
    expect(active.getByRole("link")).toHaveClass("base", "allumé")
    active.unmount()

    navigation.pathname = "/contact"
    render(
      <NavLink href="/methode" className="base" activeClassName="allumé">
        Méthode
      </NavLink>
    )
    expect(screen.getByRole("link")).toHaveClass("base")
    expect(screen.getByRole("link")).not.toHaveClass("allumé")
  })
})

describe("MobileMenu", () => {
  it("n'affiche qu'un déclencheur au repos", () => {
    render(<MobileMenu />)
    expect(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("ouvre un dialogue modal, ce que Base UI fournit avec son piège à focus", async () => {
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("reprend les cinq entrées principales, numérotées", async () => {
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    await screen.findByRole("dialog")

    for (const item of mainNav) {
      expect(
        screen.getByRole("link", { name: new RegExp(item.label) })
      ).toHaveAttribute("href", item.href)
    }
    expect(screen.getByText("01")).toBeInTheDocument()
    expect(screen.getByText("05")).toBeInTheDocument()
  })

  it("porte le CTA primaire et l'endossement de groupe, sans nommer le holding", async () => {
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    await screen.findByRole("dialog")

    expect(
      screen.getByRole("link", { name: cta.primary.label })
    ).toHaveAttribute("href", cta.primary.href)
    expect(
      screen.getByRole("link", { name: group.endorsement })
    ).toHaveAttribute("href", group.href)
    expect(
      screen.getByRole("link", { name: legalNav[0].label })
    ).toHaveAttribute("href", legalNav[0].href)
  })

  it("marque l'entrée courante", async () => {
    navigation.pathname = "/realisations/pilotage-production"
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    await screen.findByRole("dialog")

    expect(screen.getByRole("link", { name: /Réalisations/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: /Méthode/ })).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("se referme au clic sur un lien : la transition de page reste lisible", async () => {
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    await screen.findByRole("dialog")

    await userEvent.click(screen.getByRole("link", { name: /Méthode/ }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("se referme par le bouton dédié", async () => {
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    await screen.findByRole("dialog")

    await userEvent.click(
      screen.getByRole("button", { name: "Fermer le menu" })
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("se referme par Échap, sans une ligne de code de notre côté", async () => {
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    await screen.findByRole("dialog")

    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("propose un rebond vers toutes les expertises : aucune impasse", async () => {
    render(<MobileMenu />)
    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le menu" })
    )
    await screen.findByRole("dialog")

    expect(
      screen.getByRole("link", { name: "Toutes les expertises" })
    ).toHaveAttribute("href", "/expertises")
  })
})
