/**
 * Identifiants : conversion entre les trois représentations qui circulent.
 *
 *   Buffer(16)  la base. `BINARY(16)` en entrée comme en sortie de toute
 *               procédure, et ce que `mysql2` rend pour ces colonnes.
 *   hex(32)     la forme compacte, sans tiret. C'est celle qui va dans une URL
 *               d'administration : plus courte qu'un UUID, et sans caractère à
 *               échapper.
 *   UUID(36)    la forme canonique, pour les journaux et le débogage.
 *
 * Toute la surface publique refuse une entrée invalide au lieu de produire des
 * octets tronqués : une clé étrangère fausse est bien plus coûteuse à diagnostiquer
 * qu'une erreur immédiate. `Uuid2Bin()` renvoie `NULL` côté SQL pour la même
 * raison, et c'est la même règle des deux côtés de la frontière.
 */

/**
 * 32 caractères hexadécimaux, sans tiret. Les tirets d'un UUID canonique sont
 * retirés avant le test, donc un seul motif suffit pour les deux formes.
 */
const HEX = /^[0-9a-fA-F]{32}$/

/** Identifiant tel qu'il vient de la base. */
export type Id = Buffer

export class InvalidIdError extends Error {
  constructor(value: unknown) {
    super(`Identifiant invalide : ${JSON.stringify(value)}`)
    this.name = "InvalidIdError"
  }
}

/** Est-ce un identifiant binaire de la bonne taille ? */
export function isId(value: unknown): value is Id {
  return Buffer.isBuffer(value) && value.length === 16
}

/** Binaire vers hexadécimal minuscule, sans tiret. La forme des URL. */
export function toHex(id: unknown): string {
  if (!isId(id)) {
    throw new InvalidIdError(id)
  }
  return id.toString("hex")
}

/** Binaire vers UUID canonique minuscule. La forme des journaux. */
export function toUuid(id: unknown): string {
  const hex = toHex(id)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-")
}

/**
 * Hexadécimal ou UUID vers binaire. Accepte les deux formes et les deux casses,
 * ce qui permet de passer sans réfléchir un segment d'URL ou une valeur de
 * journal.
 */
export function toId(value: unknown): Id {
  if (isId(value)) {
    return value
  }
  if (typeof value !== "string") {
    throw new InvalidIdError(value)
  }
  const hex = value.includes("-") ? value.replaceAll("-", "") : value
  if (!HEX.test(hex)) {
    throw new InvalidIdError(value)
  }
  return Buffer.from(hex.toLowerCase(), "hex")
}

/**
 * Variante tolérante, pour les entrées venant de l'extérieur : un segment d'URL
 * ne mérite pas une exception, seulement un `notFound()`.
 */
export function parseId(value: unknown): Id | null {
  try {
    return toId(value)
  } catch {
    return null
  }
}

/** Deux identifiants désignent-ils la même ligne ? */
export function sameId(a: unknown, b: unknown): boolean {
  return isId(a) && isId(b) && a.equals(b)
}

/**
 * Est-ce un UUID version 7, tel que le produit `GenerateKey()` ?
 *
 * Sert aux tests et aux contrôles de cohérence, pas au chemin nominal : la base
 * reste seule responsable de la génération.
 */
export function isVersion7(id: unknown): boolean {
  if (!isId(id)) {
    return false
  }
  // Quartet de version dans l'octet 6, marqueur de variante 10 dans l'octet 8.
  return (id[6] & 0xf0) === 0x70 && (id[8] & 0xc0) === 0x80
}

/**
 * Horodatage porté par un UUID v7, en millisecondes.
 *
 * Les 48 bits de tête sont le temps de création, gros-boutiste. C'est ce qui rend
 * ces identifiants triables, et ce qui permet de lire une date de création sans
 * colonne dédiée - mais on garde `created_at` malgré tout : une date explicite se
 * lit en SQL sans fonction.
 */
export function timestampOf(id: unknown): number {
  if (!isId(id)) {
    throw new InvalidIdError(id)
  }
  return id.readUIntBE(0, 6)
}

/** Formes utiles d'un identifiant, pour un journal ou une réponse d'API. */
export function describeId(id: Id) {
  return { hex: toHex(id), uuid: toUuid(id) }
}

/**
 * Dates : la base ne connaît que des `BIGINT` de secondes Unix. JavaScript
 * compte en millisecondes. Les deux conversions sont ici, et nulle part ailleurs.
 */
export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

export function fromUnix(seconds: number | string): Date {
  // `mysql2` peut rendre un BIGINT sous forme de chaîne quand il dépasse la
  // précision d'un nombre. Nos horodatages sont loin de cette limite, mais la
  // conversion reste explicite plutôt que dépendante du pilote.
  return new Date(Number(seconds) * 1000)
}
