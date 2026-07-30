import { describe, expect, it } from "vitest"

import { isoDay, todayIso } from "@/lib/date"

/**
 * Le jour d'une colonne `DATE`, sans décalage de fuseau.
 *
 * Le défaut que ces tests verrouillent était silencieux et destructeur : `mysql2`
 * rend une colonne `DATE` en `Date` positionnée à minuit **local**, et la ramener en
 * ISO par `toISOString()` la faisait reculer d'un jour à l'est de Greenwich. La base
 * contenait le 12 juillet, l'éditeur affichait le 11, et enregistrer écrivait le 11.
 *
 * Les cas sont construits avec `new Date(annee, mois, jour)` - le constructeur à
 * composantes locales, exactement ce que fabrique `mysql2`. Ils passent donc quel que
 * soit le fuseau de la machine qui les exécute, ce qui est le point : le test doit
 * échouer pour la mauvaise implémentation partout, pas seulement à Paris.
 */
describe("isoDay", () => {
  it("rend le jour local d'une date de minuit, sans reculer d'un jour", () => {
    // Minuit le 12 juillet, heure locale : c'est ce que rend `mysql2` pour la
    // valeur `2026-07-12`. En UTC+2, `toISOString()` donnait « 2026-07-11 ».
    expect(isoDay(new Date(2026, 6, 12))).toBe("2026-07-12")
  })

  it("garde le jour à l'autre extrémité de l'année, hors heure d'été", () => {
    expect(isoDay(new Date(2026, 0, 1))).toBe("2026-01-01")
    expect(isoDay(new Date(2025, 11, 31))).toBe("2025-12-31")
  })

  it("complète le mois et le jour sur deux chiffres", () => {
    expect(isoDay(new Date(2026, 1, 3))).toBe("2026-02-03")
  })

  it("tronque une chaîne, forme que prend la valeur avec `dateStrings`", () => {
    expect(isoDay("2026-07-12")).toBe("2026-07-12")
    expect(isoDay("2026-07-12 00:00:00")).toBe("2026-07-12")
  })

  it("rend une chaîne vide sur une valeur absente plutôt que de lever", () => {
    expect(isoDay(null)).toBe("")
    expect(isoDay(undefined)).toBe("")
  })
})

describe("todayIso", () => {
  it("rend le jour tel que le lit la personne devant l'écran", () => {
    const now = new Date()
    const expected = [
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-")
    expect(todayIso()).toBe(expected)
  })
})
