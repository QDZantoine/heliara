import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Le vrai `lottie_light` ne peut pas s'initialiser dans jsdom : il demande un
 * contexte de canevas dès son évaluation, et jsdom en renvoie `null`. Ce qui est
 * testé ici est la politique de chargement de `lib/lottie`, pas le moteur.
 */
vi.mock("lottie-web/build/player/lottie_light", () => ({
  default: { loadAnimation: () => ({}) },
}))

/**
 * `lib/lottie` mémorise ses chargements au niveau du module : c'est tout son
 * intérêt, et c'est aussi ce qui oblige à réinitialiser les modules entre deux
 * tests, sinon le second observerait le cache du premier.
 */
async function freshModule() {
  vi.resetModules()
  return import("@/lib/lottie")
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe("loadLottieData", () => {
  it("ne télécharge un fichier qu'une seule fois", async () => {
    const fetchMock = vi.fn(async () => ({ json: async () => ({ v: "5" }) }))
    vi.stubGlobal("fetch", fetchMock)

    const { loadLottieData } = await freshModule()
    const first = loadLottieData("/a.json")
    const second = loadLottieData("/a.json")

    expect(await first).toEqual({ v: "5" })
    // La même promesse est rendue, pas seulement le même résultat : deux appels
    // simultanés ne doivent pas déclencher deux requêtes.
    expect(second).toBe(first)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("distingue deux fichiers", async () => {
    const fetchMock = vi.fn(async (_url: string) => ({
      json: async () => ({}),
    }))
    vi.stubGlobal("fetch", fetchMock)

    const { loadLottieData } = await freshModule()
    await Promise.all([loadLottieData("/a.json"), loadLottieData("/b.json")])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/a.json",
      "/b.json",
    ])
  })
})

describe("loadLottie", () => {
  it("rend la même promesse à chaque appel : un seul chunk pour tout le site", async () => {
    const { loadLottie } = await freshModule()
    expect(loadLottie()).toBe(loadLottie())
  })

  it("charge la variante allégée du lecteur", async () => {
    const { loadLottie } = await freshModule()
    const player = await loadLottie()
    // La variante `lottie_light` n'évalue pas les expressions, ce qui est voulu :
    // celles de nos fichiers sont des rebonds, que la DA interdit.
    expect(typeof player.loadAnimation).toBe("function")
  })
})

describe("whenIdle", () => {
  it("passe par requestIdleCallback quand le navigateur le fournit", async () => {
    const requestIdleCallback = vi.fn(() => 7)
    const cancelIdleCallback = vi.fn()
    vi.stubGlobal("requestIdleCallback", requestIdleCallback)
    vi.stubGlobal("cancelIdleCallback", cancelIdleCallback)

    const { whenIdle } = await freshModule()
    const work = vi.fn()
    const cancel = whenIdle(work, 4000)

    expect(requestIdleCallback).toHaveBeenCalledWith(work, { timeout: 4000 })
    cancel()
    expect(cancelIdleCallback).toHaveBeenCalledWith(7)
  })

  it("se replie sur un délai pour Safari, qui ne l'implémente pas", async () => {
    vi.stubGlobal("requestIdleCallback", undefined)
    vi.useFakeTimers()

    const { whenIdle } = await freshModule()
    const work = vi.fn()
    whenIdle(work)

    // Le repli est plafonné à 1200 ms : attendre le délai complet de 3 s
    // retarderait trop ce qui doit finir par arriver.
    vi.advanceTimersByTime(1199)
    expect(work).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(work).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })

  it("annule le repli, pour ne rien exécuter après un démontage", async () => {
    vi.stubGlobal("requestIdleCallback", undefined)
    vi.useFakeTimers()

    const { whenIdle } = await freshModule()
    const work = vi.fn()
    whenIdle(work)()

    vi.advanceTimersByTime(5000)
    expect(work).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("respecte un délai plus court que le plafond", async () => {
    vi.stubGlobal("requestIdleCallback", undefined)
    vi.useFakeTimers()

    const { whenIdle } = await freshModule()
    const work = vi.fn()
    whenIdle(work, 300)

    vi.advanceTimersByTime(300)
    expect(work).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })
})
