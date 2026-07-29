/**
 * Charge `.env` dans `process.env` pour les commandes en ligne de commande.
 *
 * Next le fait tout seul, `tsx` non. L'analyse est volontairement minimale -
 * `CLE=valeur`, une par ligne - parce que c'est la forme de notre fichier, et que
 * cela évite une dépendance de plus pour lire vingt lignes. Les valeurs déjà
 * présentes dans l'environnement gagnent, ce qui permet de surcharger à l'appel.
 */
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

const file = path.resolve(process.cwd(), ".env")

if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) {
      process.env[match[1]] ??= match[2].trim()
    }
  }
}
