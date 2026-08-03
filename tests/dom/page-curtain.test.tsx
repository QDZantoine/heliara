import { render } from "@testing-library/react"
import { act } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PageCurtain } from "@/components/layout/page-curtain"
import { media, navigation } from "@/tests/setup-dom"

const COVER_MS = 300
const COVERED_MS = 520
const REVEAL_MS = 580
const STUCK_MS = 2500
/**
 * Le lever attend une image après le répit : l'animation ne doit pas commencer
 * sur la frame où React commite la page entrante.
 */
const FRAME_MS = 20

const animation = {
  setSpeed: vi.fn(),
  pause: vi.fn(),
  goToAndPlay: vi.fn(),
  destroy: vi.fn(),
}
let idleWork: (() => void) | null = null

vi.mock("@/lib/lottie", () => ({
  loadLottie: async () => ({ loadAnimation: () => animation }),
  loadLottieData: async () => ({}),
  whenIdle: (work: () => void) => {
    idleWork = work
    return () => {
      idleWork = null
    }
  },
}))

/** Le voile, dont l'attribut `data-phase` porte l'état de la transition. */
function curtain(container: HTMLElement) {
  return container.firstElementChild as HTMLElement
}

function phase(container: HTMLElement) {
  return curtain(container).getAttribute("data-phase")
}

/**
 * Un clic aussi proche du réel que possible : `element.click()` ne déclenche pas
 * `pointerdown`, et l'interception se fait en phase de capture, donc l'évènement
 * doit être émis sur un nœud réellement dans le document.
 */
function clickLink(anchor: HTMLAnchorElement, init: MouseEventInit = {}) {
  anchor.dispatchEvent(
    new MouseEvent("pointerdown", { bubbles: true, cancelable: true })
  )
  anchor.dispatchEvent(
    new MouseEvent("pointerup", { bubbles: true, cancelable: true })
  )
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  })
  anchor.dispatchEvent(event)
  return event
}

function addLink(attributes: Record<string, string>) {
  const anchor = document.createElement("a")
  anchor.textContent = "lien"
  for (const [name, value] of Object.entries(attributes)) {
    anchor.setAttribute(name, value)
  }
  document.body.append(anchor)
  return anchor
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  idleWork = null
  window.history.replaceState({}, "", "/")
})

afterEach(() => {
  vi.useRealTimers()
  document.body.querySelectorAll("a").forEach((anchor) => anchor.remove())
})

describe("PageCurtain", () => {
  it("est au repos et hors de l'arbre d'accessibilité au premier rendu", () => {
    const { container } = render(<PageCurtain />)
    expect(phase(container)).toBe("idle")
    expect(curtain(container)).toHaveAttribute("aria-hidden", "true")
    expect(document.documentElement).not.toHaveAttribute("data-curtain")
  })

  describe("interception des liens", () => {
    it("préempte le clic sur un lien interne et couvre l'écran", () => {
      const { container } = render(<PageCurtain />)
      const event = clickLink(addLink({ href: "/methode" }))

      expect(event.defaultPrevented).toBe(true)
      expect(phase(container)).toBe("cover")
      // La phase est aussi portée par <html>, ce qui permet au CSS d'animer
      // `main` sans qu'aucun composant de page ait à le savoir.
      expect(document.documentElement).toHaveAttribute("data-curtain", "cover")
    })

    it("navigue écran couvert, pas au moment du clic", () => {
      render(<PageCurtain />)
      clickLink(addLink({ href: "/methode" }))

      expect(navigation.push).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(COVER_MS))
      expect(navigation.push).toHaveBeenCalledWith("/methode")
    })

    it("conserve la requête et l'ancre de la cible", () => {
      render(<PageCurtain />)
      clickLink(addLink({ href: "/realisations?secteur=sante#grille" }))
      act(() => vi.advanceTimersByTime(COVER_MS))
      expect(navigation.push).toHaveBeenCalledWith(
        "/realisations?secteur=sante#grille"
      )
    })

    it("joue l'illustration dès la couverture, et la met en pause au repos", async () => {
      const { container } = render(<PageCurtain />)
      await act(async () => {
        idleWork?.()
        await Promise.resolve()
      })

      clickLink(addLink({ href: "/methode" }))
      expect(animation.goToAndPlay).toHaveBeenCalledWith(0, true)

      act(() => vi.advanceTimersByTime(COVER_MS))
      navigation.pathname = "/methode"
      // Le retour au repos vient de la navigation, simulée ci-dessous.
      expect(phase(container)).toBe("cover")
    })

    it("ignore un lien externe", () => {
      const { container } = render(<PageCurtain />)
      const event = clickLink(addLink({ href: "https://hexceos.fr" }))
      expect(event.defaultPrevented).toBe(false)
      expect(phase(container)).toBe("idle")
    })

    it("ignore un lien qui ouvre un nouvel onglet", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "/methode", target: "_blank" }))
      expect(phase(container)).toBe("idle")
    })

    it("ignore un téléchargement", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "/plaquette.pdf", download: "" }))
      expect(phase(container)).toBe("idle")
    })

    it("ignore un lien marqué external", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "/ailleurs", rel: "noopener external" }))
      expect(phase(container)).toBe("idle")
    })

    it("ignore une ancre sur la page courante", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "#contenu" }))
      expect(phase(container)).toBe("idle")
    })

    it("ignore un lien vers la page déjà affichée", () => {
      window.history.replaceState({}, "", "/methode")
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "/methode" }))
      expect(phase(container)).toBe("idle")
    })

    it("ignore un mailto", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "mailto:contact@heliara.fr" }))
      expect(phase(container)).toBe("idle")
    })

    it("laisse les raccourcis du navigateur tranquilles", () => {
      const { container } = render(<PageCurtain />)
      for (const modifier of [
        { metaKey: true },
        { ctrlKey: true },
        { shiftKey: true },
        { altKey: true },
      ]) {
        clickLink(addLink({ href: "/methode" }), modifier)
        expect(phase(container), JSON.stringify(modifier)).toBe("idle")
      }
    })

    it("ignore un clic autre que le bouton principal", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "/methode" }), { button: 1 })
      expect(phase(container)).toBe("idle")
    })

    it("ignore un clic déjà préempté par un autre gestionnaire", () => {
      const { container } = render(<PageCurtain />)
      const anchor = addLink({ href: "/methode" })
      // Préempté avant même d'être distribué : `PageCurtain` écoute sur
      // `document` en capture, donc rien ne peut le précéder dans l'arbre.
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      })
      event.preventDefault()
      anchor.dispatchEvent(event)
      expect(phase(container)).toBe("idle")
    })

    it("ignore un clic hors de tout lien", () => {
      const { container } = render(<PageCurtain />)
      document.body.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })
      )
      expect(phase(container)).toBe("idle")
    })

    it("ne se déclenche pas deux fois si l'on clique pendant la couverture", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "/methode" }))
      const second = clickLink(addLink({ href: "/contact" }))

      expect(second.defaultPrevented).toBe(false)
      act(() => vi.advanceTimersByTime(COVER_MS))
      expect(navigation.push).toHaveBeenCalledOnce()
      expect(phase(container)).toBe("cover")
    })
  })

  describe("lever du voile", () => {
    it("lève le voile après le temps couvert minimum, puis revient au repos", () => {
      const { container, rerender } = render(<PageCurtain />)
      clickLink(addLink({ href: "/methode" }))
      act(() => vi.advanceTimersByTime(COVER_MS))

      // La page entrante s'affiche : le pathname change.
      navigation.pathname = "/methode"
      act(() => rerender(<PageCurtain />))
      expect(phase(container)).toBe("cover")

      act(() => vi.advanceTimersByTime(COVERED_MS + FRAME_MS))
      expect(phase(container)).toBe("reveal")
      expect(document.documentElement).toHaveAttribute("data-curtain", "reveal")

      act(() => vi.advanceTimersByTime(REVEAL_MS))
      expect(phase(container)).toBe("idle")
      expect(document.documentElement).not.toHaveAttribute("data-curtain")
    })

    it("met l'illustration en pause au retour au repos : rien ne tourne en fond", async () => {
      const { container, rerender } = render(<PageCurtain />)
      await act(async () => {
        idleWork?.()
        await Promise.resolve()
      })

      clickLink(addLink({ href: "/methode" }))
      act(() => vi.advanceTimersByTime(COVER_MS))
      navigation.pathname = "/methode"
      act(() => rerender(<PageCurtain />))
      act(() => vi.advanceTimersByTime(COVERED_MS + FRAME_MS + REVEAL_MS))

      expect(phase(container)).toBe("idle")
      expect(animation.pause).toHaveBeenCalled()
    })

    it("n'anime rien sur une navigation qui ne vient pas d'un clic intercepté", () => {
      const { container, rerender } = render(<PageCurtain />)
      // Retour arrière, lien externe entrant : le pathname change sans clic.
      navigation.pathname = "/contact"
      act(() => rerender(<PageCurtain />))
      act(() => vi.advanceTimersByTime(COVERED_MS + FRAME_MS + REVEAL_MS))
      expect(phase(container)).toBe("idle")
    })

    it("rouvre quand même si la navigation n'aboutit pas", () => {
      const { container } = render(<PageCurtain />)
      clickLink(addLink({ href: "/methode" }))
      act(() => vi.advanceTimersByTime(COVER_MS))
      // La page ne vient jamais : le filet de sécurité doit rendre la main.
      expect(phase(container)).toBe("cover")

      act(() => vi.advanceTimersByTime(STUCK_MS))
      expect(phase(container)).toBe("reveal")
      act(() => vi.advanceTimersByTime(REVEAL_MS))
      expect(phase(container)).toBe("idle")
    })
  })

  describe("sous prefers-reduced-motion", () => {
    it("n'intercepte aucun lien : la navigation est normale", () => {
      media.reducedMotion = true
      const { container } = render(<PageCurtain />)
      const event = clickLink(addLink({ href: "/methode" }))
      expect(event.defaultPrevented).toBe(false)
      expect(phase(container)).toBe("idle")
      expect(navigation.push).not.toHaveBeenCalled()
    })

    it("ne télécharge même pas le lecteur Lottie", () => {
      media.reducedMotion = true
      render(<PageCurtain />)
      expect(idleWork).toBeNull()
    })
  })

  it("se joue sans illustration si le lecteur n'a pas eu le temps d'arriver", () => {
    const { container } = render(<PageCurtain />)
    // `idleWork` n'est jamais appelé : l'animation n'existe pas.
    clickLink(addLink({ href: "/methode" }))
    expect(phase(container)).toBe("cover")
    expect(animation.goToAndPlay).not.toHaveBeenCalled()
  })

  it("retire ses minuteries au démontage", () => {
    const { unmount } = render(<PageCurtain />)
    clickLink(addLink({ href: "/methode" }))
    unmount()
    act(() => vi.advanceTimersByTime(COVER_MS + STUCK_MS))
    expect(navigation.push).not.toHaveBeenCalled()
  })

  it("cesse d'écouter les clics au démontage", () => {
    const { unmount } = render(<PageCurtain />)
    unmount()
    const event = clickLink(addLink({ href: "/methode" }))
    expect(event.defaultPrevented).toBe(false)
  })
})
