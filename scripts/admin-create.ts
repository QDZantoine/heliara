/**
 * Crée le premier compte d'administration.
 *
 * `pnpm admin:create` - le mot de passe est demandé à la saisie, sans écho, et
 * n'apparaît donc ni dans l'historique du shell ni dans la liste des processus.
 * C'est la raison pour laquelle aucun identifiant ne figure dans le dépôt.
 *
 * La commande sert aussi à ajouter un compte ensuite : elle n'a rien de propre au
 * premier.
 */
import "@/scripts/env"

import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"

import { BusinessError, write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"
import { toUuid } from "@/lib/db/id"
import { hashPassword } from "@/lib/auth/password"
import { accountSchema } from "@/lib/schemas/admin"

/**
 * Une seule interface pour tout le script.
 *
 * En ouvrir une par question paraît plus simple, mais `close()` abandonne ce qui
 * reste du tampon d'entrée : la deuxième question ne recevrait jamais sa réponse
 * dès que l'entrée n'est pas un terminal.
 */
const rl = createInterface({ input: stdin, output: stdout })

/**
 * Masque la frappe. `readline` n'offre rien pour cela : on intercepte son
 * écriture de sortie le temps de la question.
 *
 * `_writeToOutput` n'existe qu'en mode terminal. Quand l'entrée est un tuyau -
 * une exécution scriptée, un test - il n'y a de toute façon aucun écho à masquer :
 * on ne patche rien et la fonction se contente de lire.
 */
const output = rl as unknown as {
  _writeToOutput?: (text: string) => void
}
let masking = false

if (typeof output._writeToOutput === "function") {
  const writeOutput = output._writeToOutput.bind(output)
  output._writeToOutput = (text: string) => {
    // Le retour à la ligne passe toujours, sinon l'invite suivante resterait collée.
    writeOutput(masking ? (text.includes("\n") ? "\n" : "") : text)
  }
}

/**
 * Les lignes sont tirées d'un itérateur, et non de `rl.question`.
 *
 * `question` ne fonctionne que sur un terminal : quand l'entrée est un tuyau,
 * readline émet ses évènements `line` pour tout le contenu d'un coup, et seule la
 * première question en voit un - les suivantes attendent indéfiniment. L'itérateur
 * consomme la file, donc il se comporte pareil dans les deux cas. Contrepartie :
 * l'invite est écrite à la main.
 */
const lines = rl[Symbol.asyncIterator]()

async function readLine(): Promise<string> {
  const { value, done } = await lines.next()
  if (done) {
    throw new Error("Saisie interrompue.")
  }
  return String(value).trim()
}

async function ask(question: string): Promise<string> {
  stdout.write(question)
  return readLine()
}

async function askHidden(question: string): Promise<string> {
  stdout.write(question)
  masking = true
  try {
    return await readLine()
  } finally {
    masking = false
    stdout.write("\n")
  }
}

async function main() {
  stdout.write("\nCréation d'un compte d'administration Heliara.\n\n")

  const email = await ask("Adresse e-mail   : ")
  const displayName = await ask("Nom affiché      : ")
  const password = await askHidden("Mot de passe     : ")
  const confirm = await askHidden("Confirmation     : ")

  if (password !== confirm) {
    throw new Error("Les deux saisies ne correspondent pas.")
  }

  // Le même schéma que le formulaire : une seule définition des règles.
  const parsed = accountSchema.safeParse({
    email,
    displayName,
    password,
    role: "admin",
  })

  if (!parsed.success) {
    const messages = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join(".") || "champ"} : ${issue.message}`
    )
    throw new Error(`Saisie refusée :\n${messages.join("\n")}`)
  }

  const row = await write.row<{ id: Buffer; email: string }>("create_user", [
    parsed.data.email,
    await hashPassword(parsed.data.password),
    parsed.data.displayName,
    parsed.data.role,
    null,
    null,
  ])

  stdout.write(`\nCompte créé.\n`)
  stdout.write(`  adresse : ${row!.email}\n`)
  stdout.write(`  id      : ${toUuid(row!.id)}\n`)
  stdout.write(`\nConnexion : /admin/login\n\n`)
}

main()
  .catch((error) => {
    if (error instanceof BusinessError && error.code === "EMAIL_ALREADY_USED") {
      stdout.write("\nCette adresse a déjà un compte.\n\n")
    } else {
      stdout.write(`\n${error instanceof Error ? error.message : error}\n\n`)
    }
    process.exitCode = 1
  })
  .finally(async () => {
    rl.close()
    await closePool()
  })
