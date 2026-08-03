import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = path.resolve(import.meta.dirname, "../..")

/**
 * La règle est absolue et sans exception : ni cadratin `—` ni demi-cadratin `–`,
 * nulle part. Ni dans le contenu éditorial, ni dans un commentaire, ni dans un
 * message d'erreur. Les maquettes de référence en sont pleines, et la tentation
 * de les transcrire telles quelles est constante : ce test est le garde-fou.
 *
 * `reference/` est hors périmètre : c'est la source à convertir, pas du code.
 */
const FORBIDDEN = [
  { char: "—", name: "cadratin" },
  { char: "–", name: "demi-cadratin" },
]

const SCANNED_DIRS = ["app", "components", "lib", "db", "docs", "tests"]
const SCANNED_EXTENSIONS = [".ts", ".tsx", ".css", ".sql", ".sh", ".md", ".yml"]
const IGNORED_DIRS = new Set(["node_modules", ".next", "reference", "coverage"])
/**
 * `AGENTS.md` n'est pas de nous : son bloc `nextjs-agent-rules` est posé et
 * régénéré par l'outillage Next. Le corriger serait défait au prochain passage,
 * et l'échec deviendrait une fausse alerte. La règle vaut pour ce que nous
 * écrivons.
 */
const IGNORED_FILES = new Set(["AGENTS.md"])

/** Parcours récursif : un fichier ajouté au dépôt est balayé sans rien déclarer. */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(path.join(root, dir), {
    withFileTypes: true,
  })) {
    if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) {
      continue
    }
    const relative = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(relative))
    } else if (SCANNED_EXTENSIONS.includes(path.extname(entry.name))) {
      out.push(relative)
    }
  }
  return out
}

const files = [
  ...SCANNED_DIRS.flatMap(walk),
  ...readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && SCANNED_EXTENSIONS.includes(path.extname(entry.name))
    )
    .map((entry) => entry.name),
]

/**
 * Dans un document Markdown, un caractère cité entre accents graves est nommé,
 * pas employé : c'est ainsi que la règle elle-même s'écrit. L'exemption s'arrête
 * là, et ne vaut surtout pas pour les fichiers de code, où les accents graves
 * délimitent des gabarits de chaîne dont le contenu est bel et bien affiché.
 */
function stripCodeSpans(line: string) {
  return line.replace(/`[^`]*`/g, "")
}

/** Les occurrences avec leur ligne, pour que l'échec soit directement lisible. */
function offences(char: string) {
  const found: string[] = []
  for (const file of files) {
    // Le test lui-même nomme les caractères interdits : il ne peut pas être son
    // propre contre-exemple.
    if (
      file === path.join("tests", "unit", "typographie.test.ts") ||
      IGNORED_FILES.has(file)
    ) {
      continue
    }
    const isMarkdown = path.extname(file) === ".md"
    const lines = readFileSync(path.join(root, file), "utf8").split("\n")
    lines.forEach((line, index) => {
      const scanned = isMarkdown ? stripCodeSpans(line) : line
      if (scanned.includes(char)) {
        found.push(`${file}:${index + 1}  ${line.trim().slice(0, 100)}`)
      }
    })
  }
  return found
}

describe("typographie", () => {
  it("balaie un ensemble de fichiers non vide, sinon le test ne prouverait rien", () => {
    expect(files.length).toBeGreaterThan(60)
    expect(files.some((file) => file.startsWith("lib/content/"))).toBe(true)
    expect(files).toContain("CLAUDE.md")
  })

  for (const { char, name } of FORBIDDEN) {
    it(`n'utilise aucun ${name} dans le code, le contenu ou la documentation`, () => {
      expect(offences(char)).toEqual([])
    })
  }

  it("ne laisse pas l'exemption Markdown couvrir un usage réel", () => {
    // Garde-fou de la fonction d'exemption : un caractère nommé entre accents
    // graves passe, le même employé comme séparateur est vu.
    expect(stripCodeSpans("la règle interdit `\u2014` partout")).not.toContain(
      "\u2014"
    )
    expect(stripCodeSpans("Projet \u2014 Version 1")).toContain("\u2014")
  })
})
