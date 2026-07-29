import { afterAll, beforeEach, expect, it, vi } from "vitest"

import { describeDb } from "@/tests/db/helpers"

/**
 * La séparation lecture / écriture, vérifiée là où elle compte : contre la vraie
 * base, avec les vrais comptes.
 *
 * Ce fichier est le seul à ouvrir un pool en rôle `read`. Il recharge les modules
 * entre les tests parce que le rôle est lu au moment d'ouvrir le pool et que celui-ci
 * est mémorisé.
 */

/**
 * Un refus de privilège est une panne technique, pas une erreur métier : la couche
 * d'accès l'enveloppe donc dans `DatabaseError` et garde l'original dans `cause`.
 * C'est voulu - le détail SQL ne doit pas se retrouver dans un message affichable.
 *
 * Le type est reconnu par son nom et non par son identité : `vi.resetModules()`
 * recharge `lib/db/call`, si bien que la classe levée n'est pas celle qu'un import
 * en tête de fichier aurait capturée.
 */
async function expectDenied(work: Promise<unknown>, label: string) {
  const error = await work.then(
    () => null,
    (caught: unknown) => caught as Error & { cause?: Error }
  )
  expect(error, `${label} aurait dû être refusée`).not.toBeNull()
  expect(error!.name, label).toBe("DatabaseError")
  expect(error!.cause?.message, label).toMatch(/denied/i)
}

async function freshDb(role: "read" | "write") {
  vi.resetModules()
  process.env.HELIARA_ROLE = role
  const [call, pool] = await Promise.all([
    import("@/lib/db/call"),
    import("@/lib/db/pool"),
  ])
  return { ...call, ...pool }
}

beforeEach(() => {
  process.env.HELIARA_ROLE = "write"
})

afterAll(async () => {
  process.env.HELIARA_ROLE = "write"
  const { closePool } = await import("@/lib/db/pool")
  await closePool()
})

describeDb("le compte de lecture", () => {
  it("peut lire la surface publique", async () => {
    const { read, closePool } = await freshDb("read")
    // Ne lève pas : c'est tout ce qu'on demande. La liste peut être vide.
    await expect(read.rows("pub_list_case_studies")).resolves.toBeInstanceOf(
      Array
    )
    await closePool()
  })

  it("ne peut appeler aucune procédure d'écriture", async () => {
    const { read, closePool } = await freshDb("read")

    for (const procedure of [
      "create_case_study",
      "update_case_study",
      "delete_case_study",
      "publish_case_study",
      "reorder_case_studies",
      "set_case_chapters",
      "create_user",
      "set_user_password",
      "create_session",
      "delete_session",
    ]) {
      await expectDenied(
        read.void(procedure, [null, null, null, null, null, null]),
        procedure
      )
    }

    await closePool()
  })

  it("ne peut pas voir les brouillons : la procédure qui les montre lui est fermée", async () => {
    const { read, closePool } = await freshDb("read")
    // `list_case_studies(NULL)` rendrait tout, publié comme brouillon. Le compte
    // de lecture n'a pas le droit de l'appeler, et `pub_list_case_studies` n'a
    // aucun paramètre pour demander autre chose que le publié.
    await expectDenied(
      read.rows("list_case_studies", [null]),
      "list_case_studies"
    )
    await closePool()
  })

  it("ne peut ni lire ni écrire une table en direct", async () => {
    const { getPool, closePool } = await freshDb("read")
    const pool = getPool("read")

    await expect(pool.query("SELECT COUNT(*) FROM case_study")).rejects.toThrow(
      /denied/i
    )
    await expect(
      pool.query("UPDATE case_study SET status = 'published'")
    ).rejects.toThrow(/denied/i)
    await expect(pool.query("CREATE TABLE t (a INT)")).rejects.toThrow(
      /denied/i
    )

    await closePool()
  })

  it("ne peut pas lire le journal d'audit ni la table des comptes", async () => {
    const { read, getPool, closePool } = await freshDb("read")
    await expectDenied(
      read.rows("list_audit", [null, null, 10, 0]),
      "list_audit"
    )
    await expectDenied(read.rows("list_users"), "list_users")
    await expect(
      getPool("read").query("SELECT email FROM `user`")
    ).rejects.toThrow(/denied/i)
    await closePool()
  })
})

describeDb("le garde-fou de rôle", () => {
  it("refuse d'ouvrir le pool d'écriture dans un processus de lecture", async () => {
    const { getPool, closePool } = await freshDb("read")
    // Deuxième barrière : même un chemin de code du site public qui tenterait
    // d'écrire échoue avant d'ouvrir la moindre connexion.
    expect(() => getPool("write")).toThrow(/rôle « read »/)
    await closePool()
  })

  it("l'ouvre dans un processus d'écriture", async () => {
    const { getPool, closePool } = await freshDb("write")
    expect(() => getPool("write")).not.toThrow()
    await closePool()
  })

  it("retombe sur la lecture quand le rôle n'est pas configuré", async () => {
    vi.resetModules()
    delete process.env.HELIARA_ROLE
    const { currentRole } = await import("@/lib/db/pool")
    // Un oubli de configuration doit dégrader vers moins de droits, jamais vers
    // plus.
    expect(currentRole()).toBe("read")
  })

  it("ne reconnaît que la valeur exacte « write »", async () => {
    for (const value of ["WRITE", "true", "1", "admin", ""]) {
      vi.resetModules()
      process.env.HELIARA_ROLE = value
      const { currentRole } = await import("@/lib/db/pool")
      expect(currentRole(), value).toBe("read")
    }
  })
})
