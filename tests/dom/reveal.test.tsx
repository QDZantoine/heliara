import { render, screen } from "@testing-library/react"
import { act } from "react"
import { describe, expect, it, vi } from "vitest"

import { Reveal } from "@/components/primitives/reveal"
import { intersect, media, observers } from "@/tests/setup-dom"

describe("Reveal", () => {
  it("s'affiche en attente et se révèle à l'entrée dans le champ", () => {
    render(<Reveal>bloc</Reveal>)
    const block = screen.getByText("bloc")
    expect(block).toHaveAttribute("data-reveal", "pending")

    act(() => intersect())
    expect(block).toHaveAttribute("data-reveal", "in")
  })

  it("ne se révèle pas tant que le bloc reste hors du champ", () => {
    render(<Reveal>bloc</Reveal>)
    act(() => intersect(false))
    expect(screen.getByText("bloc")).toHaveAttribute("data-reveal", "pending")
  })

  it("cesse d'observer après la révélation : rien ne tourne ensuite", () => {
    render(<Reveal>bloc</Reveal>)
    act(() => intersect())
    expect(observers[0].disconnected).toBe(true)
  })

  it("cesse d'observer au démontage", () => {
    const { unmount } = render(<Reveal>bloc</Reveal>)
    unmount()
    expect(observers[0].disconnected).toBe(true)
  })

  it("égrène une grille avec un délai de transition, sans autre style perdu", () => {
    render(
      <Reveal delay={150} style={{ color: "red" }}>
        carte
      </Reveal>
    )
    const block = screen.getByText("carte")
    expect(block.style.transitionDelay).toBe("150ms")
    expect(block.style.color).toBe("red")
  })

  it("ne pose aucun délai à zéro, ce qui est le cas le plus courant", () => {
    render(<Reveal>bloc</Reveal>)
    expect(screen.getByText("bloc").style.transitionDelay).toBe("")
  })

  describe("sous prefers-reduced-motion", () => {
    it("révèle immédiatement, sans attendre le champ", () => {
      media.reducedMotion = true
      render(<Reveal>bloc</Reveal>)
      expect(screen.getByText("bloc")).toHaveAttribute("data-reveal", "in")
    })

    it("n'installe pas d'observateur", () => {
      media.reducedMotion = true
      render(<Reveal>bloc</Reveal>)
      expect(observers).toHaveLength(0)
    })
  })

  describe("en immediate, pour un bloc déjà dans le champ", () => {
    it("est peint d'emblée, sans passer par l'état en attente", () => {
      // C'est ce qui rend le bloc éligible au LCP : masqué jusqu'à
      // l'hydratation, il n'est mesuré qu'une fois le JavaScript exécuté.
      render(<Reveal immediate>hero</Reveal>)
      expect(screen.getByText("hero")).toHaveAttribute(
        "data-reveal",
        "entering"
      )
    })

    it("n'installe aucun observateur : il n'y a rien à attendre", () => {
      render(<Reveal immediate>hero</Reveal>)
      expect(observers).toHaveLength(0)
    })

    it("décale l'animation et non la transition, sans perdre les autres styles", () => {
      render(
        <Reveal immediate delay={120} style={{ color: "red" }}>
          hero
        </Reveal>
      )
      const block = screen.getByText("hero")
      expect(block.style.animationDelay).toBe("120ms")
      expect(block.style.transitionDelay).toBe("")
      expect(block.style.color).toBe("red")
    })

    it("garde son état même sous prefers-reduced-motion, que le CSS neutralise", () => {
      media.reducedMotion = true
      render(<Reveal immediate>hero</Reveal>)
      expect(screen.getByText("hero")).toHaveAttribute(
        "data-reveal",
        "entering"
      )
      expect(observers).toHaveLength(0)
    })
  })

  it("révèle immédiatement quand IntersectionObserver n'existe pas", () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    render(<Reveal>bloc</Reveal>)
    expect(screen.getByText("bloc")).toHaveAttribute("data-reveal", "in")
  })

  describe("pendant une transition de page", () => {
    it("coupe son fondu : le voile est déjà le geste, on n'en empile pas un second", () => {
      document.documentElement.setAttribute("data-curtain", "reveal")
      render(<Reveal>bloc</Reveal>)
      act(() => intersect())
      const block = screen.getByText("bloc")
      expect(block).toHaveAttribute("data-reveal-now")
      expect(block).toHaveAttribute("data-reveal", "in")
    })

    it("décide au moment de révéler et non au montage : le scroll garde son fondu", () => {
      // Le bloc est monté pendant la transition, mais n'entre dans le champ
      // qu'après. Il doit alors garder son apparition au scroll.
      document.documentElement.setAttribute("data-curtain", "reveal")
      render(<Reveal>bloc</Reveal>)
      document.documentElement.removeAttribute("data-curtain")

      act(() => intersect())
      const block = screen.getByText("bloc")
      expect(block).not.toHaveAttribute("data-reveal-now")
      expect(block).toHaveAttribute("data-reveal", "in")
    })
  })
})
