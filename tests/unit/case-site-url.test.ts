import { describe, expect, it } from "vitest"

import { caseStudyNode } from "@/lib/schema"
import { siteUrlSchema } from "@/lib/schemas/case"

describe("adresse du site livré", () => {
  it("accepte le vide et une adresse https complète", () => {
    expect(siteUrlSchema.safeParse("").success).toBe(true)
    expect(siteUrlSchema.safeParse(" https://www.dkclim.fr/ ").data).toBe(
      "https://www.dkclim.fr/"
    )
  })

  it("refuse ce qui ne doit pas partir en lien public", () => {
    for (const bad of [
      "http://dkclim.fr",
      "javascript:alert(1)",
      "dkclim.fr",
      "https://localhost",
      "https://dk clim.fr",
    ]) {
      expect(siteUrlSchema.safeParse(bad).success, bad).toBe(false)
    }
  })

  it("balise le site comme ce dont parle la fiche, et seulement s'il existe", () => {
    const base = {
      path: "/realisations/dk-clim",
      title: "DK Clim - site vitrine",
      description: "Résumé",
      sector: "Artisanat",
    }
    expect(caseStudyNode(base).about).toEqual({
      "@type": "Thing",
      name: "Artisanat",
    })
    expect(
      caseStudyNode({ ...base, siteUrl: "https://dkclim.fr" }).about
    ).toEqual([
      { "@type": "Thing", name: "Artisanat" },
      { "@type": "WebSite", name: "DK Clim", url: "https://dkclim.fr" },
    ])
  })
})
