import { describe } from "vitest"

import { write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"

/**
 * La base est-elle joignable ?
 *
 * Le contrôle est fait une seule fois par processus. S'il échoue, les suites
 * concernées sont mises en **attente** et non en échec : un poste sans Docker
 * doit pouvoir faire tourner `pnpm test` sans voir rouge, et l'attente est un
 * signal honnête - « non vérifié » plutôt que « vérifié bon ».
 */
let reachable: Promise<boolean> | null = null

export function isDbReachable() {
  reachable ??= (async () => {
    try {
      await write.row("list_users")
      return true
    } catch {
      await closePool().catch(() => {})
      return false
    }
  })()
  return reachable
}

const available = await isDbReachable()

/**
 * `describe` qui se met en attente quand la base est absente.
 * À utiliser pour toute suite qui touche à MariaDB.
 */
export const describeDb = available ? describe : describe.skip.bind(describe)

if (!available) {
  console.warn(
    "\nBase injoignable : les tests d'intégration sont en attente. `pnpm db:up` pour les activer.\n"
  )
}

/**
 * Le domaine des comptes jetables. Il ne peut appartenir à personne - `.test` est
 * réservé par la RFC 2606 - ce qui rend le nettoyage sans danger.
 */
export const TEST_DOMAIN = "@heliara.test"

/** Une adresse unique par test, pour que deux exécutions ne se gênent pas. */
export function uniqueEmail(prefix = "test") {
  const suffix = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${suffix}${TEST_DOMAIN}`
}

/**
 * Retient les comptes créés par un test, pour les retirer ensuite.
 *
 * Sans cela, chaque exécution laissait une cinquantaine de comptes derrière elle -
 * 280 après une journée. Le dashboard les afficherait tous.
 */
const created: Buffer[] = []

export function trackUser(id: Buffer) {
  created.push(id)
  return id
}

/**
 * Supprime les comptes créés pendant la suite.
 *
 * Le nettoyage se fait en fin de fichier, pas après chaque test : plusieurs tests
 * ont besoin de deux administrateurs actifs simultanément, et `delete_user` refuse
 * de retirer le dernier. Un échec de suppression est ignoré - un test qui a déjà
 * échoué ne doit pas en masquer la cause avec une erreur de ménage.
 */
export async function cleanupUsers() {
  for (const id of created.reverse()) {
    await write.void("delete_user", [id, null, null]).catch(() => {})
  }
  created.length = 0
}

/** Un faux condensé argon2id : la base ne le vérifie jamais, seule sa forme compte. */
export const FAKE_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000"
