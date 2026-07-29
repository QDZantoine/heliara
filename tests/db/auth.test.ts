import { createHash, randomBytes } from "node:crypto"
import { afterAll, expect, it } from "vitest"

import { BusinessError, write } from "@/lib/db/call"
import { isVersion7, toHex, toUuid } from "@/lib/db/id"
import { closePool } from "@/lib/db/pool"
import {
  FAKE_HASH,
  cleanupUsers,
  describeDb,
  trackUser,
  uniqueEmail,
} from "@/tests/db/helpers"

/**
 * Tests d'intégration des procédures d'authentification.
 *
 * Tout passe par `app_exec`, qui ne dispose que d'`EXECUTE` : ce que ces tests
 * vérifient, c'est donc à la fois le comportement des procédures **et** le fait
 * qu'elles soient atteignables sans aucun droit de table.
 */

type UserRow = {
  id: Buffer
  email: string
  display_name: string
  role: string
  suspended_at: number | null
  password_hash?: string
}

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")
const newToken = () => randomBytes(32).toString("base64url")
const inOneHour = () => Math.floor(Date.now() / 1000) + 3600

/** Crée un compte jetable et rend sa ligne. */
async function makeUser(role = "admin") {
  const email = uniqueEmail()
  const row = await write.row<UserRow>("create_user", [
    email,
    FAKE_HASH,
    "Compte de test",
    role,
    null,
    "127.0.0.1",
  ])
  expect(row).not.toBeNull()
  trackUser(row!.id)
  return row!
}

afterAll(async () => {
  await cleanupUsers()
  await closePool()
})

describeDb("create_user", () => {
  it("crée un compte et rend la ligne écrite", async () => {
    const email = uniqueEmail()
    const row = await write.row<UserRow>("create_user", [
      email,
      FAKE_HASH,
      "Léa Roussel",
      "admin",
      null,
      "127.0.0.1",
    ])

    trackUser(row!.id)
    expect(row?.email).toBe(email)
    expect(row?.display_name).toBe("Léa Roussel")
    expect(row?.role).toBe("admin")
  })

  it("produit un identifiant BINARY(16), UUID v7, horodaté en tête", async () => {
    const before = Date.now()
    const row = await makeUser()

    expect(Buffer.isBuffer(row.id)).toBe(true)
    expect(row.id).toHaveLength(16)
    expect(isVersion7(row.id)).toBe(true)
    expect(toHex(row.id)).toMatch(/^[0-9a-f]{32}$/)
    expect(toUuid(row.id)).toMatch(/^[0-9a-f-]{36}$/)
    // L'horodatage de tête doit encadrer l'instant de création.
    const stamp = row.id.readUIntBE(0, 6)
    expect(stamp).toBeGreaterThanOrEqual(before - 2000)
    expect(stamp).toBeLessThanOrEqual(Date.now() + 2000)
  })

  it("trie deux identifiants successifs dans leur ordre de création", async () => {
    const first = await makeUser()
    const second = await makeUser()
    // C'est la propriété qui donne la localité d'insertion InnoDB.
    expect(toHex(second.id) > toHex(first.id)).toBe(true)
  })

  it("refuse une adresse déjà prise, en erreur métier typée", async () => {
    const existing = await makeUser()
    await expect(
      write.row("create_user", [
        existing.email,
        FAKE_HASH,
        "Doublon",
        "admin",
        null,
        "127.0.0.1",
      ])
    ).rejects.toThrow(BusinessError)

    await expect(
      write.row("create_user", [
        existing.email,
        FAKE_HASH,
        "Doublon",
        "admin",
        null,
        null,
      ])
    ).rejects.toMatchObject({ code: "EMAIL_ALREADY_USED" })
  })

  it("laisse le rôle à administrateur quand il n'est pas précisé", async () => {
    const row = await write.row<UserRow>("create_user", [
      uniqueEmail(),
      FAKE_HASH,
      "Sans rôle",
      null,
      null,
      null,
    ])
    trackUser(row!.id)
    expect(row?.role).toBe("admin")
  })

  it("journalise la création, le compte étant son propre acteur", async () => {
    const row = await makeUser()
    const entries = await write.rows<{
      action: string
      actor_id: Buffer
      new_value: string
    }>("list_audit", ["user", row.id, 10, 0])

    const created = entries.find((entry) => entry.action === "user.create")
    expect(created).toBeDefined()
    expect(toHex(created!.actor_id)).toBe(toHex(row.id))
    expect(JSON.parse(created!.new_value)).toMatchObject({
      email: row.email,
      role: "admin",
    })
  })
})

describeDb("get_user_for_login", () => {
  it("rend l'empreinte du mot de passe, que seule l'application sait vérifier", async () => {
    const created = await makeUser()
    const row = await write.row<UserRow>("get_user_for_login", [created.email])
    expect(row?.password_hash).toBe(FAKE_HASH)
  })

  it("rend zéro ligne sur une adresse inconnue, sans lever", async () => {
    const row = await write.row("get_user_for_login", ["personne@heliara.test"])
    expect(row).toBeNull()
  })

  it("rend aussi un compte suspendu : l'ordre des contrôles est à l'appelant", async () => {
    const created = await makeUser()
    await makeUser() // il faut un autre administrateur actif pour suspendre
    await write.void("set_user_suspended", [created.id, 1, created.id, null])

    const row = await write.row<UserRow>("get_user_for_login", [created.email])
    // Refuser tôt sur la suspension révélerait l'existence du compte à qui ne
    // connaît pas le mot de passe.
    expect(row).not.toBeNull()
    expect(row?.suspended_at).not.toBeNull()
  })
})

describeDb("sessions", () => {
  it("ouvre une session et la retrouve par l'empreinte de son jeton", async () => {
    const user = await makeUser()
    const token = newToken()

    const session = await write.row<{ id: Buffer; expires_at: number }>(
      "create_session",
      [user.id, hashToken(token), inOneHour(), "127.0.0.1", "vitest"]
    )
    expect(session).not.toBeNull()

    const found = await write.row<{
      session_id: Buffer
      user_id: Buffer
      email: string
      role: string
    }>("get_session", [hashToken(token)])

    expect(found?.email).toBe(user.email)
    expect(toHex(found!.user_id)).toBe(toHex(user.id))
    expect(toHex(found!.session_id)).toBe(toHex(session!.id))
  })

  it("ne stocke jamais le jeton en clair : seul son SHA-256 ouvre la session", async () => {
    const user = await makeUser()
    const token = newToken()
    await write.row("create_session", [
      user.id,
      hashToken(token),
      inOneHour(),
      null,
      null,
    ])

    // Le jeton brut ne vaut rien contre la base : il faut l'empreinte.
    expect(await write.row("get_session", [token])).toBeNull()
    expect(await write.row("get_session", [hashToken(token)])).not.toBeNull()
  })

  it("ignore une session expirée : le filtre est dans la procédure, pas dans l'appelant", async () => {
    const user = await makeUser()
    const token = newToken()
    const past = Math.floor(Date.now() / 1000) - 60

    await write.row("create_session", [
      user.id,
      hashToken(token),
      past,
      null,
      null,
    ])
    expect(await write.row("get_session", [hashToken(token)])).toBeNull()
  })

  it("ignore la session d'un compte suspendu, sans avoir à la supprimer", async () => {
    const user = await makeUser()
    await makeUser()
    const token = newToken()
    await write.row("create_session", [
      user.id,
      hashToken(token),
      inOneHour(),
      null,
      null,
    ])

    await write.void("set_user_suspended", [user.id, 1, user.id, null])
    expect(await write.row("get_session", [hashToken(token)])).toBeNull()
  })

  it("refuse d'ouvrir une session pour un compte suspendu", async () => {
    const user = await makeUser()
    await makeUser()
    await write.void("set_user_suspended", [user.id, 1, user.id, null])

    await expect(
      write.row("create_session", [
        user.id,
        hashToken(newToken()),
        inOneHour(),
        null,
        null,
      ])
    ).rejects.toMatchObject({ code: "USER_NOT_ACTIVE" })
  })

  it("note la dernière connexion sur le compte", async () => {
    const user = await makeUser()
    const before = await write.row<{ last_login_at: number | null }>(
      "get_user",
      [user.id]
    )
    expect(before?.last_login_at).toBeNull()

    await write.row("create_session", [
      user.id,
      hashToken(newToken()),
      inOneHour(),
      null,
      null,
    ])
    const after = await write.row<{ last_login_at: number | null }>(
      "get_user",
      [user.id]
    )
    expect(after?.last_login_at).toBeGreaterThan(0)
  })

  it("purge les sessions expirées du compte à l'ouverture d'une nouvelle", async () => {
    const user = await makeUser()
    const stale = newToken()
    const past = Math.floor(Date.now() / 1000) - 60

    await write.row("create_session", [
      user.id,
      hashToken(stale),
      past,
      null,
      null,
    ])
    await write.row("create_session", [
      user.id,
      hashToken(newToken()),
      inOneHour(),
      null,
      null,
    ])

    // L'entretien se fait au fil de l'eau, sans tâche planifiée à surveiller.
    const sessions = await write.rows("list_audit", ["session", null, 5, 0])
    expect(sessions.length).toBeGreaterThan(0)
    expect(await write.row("get_session", [hashToken(stale)])).toBeNull()
  })

  it("prolonge une session active", async () => {
    const user = await makeUser()
    const token = newToken()
    const soon = Math.floor(Date.now() / 1000) + 60

    await write.row("create_session", [
      user.id,
      hashToken(token),
      soon,
      null,
      null,
    ])
    const later = inOneHour()
    await write.void("touch_session", [hashToken(token), later])

    const found = await write.row<{ expires_at: number }>("get_session", [
      hashToken(token),
    ])
    expect(Number(found?.expires_at)).toBe(later)
  })

  it("ne raccourcit jamais une session en la prolongeant", async () => {
    const user = await makeUser()
    const token = newToken()
    const far = inOneHour()

    await write.row("create_session", [
      user.id,
      hashToken(token),
      far,
      null,
      null,
    ])
    await write.void("touch_session", [
      hashToken(token),
      Math.floor(Date.now() / 1000) + 10,
    ])

    const found = await write.row<{ expires_at: number }>("get_session", [
      hashToken(token),
    ])
    expect(Number(found?.expires_at)).toBe(far)
  })

  it("ne ressuscite pas une session expirée", async () => {
    const user = await makeUser()
    const token = newToken()
    const past = Math.floor(Date.now() / 1000) - 60

    await write.row("create_session", [
      user.id,
      hashToken(token),
      past,
      null,
      null,
    ])
    await write.void("touch_session", [hashToken(token), inOneHour()])
    expect(await write.row("get_session", [hashToken(token)])).toBeNull()
  })

  it("ferme une session, et reste silencieuse sur un jeton inconnu", async () => {
    const user = await makeUser()
    const token = newToken()
    await write.row("create_session", [
      user.id,
      hashToken(token),
      inOneHour(),
      null,
      null,
    ])

    await write.void("delete_session", [hashToken(token)])
    expect(await write.row("get_session", [hashToken(token)])).toBeNull()
    // La déconnexion est idempotente : la rejouer ne doit pas lever.
    await expect(
      write.void("delete_session", [hashToken(token)])
    ).resolves.toBeUndefined()
  })

  it("ferme toutes les sessions d'un compte d'un coup", async () => {
    const user = await makeUser()
    const tokens = [newToken(), newToken(), newToken()]
    for (const token of tokens) {
      await write.row("create_session", [
        user.id,
        hashToken(token),
        inOneHour(),
        null,
        null,
      ])
    }

    await write.void("delete_user_sessions", [user.id, user.id, "127.0.0.1"])
    for (const token of tokens) {
      expect(await write.row("get_session", [hashToken(token)])).toBeNull()
    }
  })
})

describeDb("set_user_password", () => {
  it("change l'empreinte et révoque toutes les sessions ouvertes", async () => {
    const user = await makeUser()
    const token = newToken()
    await write.row("create_session", [
      user.id,
      hashToken(token),
      inOneHour(),
      null,
      null,
    ])

    await write.void("set_user_password", [
      user.id,
      `${FAKE_HASH}modifie`,
      user.id,
      "127.0.0.1",
    ])

    const row = await write.row<UserRow>("get_user_for_login", [user.email])
    expect(row?.password_hash).toBe(`${FAKE_HASH}modifie`)
    // Ce qui avait été ouvert avec l'ancien mot de passe ne vaut plus.
    expect(await write.row("get_session", [hashToken(token)])).toBeNull()
  })

  it("signale un compte inexistant", async () => {
    await expect(
      write.void("set_user_password", [Buffer.alloc(16), FAKE_HASH, null, null])
    ).rejects.toMatchObject({ code: "USER_NOT_FOUND" })
  })
})

describeDb("set_user_suspended", () => {
  it("suspend puis réactive", async () => {
    const user = await makeUser()
    await makeUser()

    await write.void("set_user_suspended", [user.id, 1, user.id, null])
    let row = await write.row<UserRow>("get_user", [user.id])
    expect(row?.suspended_at).toBeGreaterThan(0)

    await write.void("set_user_suspended", [user.id, 0, user.id, null])
    row = await write.row<UserRow>("get_user", [user.id])
    expect(row?.suspended_at).toBeNull()
  })

  it("journalise la suspension et la réactivation sous deux actions distinctes", async () => {
    const user = await makeUser()
    await makeUser()
    await write.void("set_user_suspended", [user.id, 1, user.id, null])
    await write.void("set_user_suspended", [user.id, 0, user.id, null])

    const actions = (
      await write.rows<{ action: string }>("list_audit", [
        "user",
        user.id,
        10,
        0,
      ])
    ).map((entry) => entry.action)
    expect(actions).toContain("user.suspend")
    expect(actions).toContain("user.restore")
  })

  it("signale un compte inexistant", async () => {
    await expect(
      write.void("set_user_suspended", [Buffer.alloc(16), 1, null, null])
    ).rejects.toMatchObject({ code: "USER_NOT_FOUND" })
  })
})

describeDb("réinitialisation de mot de passe", () => {
  it("enregistre une demande et rend le compte concerné", async () => {
    const user = await makeUser()
    const token = newToken()

    const row = await write.row<{ email: string }>("create_password_reset", [
      user.email,
      hashToken(token),
      inOneHour(),
      "127.0.0.1",
    ])
    expect(row?.email).toBe(user.email)
  })

  it("ne dit rien d'une adresse inconnue : le formulaire n'énumère pas les comptes", async () => {
    const row = await write.row("create_password_reset", [
      "personne@heliara.test",
      hashToken(newToken()),
      inOneHour(),
      null,
    ])
    // Zéro ligne, et surtout aucune erreur : la réponse est indiscernable.
    expect(row).toBeNull()
  })

  it("consomme le jeton, pose le mot de passe et révoque les sessions", async () => {
    const user = await makeUser()
    const session = newToken()
    await write.row("create_session", [
      user.id,
      hashToken(session),
      inOneHour(),
      null,
      null,
    ])

    const token = newToken()
    await write.row("create_password_reset", [
      user.email,
      hashToken(token),
      inOneHour(),
      null,
    ])

    const row = await write.row<{ email: string }>("reset_password", [
      hashToken(token),
      `${FAKE_HASH}neuf`,
      "127.0.0.1",
    ])
    expect(row?.email).toBe(user.email)

    const login = await write.row<UserRow>("get_user_for_login", [user.email])
    expect(login?.password_hash).toBe(`${FAKE_HASH}neuf`)
    expect(await write.row("get_session", [hashToken(session)])).toBeNull()
  })

  it("ne laisse pas rejouer un jeton déjà consommé", async () => {
    const user = await makeUser()
    const token = newToken()
    await write.row("create_password_reset", [
      user.email,
      hashToken(token),
      inOneHour(),
      null,
    ])
    await write.row("reset_password", [hashToken(token), FAKE_HASH, null])

    await expect(
      write.row("reset_password", [hashToken(token), FAKE_HASH, null])
    ).rejects.toMatchObject({ code: "RESET_TOKEN_INVALID" })
  })

  it("refuse un jeton expiré", async () => {
    const user = await makeUser()
    const token = newToken()
    await write.row("create_password_reset", [
      user.email,
      hashToken(token),
      Math.floor(Date.now() / 1000) - 60,
      null,
    ])

    await expect(
      write.row("reset_password", [hashToken(token), FAKE_HASH, null])
    ).rejects.toMatchObject({ code: "RESET_TOKEN_INVALID" })
  })

  it("refuse un jeton inconnu", async () => {
    await expect(
      write.row("reset_password", [hashToken(newToken()), FAKE_HASH, null])
    ).rejects.toMatchObject({ code: "RESET_TOKEN_INVALID" })
  })

  it("invalide le jeton en cours quand le mot de passe change par ailleurs", async () => {
    const user = await makeUser()
    const token = newToken()
    await write.row("create_password_reset", [
      user.email,
      hashToken(token),
      inOneHour(),
      null,
    ])

    await write.void("set_user_password", [user.id, otherHash(), null, null])
    await expect(
      write.row("reset_password", [hashToken(token), FAKE_HASH, null])
    ).rejects.toMatchObject({ code: "RESET_TOKEN_INVALID" })
  })
})

/** Une empreinte différente de FAKE_HASH, pour distinguer deux écritures. */
function otherHash() {
  return `${FAKE_HASH}autre`
}

describeDb("étanchéité de app_exec", () => {
  it("ne peut lire aucune table en direct, même celle qu'il vient d'écrire", async () => {
    const { getPool } = await import("@/lib/db/pool")
    await expect(
      getPool().query("SELECT COUNT(*) FROM `user`")
    ).rejects.toThrow(/denied|command denied/i)
  })

  it("ne peut pas créer de table", async () => {
    const { getPool } = await import("@/lib/db/pool")
    await expect(
      getPool().query("CREATE TABLE porte_derobee (a INT)")
    ).rejects.toThrow(/denied/i)
  })

  it("refuse un nom de procédure qui n'en est pas un", async () => {
    await expect(write.row("list_users; DROP TABLE `user`")).rejects.toThrow(
      /Nom de procédure invalide/
    )
  })
})
