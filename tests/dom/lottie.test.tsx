import { render } from "@testing-library/react"
import { act } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LottieScene } from "@/components/visuals/lottie-scene"
import { intersect, media } from "@/tests/setup-dom"

/**
 * Le lecteur est simulé au niveau de `lib/lottie` plutôt que de `lottie-web` :
 * c'est le contrat que le composant consomme, et cela évite de faire tourner un
 * vrai moteur de rendu SVG dans jsdom.
 */
const animation = {
  setSpeed: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  goToAndPlay: vi.fn(),
  goToAndStop: vi.fn(),
  destroy: vi.fn(),
  addEventListener: vi.fn(),
  currentFrame: 0,
  totalFrames: 100,
}

const loadAnimation = vi.fn((_params: Record<string, unknown>) => animation)
const loadLottie = vi.fn(async () => ({ loadAnimation }))
const loadLottieData = vi.fn(async (_url: string) => ({ v: "5.13.0" }))
let idleWork: (() => void) | null = null

vi.mock("@/lib/lottie", () => ({
  loadLottie: () => loadLottie(),
  loadLottieData: (url: string) => loadLottieData(url),
  whenIdle: (work: () => void) => {
    idleWork = work
    return () => {
      idleWork = null
    }
  },
}))

/** Laisse les promesses du chargement se résoudre. */
async function settle() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  loadLottie.mockResolvedValue({ loadAnimation })
  loadLottieData.mockResolvedValue({ v: "5.13.0" })
  loadAnimation.mockReturnValue(animation)
  animation.currentFrame = 0
  idleWork = null
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("LottieScene", () => {
  it("est décorative : hors de l'arbre d'accessibilité", () => {
    const { container } = render(<LottieScene src="/a.json" />)
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true")
  })

  it("dimensionne la boîte avant tout chargement : aucun décalage à l'arrivée", () => {
    const { container } = render(
      <LottieScene src="/a.json" className="aspect-square w-full" />
    )
    expect(container.firstElementChild).toHaveClass("aspect-square", "w-full")
    expect(loadLottie).not.toHaveBeenCalled()
  })

  describe("politique de chargement", () => {
    it("`visible` par défaut : rien n'est téléchargé avant l'approche du champ", async () => {
      render(<LottieScene src="/a.json" />)
      await settle()
      expect(loadLottie).not.toHaveBeenCalled()

      await act(async () => intersect())
      await settle()
      expect(loadLottie).toHaveBeenCalledOnce()
      expect(loadLottieData).toHaveBeenCalledWith("/a.json")
    })

    it("`eager` charge dès le montage, pour ce qui est au-dessus de la ligne de flottaison", async () => {
      render(<LottieScene src="/hero.json" load="eager" />)
      await settle()
      expect(loadLottie).toHaveBeenCalledOnce()
    })

    it("`idle` attend l'inoccupation du navigateur", async () => {
      render(<LottieScene src="/a.json" load="idle" />)
      await settle()
      expect(loadLottie).not.toHaveBeenCalled()

      await act(async () => idleWork?.())
      await settle()
      expect(loadLottie).toHaveBeenCalledOnce()
    })

    it("ne charge qu'une fois, même si la boîte entre et sort du champ", async () => {
      render(<LottieScene src="/a.json" />)
      await act(async () => intersect())
      await settle()
      await act(async () => intersect(false))
      await act(async () => intersect())
      await settle()
      expect(loadLottie).toHaveBeenCalledOnce()
    })
  })

  describe("lecture", () => {
    it("applique la vitesse demandée", async () => {
      render(<LottieScene src="/a.json" load="eager" speed={0.44} />)
      await settle()
      expect(animation.setSpeed).toHaveBeenCalledWith(0.44)
    })

    it("boucle par Lottie quand aucune pause n'est demandée", async () => {
      render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      expect(loadAnimation.mock.calls[0][0]).toMatchObject({
        loop: true,
        autoplay: false,
        renderer: "svg",
      })
    })

    it("pilote la boucle à la main dès qu'une pause est demandée", async () => {
      render(<LottieScene src="/a.json" load="eager" holdMs={2200} />)
      await settle()
      expect(loadAnimation.mock.calls[0][0]).toMatchObject({ loop: false })
      expect(animation.addEventListener).toHaveBeenCalledWith(
        "complete",
        expect.any(Function)
      )
    })

    it("ne démarre pas hors du champ, même chargée", async () => {
      render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      expect(animation.play).not.toHaveBeenCalled()

      await act(async () => intersect())
      expect(animation.play).toHaveBeenCalled()
    })

    it("met en pause à la sortie du champ : rien n'occupe le processeur ensuite", async () => {
      render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      await act(async () => intersect())
      await act(async () => intersect(false))
      expect(animation.pause).toHaveBeenCalled()
    })

    it("repart du début quand le cycle s'est terminé pendant l'absence", async () => {
      render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      animation.currentFrame = animation.totalFrames - 1
      await act(async () => intersect())
      expect(animation.goToAndPlay).toHaveBeenCalledWith(0, true)
      expect(animation.play).not.toHaveBeenCalled()
    })

    it("reprend en place quand le cycle n'était pas terminé", async () => {
      render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      animation.currentFrame = 40
      await act(async () => intersect())
      expect(animation.play).toHaveBeenCalled()
      expect(animation.goToAndPlay).not.toHaveBeenCalled()
    })

    it("se détruit au démontage", async () => {
      const { unmount } = render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      unmount()
      expect(animation.destroy).toHaveBeenCalledOnce()
    })
  })

  describe("sous prefers-reduced-motion", () => {
    it("fige une image représentative plutôt que de laisser un vide", async () => {
      media.reducedMotion = true
      render(<LottieScene src="/a.json" load="eager" posterFrame={104} />)
      await settle()
      expect(animation.goToAndStop).toHaveBeenCalledWith(104, true)
      expect(animation.play).not.toHaveBeenCalled()
    })

    it("retombe sur la dernière image sans repère fourni", async () => {
      media.reducedMotion = true
      render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      expect(animation.goToAndStop).toHaveBeenCalledWith(99, true)
    })

    it("ne pilote aucune boucle à la main : rien ne doit se relancer", async () => {
      media.reducedMotion = true
      render(<LottieScene src="/a.json" load="eager" holdMs={2000} />)
      await settle()
      expect(animation.addEventListener).not.toHaveBeenCalled()
    })
  })

  describe("quand le chargement échoue", () => {
    it("laisse la boîte vide sans rien casser", async () => {
      loadLottie.mockRejectedValue(new Error("chunk indisponible"))
      const { container } = render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      expect(container.firstElementChild).toBeInTheDocument()
      expect(container.firstElementChild).not.toHaveAttribute("data-ready")
    })

    it("encaisse aussi un fichier introuvable", async () => {
      loadLottieData.mockRejectedValue(new Error("404"))
      const { container } = render(<LottieScene src="/a.json" load="eager" />)
      await settle()
      expect(container.firstElementChild).not.toHaveAttribute("data-ready")
    })
  })

  it("ne se révèle qu'une fois prête : le fondu évite l'apparition brutale", async () => {
    const { container } = render(<LottieScene src="/a.json" load="eager" />)
    const box = container.firstElementChild!
    expect(box).toHaveClass("opacity-0")
    await settle()
    expect(box).toHaveAttribute("data-ready", "true")
  })
})
