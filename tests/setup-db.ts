import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

/**
 * Les tests d'intégration parlent à la vraie base : ils ont donc besoin du `.env`,
 * que Next charge tout seul mais pas vitest.
 *
 * L'analyse est volontairement minimale - `CLE=valeur`, une par ligne - parce que
 * c'est exactement la forme de notre fichier, et que cela évite une dépendance
 * de plus pour lire dix lignes.
 */
const root = path.resolve(import.meta.dirname, "..")
const file = path.join(root, ".env")

if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) {
      process.env[match[1]] ??= match[2].trim()
    }
  }
}

/**
 * Les tests d'intégration exercent l'administration : ils tournent donc en rôle
 * d'écriture. Sans cela, `getPool("write")` refuserait de s'ouvrir - ce qui est
 * précisément la garde que l'on veut en production.
 */
process.env.HELIARA_ROLE = "write"
