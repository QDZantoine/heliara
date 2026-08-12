/**
 * Réinitialise le mot de passe d'un compte d'administration.
 *
 * `pnpm admin:password` - le mot de passe est demandé à la saisie, sans écho, comme
 * pour `admin:create` : il n'apparaît donc ni dans l'historique du shell ni dans la
 * liste des processus.
 *
 * **C'est la seule voie de secours, et c'est pourquoi elle existe.** L'administration
 * n'a pas d'écran de gestion des comptes et le site n'envoie aucun courriel de
 * réinitialisation : sans cette commande, un mot de passe oublié se contourne en
 * créant un second compte, et le premier reste ouvert sans que personne ne puisse
 * s'en servir ni le fermer.
 *
 * `set_user_password` **révoque toutes les sessions du compte** au passage. Une
 * session volée ne survit donc pas au changement, ce qui est le comportement attendu
 * d'une réinitialisation.
 */
import "@/scripts/env"

import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"

import { BusinessError, write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"
import { toUuid } from "@/lib/db/id"
import { hashPassword } from "@/lib/auth/password"
import { passwordSchema } from "@/lib/schemas/admin"

/**
 * Une seule interface pour tout le script - même raison que dans `admin-create` :
 * `close()` abandonne ce qui reste du tampon d'entrée, donc en ouvrir une par
 * question ferait attendre la deuxième indéfiniment dès que l'entrée est un tuyau.
 */
const rl = createInterface({ input: stdin, output: stdout })

const output = rl as unknown as {
  _writeToOutput?: (text: string) => void
}
let masking = false

if (typeof output._writeToOutput === "function") {
  const writeOutput = output._writeToOutput.bind(output)
  output._writeToOutput = (text: string) => {
    writeOutput(masking ? (text.includes("\n") ? "\n" : "") : text)
  }
}

/** Les lignes viennent d'un itérateur, qui se comporte pareil sur terminal et sur tuyau. */
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
  stdout.write("\nRéinitialisation d'un mot de passe d'administration.\n\n")

  const email = await ask("Adresse e-mail   : ")

  /*
    `get_user_for_login` plutôt qu'une recherche par identifiant : on connaît une
    adresse, pas seize octets. Cette procédure rend aussi l'empreinte actuelle, qui
    ne sert pas ici - on ne la lit pas.
  */
  const user = await write.row<{
    id: Buffer
    email: string
    display_name: string
    suspended_at: number | null
  }>("get_user_for_login", [email])

  if (!user) {
    throw new Error(
      `Aucun compte à cette adresse. « pnpm admin:create » en crée un.`
    )
  }

  stdout.write(`  compte           : ${user.display_name}\n`)
  if (user.suspended_at) {
    /*
      Dit et non refusé : changer le mot de passe d'un compte suspendu est licite,
      mais il ne pourra toujours pas se connecter. Le taire ferait chercher longtemps.
    */
    stdout.write(
      "  ⚠ ce compte est suspendu : le nouveau mot de passe ne suffira pas à le rouvrir.\n"
    )
  }
  stdout.write("\n")

  const password = await askHidden("Nouveau mot de passe : ")
  const confirm = await askHidden("Confirmation         : ")

  if (password !== confirm) {
    throw new Error("Les deux saisies ne correspondent pas.")
  }

  // Le même schéma que le formulaire d'administration : une seule définition de la règle.
  const parsed = passwordSchema.safeParse(password)
  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => `  - ${issue.message}`)
    throw new Error(`Saisie refusée :\n${messages.join("\n")}`)
  }

  /*
    L'acteur du journal d'audit est le compte lui-même : personne d'autre n'est
    identifiable ici, et attribuer l'écriture à `NULL` la rendrait anonyme dans un
    journal dont c'est précisément le sujet.
  */
  await write.void("set_user_password", [
    user.id,
    await hashPassword(parsed.data),
    user.id,
    null,
  ])

  stdout.write(`\nMot de passe changé.\n`)
  stdout.write(`  adresse : ${user.email}\n`)
  stdout.write(`  id      : ${toUuid(user.id)}\n`)
  stdout.write(`\nToutes les sessions de ce compte ont été révoquées.\n`)
  stdout.write(`Connexion : /admin/login\n\n`)
}

main()
  .catch((error) => {
    if (error instanceof BusinessError && error.code === "USER_NOT_FOUND") {
      stdout.write("\nCe compte n'existe plus.\n\n")
    } else {
      stdout.write(`\n${error instanceof Error ? error.message : error}\n\n`)
    }
    process.exitCode = 1
  })
  .finally(async () => {
    rl.close()
    await closePool()
  })
