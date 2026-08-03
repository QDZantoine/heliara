import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Section } from "@/components/primitives/section"

describe("Container", () => {
  it("prend la largeur de section par défaut", () => {
    const { container } = render(<Container>contenu</Container>)
    expect(container.firstElementChild).toHaveClass("max-w-page")
  })

  it("passe en largeur de lecture à la demande", () => {
    const { container } = render(<Container width="reading">texte</Container>)
    expect(container.firstElementChild).toHaveClass("max-w-reading")
    expect(container.firstElementChild).not.toHaveClass("max-w-page")
  })

  it("porte les marges latérales 20 / 32 / 40 px", () => {
    const { container } = render(<Container>contenu</Container>)
    expect(container.firstElementChild).toHaveClass(
      "px-5",
      "md:px-8",
      "lg:px-10"
    )
  })

  it("transmet les attributs du div sous-jacent", () => {
    const { container } = render(
      <Container id="zone" data-testid="bloc" aria-label="Zone">
        contenu
      </Container>
    )
    const element = container.firstElementChild!
    expect(element).toHaveAttribute("id", "zone")
    expect(element).toHaveAttribute("aria-label", "Zone")
  })

  it("laisse l'appelant surcharger une classe d'espacement", () => {
    const { container } = render(<Container className="px-0">a</Container>)
    expect(container.firstElementChild).toHaveClass("px-0")
    expect(container.firstElementChild).not.toHaveClass("px-5")
  })

  it("se règle par la prop `width`, pas par une classe : c'est l'API du composant", () => {
    // `tailwind-merge` ne connaît pas nos échelles maison, donc il ne dédoublonne
    // pas `max-w-page` contre `max-w-reading` : les deux classes resteraient et
    // c'est l'ordre du CSS qui trancherait. Passer par `width` évite le piège.
    const { container } = render(
      <Container className="max-w-reading">a</Container>
    )
    expect(container.firstElementChild).toHaveClass(
      "max-w-page",
      "max-w-reading"
    )
  })
})

describe("Section", () => {
  it("rend un élément section, positionné pour accueillir un halo", () => {
    const { container } = render(<Section>bloc</Section>)
    const section = container.firstElementChild!
    expect(section.tagName).toBe("SECTION")
    expect(section).toHaveClass("relative")
  })

  it("applique le rythme binaire demandé", () => {
    const dense = render(<Section space="lg">a</Section>)
    expect(dense.container.firstElementChild).toHaveClass("py-16")
    const airy = render(<Section space="sm">b</Section>)
    expect(airy.container.firstElementChild).toHaveClass("py-10")
  })

  it("n'espace pas du tout en `none`", () => {
    const { container } = render(<Section space="none">a</Section>)
    expect(container.firstElementChild?.className).not.toMatch(/\bpy-/)
  })

  it("produit la rupture de fond par la couleur, jamais par un filet seul", () => {
    const inverse = render(<Section tone="inverse">a</Section>)
    expect(inverse.container.firstElementChild).toHaveClass("bg-inverse")
    const surface = render(<Section tone="surface">b</Section>)
    expect(surface.container.firstElementChild).toHaveClass("bg-surface")
  })

  it("ne pose aucun fond en tonalité de page", () => {
    const { container } = render(<Section tone="page">a</Section>)
    expect(container.firstElementChild?.className).not.toMatch(/\bbg-/)
  })
})

describe("Eyebrow", () => {
  it("rend un paragraphe, jamais un titre", () => {
    render(<Eyebrow>Notre méthode</Eyebrow>)
    const eyebrow = screen.getByText("Notre méthode")
    expect(eyebrow.tagName).toBe("P")
    expect(eyebrow).toHaveClass("uppercase")
  })

  it("porte l'orange de texte par défaut", () => {
    render(<Eyebrow>Surtitre</Eyebrow>)
    expect(screen.getByText("Surtitre")).toHaveClass("text-brand-text")
  })

  it("bascule sur les autres tonalités", () => {
    render(<Eyebrow tone="muted">Neutre</Eyebrow>)
    expect(screen.getByText("Neutre")).toHaveClass("text-label")
    render(<Eyebrow tone="inverse">Sur encre</Eyebrow>)
    expect(screen.getByText("Sur encre")).toHaveClass("text-inverse-brand")
  })
})

describe("Halo", () => {
  it("est décoratif : hors de l'arbre d'accessibilité et insensible au pointeur", () => {
    const { container } = render(<Halo />)
    const halo = container.firstElementChild!
    expect(halo).toHaveAttribute("aria-hidden", "true")
    expect(halo).toHaveClass("pointer-events-none", "absolute")
  })

  it("porte le dégradé de la variante demandée", () => {
    for (const variant of ["hero", "warm", "cool", "inverse"] as const) {
      const { container } = render(<Halo variant={variant} />)
      expect(container.firstElementChild?.className, variant).toContain(
        `var(--hel-halo-${variant})`
      )
    }
  })

  it("ne contient aucun texte : c'est une couche de lumière, pas un contenu", () => {
    const { container } = render(<Halo />)
    expect(container.textContent).toBe("")
  })
})
