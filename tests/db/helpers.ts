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

/** Une adresse unique par test, pour que deux exécutions ne se gênent pas. */
export function uniqueEmail(prefix = "test") {
  const suffix = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${suffix}@heliara.test`
}

/** Un faux condensé argon2id : la base ne le vérifie jamais, seule sa forme compte. */
export const FAKE_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000"
