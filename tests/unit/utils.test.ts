import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("cn", () => {
  it("concatène les classes", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("ignore les valeurs fausses, ce qui permet les classes conditionnelles", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c")
  })

  it("accepte tableaux et objets, comme clsx", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c")
  })

  it("laisse gagner la dernière classe en conflit - le contrat de tailwind-merge", () => {
    expect(cn("px-2", "px-5")).toBe("px-5")
    expect(cn("text-ink", "text-body")).toBe("text-body")
  })

  it("distingue deux propriétés voisines sans les fusionner à tort", () => {
    expect(cn("px-2", "py-5")).toBe("px-2 py-5")
  })

  it("permet à l'appelant de surcharger le style par défaut d'un composant", () => {
    // C'est l'usage réel : `cn(base, className)` dans chaque primitive.
    expect(cn("rounded-sm bg-surface", "bg-inset")).toBe("rounded-sm bg-inset")
  })
})
