import { afterEach, describe, expect, it, vi } from "vitest"

import { indexNowBase, notifyIndexNow } from "@/lib/indexnow"

/**
 * Le signal part de l'administration vers des adresses du site public. Ce qui compte :
 * qu'il ne parte jamais d'ailleurs que du domaine de production, et qu'il ne lève jamais.
 */
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("IndexNow", () => {
  it("ne vise que le domaine de production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://heliara.fr")
    expect(indexNowBase()).toBe("https://heliara.fr")

    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://apercu.heliara.fr")
    expect(indexNowBase()).toBeNull()

    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "http://localhost:3000")
    expect(indexNowBase()).toBeNull()
  })

  it("n'envoie rien sans clé ni hors production", async () => {
    const appel = vi.fn()
    vi.stubGlobal("fetch", appel)

    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://heliara.fr")
    vi.stubEnv("INDEXNOW_KEY", "")
    await notifyIndexNow(["/"])

    vi.stubEnv("INDEXNOW_KEY", "cle-de-test-1234")
    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "http://localhost:3000")
    await notifyIndexNow(["/"])

    expect(appel).not.toHaveBeenCalled()
  })

  it("envoie des adresses absolues dédupliquées, et ne lève pas si le moteur échoue", async () => {
    const appel = vi.fn().mockRejectedValue(new Error("injoignable"))
    vi.stubGlobal("fetch", appel)
    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://heliara.fr")
    vi.stubEnv("INDEXNOW_KEY", "cle-de-test-1234")

    await expect(
      notifyIndexNow(["/", "/realisations", "/"])
    ).resolves.toBeUndefined()

    const corps = JSON.parse(appel.mock.calls[0][1].body)
    expect(corps).toEqual({
      host: "heliara.fr",
      key: "cle-de-test-1234",
      keyLocation: "https://heliara.fr/cle-de-test-1234.txt",
      urlList: ["https://heliara.fr/", "https://heliara.fr/realisations"],
    })
  })
})
