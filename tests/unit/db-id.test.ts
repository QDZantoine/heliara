import { describe, expect, it } from "vitest"

import {
  InvalidIdError,
  describeId,
  fromUnix,
  isId,
  isVersion7,
  parseId,
  sameId,
  timestampOf,
  toHex,
  toId,
  toUnix,
  toUuid,
} from "@/lib/db/id"

/** Un v7 réel, produit par `GenerateKey()`. */
const UUID = "019fad6d-241b-7fc3-9b79-77165f56cf9f"
const HEX = "019fad6d241b7fc39b7977165f56cf9f"
const BIN = Buffer.from(HEX, "hex")

describe("isId", () => {
  it("reconnaît un tampon de seize octets", () => {
    expect(isId(BIN)).toBe(true)
  })

  it("refuse une longueur autre que seize", () => {
    expect(isId(Buffer.alloc(15))).toBe(false)
    expect(isId(Buffer.alloc(17))).toBe(false)
    expect(isId(Buffer.alloc(0))).toBe(false)
  })

  it("refuse ce qui n'est pas un tampon", () => {
    for (const value of [HEX, UUID, null, undefined, 0, {}, []]) {
      expect(isId(value)).toBe(false)
    }
  })
})

describe("toHex", () => {
  it("rend trente-deux caractères minuscules, sans tiret", () => {
    expect(toHex(BIN)).toBe(HEX)
    expect(toHex(BIN)).toMatch(/^[0-9a-f]{32}$/)
  })

  it("refuse une entrée qui n'est pas un identifiant", () => {
    expect(() => toHex(HEX)).toThrow(InvalidIdError)
    expect(() => toHex(Buffer.alloc(8))).toThrow(InvalidIdError)
    expect(() => toHex(null)).toThrow(InvalidIdError)
  })
})

describe("toUuid", () => {
  it("place les tirets aux positions canoniques", () => {
    expect(toUuid(BIN)).toBe(UUID)
  })

  it("refuse une entrée invalide plutôt que de tronquer", () => {
    expect(() => toUuid(Buffer.alloc(4))).toThrow(InvalidIdError)
  })
})

describe("toId", () => {
  it("accepte la forme hexadécimale compacte, celle des URL", () => {
    expect(toId(HEX)).toEqual(BIN)
  })

  it("accepte la forme UUID canonique", () => {
    expect(toId(UUID)).toEqual(BIN)
  })

  it("accepte les majuscules, dans les deux formes", () => {
    expect(toId(HEX.toUpperCase())).toEqual(BIN)
    expect(toId(UUID.toUpperCase())).toEqual(BIN)
  })

  it("rend tel quel un identifiant déjà binaire, sans copie inutile", () => {
    expect(toId(BIN)).toBe(BIN)
  })

  it("fait l'aller-retour dans les deux sens", () => {
    expect(toHex(toId(UUID))).toBe(HEX)
    expect(toUuid(toId(HEX))).toBe(UUID)
  })

  describe("refuse tout ce qui n'est pas un identifiant", () => {
    it("une longueur fausse", () => {
      expect(() => toId(HEX.slice(0, 31))).toThrow(InvalidIdError)
      expect(() => toId(`${HEX}00`)).toThrow(InvalidIdError)
    })

    it("un caractère non hexadécimal", () => {
      expect(() => toId(`${HEX.slice(0, 31)}z`)).toThrow(InvalidIdError)
    })

    it("des tirets mal placés", () => {
      expect(() => toId("019fad6d-241b-7fc3-9b79-77165f56cf9")).toThrow(
        InvalidIdError
      )
    })

    it("une chaîne vide, un autre type, une injection", () => {
      for (const value of ["", null, undefined, 42, {}, [], "1 OR 1=1"]) {
        expect(() => toId(value), String(value)).toThrow(InvalidIdError)
      }
    })
  })

  it("nomme la valeur fautive dans le message : le diagnostic est immédiat", () => {
    expect(() => toId("pas-un-id")).toThrow(/pas-un-id/)
  })
})

describe("parseId", () => {
  it("convertit ce qui est valide", () => {
    expect(parseId(HEX)).toEqual(BIN)
    expect(parseId(UUID)).toEqual(BIN)
  })

  it("rend null sur une entrée douteuse, sans lever : un segment d'URL mérite un notFound", () => {
    for (const value of ["", "pas-un-id", null, undefined, 42, {}]) {
      expect(parseId(value), String(value)).toBeNull()
    }
  })
})

describe("sameId", () => {
  it("compare le contenu, pas la référence", () => {
    expect(sameId(BIN, Buffer.from(HEX, "hex"))).toBe(true)
  })

  it("distingue deux identifiants différents", () => {
    const other = Buffer.from(HEX, "hex")
    other[15] ^= 0xff
    expect(sameId(BIN, other)).toBe(false)
  })

  it("est faux dès qu'une des deux valeurs n'est pas un identifiant", () => {
    expect(sameId(BIN, HEX)).toBe(false)
    expect(sameId(null, null)).toBe(false)
    expect(sameId(BIN, undefined)).toBe(false)
  })
})

describe("isVersion7", () => {
  it("reconnaît un identifiant produit par GenerateKey", () => {
    expect(isVersion7(BIN)).toBe(true)
  })

  it("refuse un UUID version 4", () => {
    const v4 = Buffer.from("2f8a1c3d4e5f4a6b8c9d0e1f2a3b4c5d", "hex")
    expect(isVersion7(v4)).toBe(false)
  })

  it("refuse un marqueur de variante non conforme", () => {
    const wrong = Buffer.from(BIN)
    wrong[8] = 0x00
    expect(isVersion7(wrong)).toBe(false)
  })

  it("refuse ce qui n'est pas un identifiant, sans lever", () => {
    expect(isVersion7(HEX)).toBe(false)
    expect(isVersion7(null)).toBe(false)
  })
})

describe("timestampOf", () => {
  it("lit l'horodatage des quarante-huit bits de tête", () => {
    // 019fad6d241b en base 16 : l'instant de création, en millisecondes.
    expect(timestampOf(BIN)).toBe(0x019fad6d241b)
  })

  it("place l'identifiant d'exemple dans une plage plausible", () => {
    const date = new Date(timestampOf(BIN))
    expect(date.getUTCFullYear()).toBeGreaterThanOrEqual(2026)
    expect(date.getUTCFullYear()).toBeLessThan(2100)
  })

  it("ordonne deux identifiants dans leur ordre de création", () => {
    const older = Buffer.from(BIN)
    const newer = Buffer.from(BIN)
    newer[5] = older[5] + 1
    expect(timestampOf(newer)).toBeGreaterThan(timestampOf(older))
    // C'est cette propriété qui fait la localité d'insertion InnoDB : l'ordre
    // hexadécimal est aussi l'ordre chronologique.
    expect(toHex(newer) > toHex(older)).toBe(true)
  })

  it("refuse une entrée invalide", () => {
    expect(() => timestampOf(HEX)).toThrow(InvalidIdError)
  })
})

describe("describeId", () => {
  it("rend les deux formes utiles d'un coup", () => {
    expect(describeId(BIN)).toEqual({ hex: HEX, uuid: UUID })
  })
})

describe("dates", () => {
  it("convertit une date en secondes Unix, comme la base les stocke", () => {
    expect(toUnix(new Date("2026-07-29T10:00:00.000Z"))).toBe(1785319200)
  })

  it("tronque les millisecondes vers le bas, sans arrondir", () => {
    expect(toUnix(new Date("2026-07-29T10:00:00.999Z"))).toBe(1785319200)
  })

  it("relit une date depuis les secondes", () => {
    expect(fromUnix(1785319200).toISOString()).toBe("2026-07-29T10:00:00.000Z")
  })

  it("accepte une chaîne, ce que mysql2 peut rendre pour un BIGINT", () => {
    expect(fromUnix("1785319200").getTime()).toBe(1785319200000)
  })

  it("fait l'aller-retour à la seconde près", () => {
    const date = new Date("2026-01-15T08:30:45.000Z")
    expect(fromUnix(toUnix(date)).getTime()).toBe(date.getTime())
  })
})
