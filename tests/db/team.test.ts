import { afterAll, beforeAll, expect, it } from "vitest"

import { write } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"
import { closePool } from "@/lib/db/pool"
import {
  FAKE_HASH,
  cleanupUsers,
  describeDb,
  trackUser,
  uniqueEmail,
} from "@/tests/db/helpers"

/**
 * Tests d'intégration de l'équipe.
 *
 * Ce qui mérite le plus d'attention ici est la **publication** : elle exige les deux
 * portraits, et c'est la seule exigence de ce genre du projet. La raison est qu'un
 * portrait manquant ne se voit qu'en basculant le thème, c'est-à-dire jamais avant
 * qu'un visiteur ne le voie.
 *
 * Le second point est la **répartition des spécialités**, qui passe par `member_id` et
 * non par l'ordre : un défaut déjà rencontré et corrigé, que ce fichier verrouille.
 */

type MemberRow = {
  id: Buffer
  name: string
  role: string
  initials: string
  bio: string
  is_partner: number
  position: number
  status: "draft" | "published"
  photo_light_media_id: Buffer | null
  photo_dark_media_id: Buffer | null
}

type SkillRow = { member_id: Buffer; label: string }

let actor: Buffer
const members: Buffer[] = []
const medias: Buffer[] = []

const unique = (prefix: string) =>
  `${prefix} ${Math.random().toString(36).slice(2, 10)}`

async function makeMember(name = unique("Personne")) {
  const row = await write.rowStrict<{ id: Buffer }>("create_team_member", [
    name,
    "Fonction de test",
    actor,
    null,
  ])
  members.push(row.id)
  return { id: row.id, name }
}

/**
 * Un média `ready`, sans octet derrière.
 *
 * La procédure ne vérifie que la ligne et son statut : rien n'exige qu'un objet existe
 * réellement dans le stockage, et déposer un fichier pour tester une contrainte de
 * publication serait payer cher une garantie que l'on n'obtiendrait pas.
 */
async function makeMedia() {
  const row = await write.rowStrict<{ id: Buffer }>("create_media", [
    `test/${Math.random().toString(36).slice(2, 10)}.png`,
    "heliara",
    "image/png",
    1024,
    800,
    800,
    "",
    "portrait.png",
    null,
    actor,
    null,
  ])
  await write.void("confirm_media", [row.id, 800, 800, 1024, actor, null])
  medias.push(row.id)
  return row.id
}

/** Remplit ce que la publication exige : initiales, parcours et les deux portraits. */
async function fillForPublication(id: Buffer, name: string) {
  const [light, dark] = [await makeMedia(), await makeMedia()]
  await write.void("update_team_member", [
    id,
    name,
    "Fonction de test",
    "XY",
    "Un parcours en une phrase, ce qui suffit à la contrainte.",
    0,
    light,
    dark,
    actor,
    null,
  ])
  return { light, dark }
}

beforeAll(async () => {
  const user = await write.rowStrict<{ id: Buffer }>("create_user", [
    uniqueEmail("team"),
    FAKE_HASH,
    "Acteur des tests",
    "admin",
    null,
    null,
  ])
  actor = trackUser(user.id)
})

afterAll(async () => {
  /*
    Les personnes d'abord, leurs médias ensuite : une ligne `media` référencée par un
    portrait ne peut pas partir la première. Les spécialités suivent la personne, la
    clé étrangère étant en `ON DELETE CASCADE`.

    Les échecs sont journalisés plutôt qu'avalés : un ménage silencieusement inefficace
    laisserait des personnes d'essai **publiées**, donc affichées sur le vrai site.
  */
  const complain = (step: string) => (error: unknown) => {
    const cause = (error as { cause?: Error }).cause
    console.warn(
      `Ménage (${step}) :`,
      cause?.message ?? (error as Error).message
    )
  }

  for (const id of members.reverse()) {
    await write
      .void("delete_team_member", [id, actor, null])
      .catch(complain("personne"))
  }
  for (const id of medias.reverse()) {
    await write.void("delete_media", [id, actor, null]).catch(complain("média"))
  }

  await cleanupUsers()
  await closePool()
})

describeDb("fiches", () => {
  it("crée une personne et la place après la dernière", async () => {
    const first = await makeMember()
    const second = await makeMember()
    const list = await write.rows<MemberRow>("list_team_members")
    const position = new Map(
      list.map((one) => [toHex(one.id), Number(one.position)])
    )
    expect(position.get(toHex(second.id))!).toBeGreaterThan(
      position.get(toHex(first.id))!
    )
  })

  it("refuse un nom déjà pris", async () => {
    const first = await makeMember()
    await expect(
      write.row("create_team_member", [first.name, "Doublon", actor, null])
    ).rejects.toMatchObject({ code: "NAME_TAKEN" })
  })

  it("refuse un nom ou une fonction vide", async () => {
    await expect(
      write.row("create_team_member", ["  ", "Fonction", actor, null])
    ).rejects.toMatchObject({ code: "NAME_REQUIRED" })
    await expect(
      write.row("create_team_member", [unique("Sans rôle"), " ", actor, null])
    ).rejects.toMatchObject({ code: "ROLE_REQUIRED" })
  })

  it("refuse un portrait qui n'a pas fini d'être envoyé", async () => {
    const member = await makeMember()
    const pending = await write.rowStrict<{ id: Buffer }>("create_media", [
      `test/${Math.random().toString(36).slice(2, 10)}.png`,
      "heliara",
      "image/png",
      1024,
      800,
      800,
      "",
      "interrompu.png",
      null,
      actor,
      null,
    ])
    medias.push(pending.id)
    await expect(
      write.void("update_team_member", [
        member.id,
        member.name,
        "Fonction de test",
        "XY",
        "Un parcours.",
        0,
        pending.id,
        null,
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "MEDIA_NOT_FOUND" })
  })
})

describeDb("spécialités", () => {
  it("remplace la liste en bloc et écarte les lignes vides", async () => {
    const member = await makeMember()
    await write.void("set_team_skills", [
      member.id,
      JSON.stringify([{ label: "Go" }, { label: "  " }, { label: "Rust" }]),
      actor,
      null,
    ])
    const mine = (await write.rows<SkillRow>("list_team_skills")).filter(
      (one) => toHex(one.member_id) === toHex(member.id)
    )
    expect(mine.map((one) => one.label)).toEqual(["Go", "Rust"])

    await write.void("set_team_skills", [
      member.id,
      JSON.stringify([{ label: "Elixir" }]),
      actor,
      null,
    ])
    const after = (await write.rows<SkillRow>("list_team_skills")).filter(
      (one) => toHex(one.member_id) === toHex(member.id)
    )
    expect(after.map((one) => one.label)).toEqual(["Elixir"])
  })

  it("répartit les puces par identifiant, pas par ordre", async () => {
    /*
      Le défaut que ce test verrouille : une première version de la couche de lecture
      distribuait les puces en suivant l'ordre des personnes, ce qui suppose de savoir
      où finit la liste de l'une. Deux personnes dont l'une a trois puces et l'autre
      une seule suffisent à le faire apparaître.
    */
    const one = await makeMember()
    const two = await makeMember()
    await write.void("set_team_skills", [
      one.id,
      JSON.stringify([{ label: "A" }, { label: "B" }, { label: "C" }]),
      actor,
      null,
    ])
    await write.void("set_team_skills", [
      two.id,
      JSON.stringify([{ label: "Z" }]),
      actor,
      null,
    ])

    const rows = await write.rows<SkillRow>("list_team_skills")
    const par = new Map<string, string[]>()
    for (const row of rows) {
      const key = toHex(row.member_id)
      par.set(key, [...(par.get(key) ?? []), row.label])
    }
    expect(par.get(toHex(one.id))).toEqual(["A", "B", "C"])
    expect(par.get(toHex(two.id))).toEqual(["Z"])
  })
})

describeDb("publication", () => {
  it("refuse sans initiales ni parcours", async () => {
    const member = await makeMember()
    await expect(
      write.void("publish_team_member", [member.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "MEMBER_INCOMPLETE" })
  })

  it("refuse quand un seul portrait est déposé", async () => {
    const member = await makeMember()
    const light = await makeMedia()
    await write.void("update_team_member", [
      member.id,
      member.name,
      "Fonction de test",
      "XY",
      "Un parcours.",
      0,
      light,
      null,
      actor,
      null,
    ])
    await expect(
      write.void("publish_team_member", [member.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "MEMBER_NO_PORTRAIT" })
  })

  it("accepte quand les deux portraits sont là, et sait retirer", async () => {
    const member = await makeMember()
    await fillForPublication(member.id, member.name)
    await write.void("publish_team_member", [member.id, 1, actor, null])

    const live = (await write.rows<MemberRow>("list_team_members")).find(
      (one) => toHex(one.id) === toHex(member.id)
    )
    expect(live?.status).toBe("published")

    await write.void("publish_team_member", [member.id, 0, actor, null])
    const back = (await write.rows<MemberRow>("list_team_members")).find(
      (one) => toHex(one.id) === toHex(member.id)
    )
    expect(back?.status).toBe("draft")
  })
})

describeDb("lecture publique", () => {
  it("ne rend que les personnes publiées, avec leurs puces", async () => {
    const draft = await makeMember()
    const live = await makeMember()
    await fillForPublication(live.id, live.name)
    await write.void("set_team_skills", [
      live.id,
      JSON.stringify([{ label: "Publique" }]),
      actor,
      null,
    ])
    await write.void("publish_team_member", [live.id, 1, actor, null])

    const sets = await write.sets("pub_list_team_members")
    const names = (sets[0] as MemberRow[]).map((one) => one.name)
    expect(names).toContain(live.name)
    expect(names).not.toContain(draft.name)

    const puces = (sets[1] as SkillRow[]).filter(
      (one) => toHex(one.member_id) === toHex(live.id)
    )
    expect(puces.map((one) => one.label)).toEqual(["Publique"])
  })

  it("emporte les spécialités avec la personne supprimée", async () => {
    const member = await makeMember()
    await write.void("set_team_skills", [
      member.id,
      JSON.stringify([{ label: "Éphémère" }]),
      actor,
      null,
    ])
    await write.void("delete_team_member", [member.id, actor, null])
    members.splice(members.indexOf(member.id), 1)

    const rows = await write.rows<SkillRow>("list_team_skills")
    expect(rows.some((one) => toHex(one.member_id) === toHex(member.id))).toBe(
      false
    )
  })

  it("réordonne, ce qui change la teinte déduite des pastilles", async () => {
    const first = await makeMember()
    const second = await makeMember()
    await write.void("reorder_team_members", [
      JSON.stringify([
        { id: toHex(second.id), position: 1 },
        { id: toHex(first.id), position: 2 },
      ]),
      actor,
      null,
    ])
    const list = await write.rows<MemberRow>("list_team_members")
    const position = new Map(
      list.map((one) => [toHex(one.id), Number(one.position)])
    )
    expect(position.get(toHex(second.id))).toBe(1)
    expect(position.get(toHex(first.id))).toBe(2)
  })
})
