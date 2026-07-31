import { afterEach, describe, expect, it, vi } from "vitest"

import { site } from "@/lib/site"

/**
 * L'origine servie par un déploiement.
 *
 * **Ce que ces tests protègent, et pourquoi ils existent.** Les métadonnées étaient
 * bâties sur `site.url` en dur. Sur un déploiement d'essai, les balises de partage
 * étaient donc correctes, bien formées, et pointaient vers un domaine qui ne répondait
 * pas encore : WhatsApp allait chercher l'image sur `heliara.fr` et ne trouvait rien,
 * alors qu'elle répondait 200 sur l'hôte réel. Aucun contrôle ne pouvait le voir.
 *
 * Le module est réimporté à chaque cas : `siteOrigin` lit l'environnement à l'appel,
 * mais `vi.resetModules` évite qu'un cache d'import fasse passer un test pour la
 * mauvaise raison.
 */
async function charger() {
  vi.resetModules()
  return (await import("@/lib/origin")).siteOrigin()
}

describe("siteOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("retombe sur le domaine de production, jamais sur l'hôte de la requête", async () => {
    vi.stubEnv("SITE_ORIGIN", undefined)
    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", undefined)
    expect(await charger()).toBe(site.url)
  })

  it("suit `SITE_ORIGIN`, lue à l'exécution pour ne pas exiger de reconstruction", async () => {
    vi.stubEnv("SITE_ORIGIN", "https://apercu.exemple.test")
    expect(await charger()).toBe("https://apercu.exemple.test")
  })

  it("retire la barre finale, dont la présence doublerait chaque séparateur", async () => {
    vi.stubEnv("SITE_ORIGIN", "https://apercu.exemple.test/")
    expect(await charger()).toBe("https://apercu.exemple.test")
  })

  it("préfère `SITE_ORIGIN` à la variable figée au build", async () => {
    vi.stubEnv("SITE_ORIGIN", "https://execution.exemple.test")
    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://build.exemple.test")
    expect(await charger()).toBe("https://execution.exemple.test")
  })

  it("accepte la variable de build à défaut, pour un hôte connu d'avance", async () => {
    vi.stubEnv("SITE_ORIGIN", undefined)
    vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://build.exemple.test")
    expect(await charger()).toBe("https://build.exemple.test")
  })
})

describe("les URL absolues suivent l'origine configurée", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("porte sur le canonique, le plan du site et les données structurées", async () => {
    vi.stubEnv("SITE_ORIGIN", "https://apercu.exemple.test")
    vi.resetModules()

    const { absoluteUrl, pageMetadata } = await import("@/lib/seo")
    expect(absoluteUrl("/realisations")).toBe(
      "https://apercu.exemple.test/realisations"
    )

    const meta = pageMetadata({
      title: "Essai",
      description: "Essai",
      path: "/essai",
    })
    expect(meta.alternates?.canonical).toBe("https://apercu.exemple.test/essai")

    const { organizationId, websiteId } = await import("@/lib/schema")
    expect(organizationId()).toBe("https://apercu.exemple.test/#organization")
    expect(websiteId()).toBe("https://apercu.exemple.test/#website")
  })
})
