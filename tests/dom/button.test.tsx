import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button, ButtonLink, buttonVariants } from "@/components/ui/button"

describe("buttonVariants", () => {
  it("est tactile par défaut : 44 px, la cible minimale", () => {
    expect(buttonVariants()).toContain("h-11")
  })

  it("respecte l'échelle de tailles annoncée", () => {
    expect(buttonVariants({ size: "sm" })).toContain("h-9")
    expect(buttonVariants({ size: "md" })).toContain("h-11")
    expect(buttonVariants({ size: "lg" })).toContain("h-12")
    expect(buttonVariants({ size: "xl" })).toContain("h-13")
  })

  it("rend la variante `block` pleine largeur, pour l'empilement sous 640 px", () => {
    expect(buttonVariants({ size: "block" })).toContain("w-full")
  })

  it("prend la variante de marque par défaut", () => {
    expect(buttonVariants()).toContain("bg-brand-solid")
  })

  it("n'utilise jamais l'orange vif comme fond de bouton", () => {
    // #E9591F ne donne que 3,5:1 avec du blanc. Le fond part de `brand-solid`
    // (#C9481A, 4,8:1) et s'éclaircit au survol.
    const brand = buttonVariants({ variant: "brand" })
    expect(brand).toContain("bg-brand-solid")
    expect(brand).toContain("hover:bg-brand-solid-hover")
    // `bg-brand` tout court, et non le préfixe de `bg-brand-solid`.
    expect(brand).not.toMatch(/bg-brand(?![\w-])/)
  })

  it("porte les couleurs d'encre sur les variantes inversées", () => {
    expect(buttonVariants({ variant: "inverse" })).toContain("bg-inverse-brand")
    expect(buttonVariants({ variant: "inverse-ghost" })).toContain(
      "text-inverse-fg-muted"
    )
  })

  it("n'ajoute aucun anneau de focus : la règle globale s'en charge", () => {
    for (const variant of [
      "brand",
      "secondary",
      "ghost",
      "link",
      "outline",
      "destructive",
      "inverse",
      "inverse-ghost",
    ] as const) {
      expect(buttonVariants({ variant }), variant).not.toMatch(
        /focus-visible:|\bring-/
      )
    }
  })

  it("anime dans la fenêtre de la DA, 100 à 360 ms, et sans rebond", () => {
    const classes = buttonVariants()
    expect(classes).toContain("duration-[160ms]")
    expect(classes).toContain("ease-expo")
  })

  it("laisse l'appelant compléter les classes", () => {
    expect(buttonVariants({ className: "mt-4" })).toContain("mt-4")
  })
})

describe("Button", () => {
  it("rend un bouton et déclenche l'action au clic", async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Envoyer</Button>)
    const button = screen.getByRole("button", { name: "Envoyer" })
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("porte data-slot, pour être ciblable en CSS", () => {
    render(<Button>Envoyer</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button")
  })

  it("ne déclenche rien quand il est désactivé", async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Envoi…
      </Button>
    )
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("accepte le type submit, ce dont les formulaires dépendent", () => {
    render(<Button type="submit">Envoyer</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit")
  })
})

describe("ButtonLink", () => {
  it("est un lien, pas un bouton : navigation et non action", () => {
    render(<ButtonLink href="/contact">Parlons de votre projet</ButtonLink>)
    const link = screen.getByRole("link", { name: "Parlons de votre projet" })
    expect(link).toHaveAttribute("href", "/contact")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("porte le même habillage qu'un bouton", () => {
    render(<ButtonLink href="/contact">Contact</ButtonLink>)
    const link = screen.getByRole("link")
    expect(link).toHaveClass("bg-brand-solid", "h-11")
    expect(link).toHaveAttribute("data-slot", "button-link")
  })

  it("accepte variante et taille", () => {
    render(
      <ButtonLink href="/realisations" variant="secondary" size="lg">
        Voir nos réalisations
      </ButtonLink>
    )
    const link = screen.getByRole("link")
    expect(link).toHaveClass("bg-surface", "h-12")
  })
})
