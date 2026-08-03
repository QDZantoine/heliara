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
 * Tests d'intégration des témoignages.
 *
 * Ce qui mérite le plus d'attention ici est le **refus de publier sans trace d'accord**.
 * C'est la seule garantie que la base peut apporter contre le défaut d'origine - trois
 * verbatims inventés mis en ligne, attribués à des personnes nommées chez des entreprises
 * nommées. Elle ne prouve rien : elle oblige à déclarer.
 */

type Row = {
  id: Buffer
  quote: string
  author_name: string
  author_role: string
  initials: string
  consent_at: number | null
  consent_note: string
  case_study_id: Buffer | null
  position: number
  status: "draft" | "published"
  case_title: string | null
}

type PublicRow = {
  quote: string
  author_name: string
  author_role: string
  initials: string
}

let actor: Buffer
const created: Buffer[] = []

const unique = (prefix: string) =>
  `${prefix} ${Math.random().toString(36).slice(2, 10)}`

async function make(author = unique("Personne")) {
  const row = await write.rowStrict<{ id: Buffer }>("create_testimonial", [
    "Une citation reçue, pas encore validée.",
    author,
    "Fonction, Entreprise",
    actor,
    null,
  ])
  created.push(row.id)
  return { id: row.id, author }
}

/** Remplit ce que la publication exige : initiales, date d'accord et note. */
async function fillForPublication(id: Buffer, author: string) {
  await write.void("update_testimonial", [
    id,
    "Une citation validée par son auteur.",
    author,
    "Fonction, Entreprise",
    "XY",
    // 2026-08-01 en secondes, écrit comme l'action serveur le fait.
    Math.floor(Date.UTC(2026, 7, 1) / 1000),
    "E-mail du 01/08/2026, dossier client",
    null,
    actor,
    null,
  ])
}

const mine = async (id: Buffer) =>
  (await write.rows<Row>("list_testimonials")).find(
    (one) => toHex(one.id) === toHex(id)
  )

beforeAll(async () => {
  const user = await write.rowStrict<{ id: Buffer }>("create_user", [
    uniqueEmail("temoignages"),
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
    Les échecs sont journalisés plutôt qu'avalés : un ménage silencieusement inefficace
    laisserait des citations d'essai **publiées** sur l'accueil du vrai site, ce qui est
    précisément le genre de contenu qu'on ne veut pas y voir.
  */
  for (const id of created.reverse()) {
    await write.void("delete_testimonial", [id, actor, null]).catch((error) => {
      const cause = (error as { cause?: Error }).cause
      console.warn(
        "Ménage (témoignage) :",
        cause?.message ?? (error as Error).message
      )
    })
  }
  await cleanupUsers()
  await closePool()
})

describeDb("fiches", () => {
  it("crée un témoignage et le place après le dernier", async () => {
    const first = await make()
    const second = await make()
    const list = await write.rows<Row>("list_testimonials")
    const position = new Map(
      list.map((one) => [toHex(one.id), Number(one.position)])
    )
    expect(position.get(toHex(second.id))!).toBeGreaterThan(
      position.get(toHex(first.id))!
    )
  })

  it("refuse une citation, un nom ou une fonction vide", async () => {
    await expect(
      write.row("create_testimonial", ["  ", "Nom", "Fonction", actor, null])
    ).rejects.toMatchObject({ code: "QUOTE_REQUIRED" })
    await expect(
      write.row("create_testimonial", [
        "Citation",
        " ",
        "Fonction",
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "AUTHOR_REQUIRED" })
    await expect(
      write.row("create_testimonial", ["Citation", "Nom", "", actor, null])
    ).rejects.toMatchObject({ code: "ROLE_REQUIRED" })
  })

  it("accepte deux citations du même auteur", async () => {
    /*
      Aucune clé unique sur le nom, à la différence des références clientes et de
      l'équipe : la même personne peut témoigner deux fois, sur deux projets, et rien ne
      permet de dire que la seconde est une erreur de saisie.
    */
    const first = await make("Personne qui témoigne deux fois")
    const second = await write.rowStrict<{ id: Buffer }>("create_testimonial", [
      "Une seconde citation, sur un autre projet.",
      "Personne qui témoigne deux fois",
      "Fonction, Entreprise",
      actor,
      null,
    ])
    created.push(second.id)
    expect(toHex(second.id)).not.toBe(toHex(first.id))
  })

  it("conserve la trace de l'accord et la rend telle quelle", async () => {
    const one = await make()
    await fillForPublication(one.id, one.author)
    const row = await mine(one.id)
    expect(Number(row?.consent_at)).toBe(
      Math.floor(Date.UTC(2026, 7, 1) / 1000)
    )
    expect(row?.consent_note).toBe("E-mail du 01/08/2026, dossier client")
  })

  it("refuse une réalisation liée qui n'existe pas", async () => {
    const one = await make()
    await expect(
      write.void("update_testimonial", [
        one.id,
        "Une citation.",
        one.author,
        "Fonction, Entreprise",
        "XY",
        null,
        "",
        Buffer.alloc(16, 1),
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "CASE_NOT_FOUND" })
  })
})

describeDb("publication", () => {
  it("refuse sans date d'accord ni note", async () => {
    const one = await make()
    await write.void("update_testimonial", [
      one.id,
      "Une citation.",
      one.author,
      "Fonction, Entreprise",
      "XY",
      null,
      "",
      null,
      actor,
      null,
    ])
    await expect(
      write.void("publish_testimonial", [one.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "TESTIMONIAL_NO_CONSENT" })
  })

  it("refuse avec une date d'accord mais sans dire où l'écrit se trouve", async () => {
    /*
      La moitié de la trace ne vaut rien : une date sans référence ne permet pas de
      retrouver l'accord le jour où son auteur demande le retrait de sa citation.
    */
    const one = await make()
    await write.void("update_testimonial", [
      one.id,
      "Une citation.",
      one.author,
      "Fonction, Entreprise",
      "XY",
      Math.floor(Date.UTC(2026, 7, 1) / 1000),
      "   ",
      null,
      actor,
      null,
    ])
    await expect(
      write.void("publish_testimonial", [one.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "TESTIMONIAL_NO_CONSENT" })
  })

  it("refuse sans initiales", async () => {
    const one = await make()
    await write.void("update_testimonial", [
      one.id,
      "Une citation.",
      one.author,
      "Fonction, Entreprise",
      "",
      Math.floor(Date.UTC(2026, 7, 1) / 1000),
      "E-mail du 01/08/2026",
      null,
      actor,
      null,
    ])
    await expect(
      write.void("publish_testimonial", [one.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "TESTIMONIAL_NO_INITIALS" })
  })

  it("accepte quand la trace est complète, et sait retirer", async () => {
    const one = await make()
    await fillForPublication(one.id, one.author)
    await write.void("publish_testimonial", [one.id, 1, actor, null])
    expect((await mine(one.id))?.status).toBe("published")

    await write.void("publish_testimonial", [one.id, 0, actor, null])
    expect((await mine(one.id))?.status).toBe("draft")
  })

  it("ne dépublie pas une citation dont on corrige le texte", async () => {
    /*
      Choix assumé : une correction de coquille ne doit pas retirer une citation du site.
      La conséquence - l'accord porte sur le texte tel qu'il était validé - est portée par
      le journal d'audit et par le rappel de l'écran, pas par une dépublication
      automatique qui ferait disparaître la section sans que personne comprenne pourquoi.
    */
    const one = await make()
    await fillForPublication(one.id, one.author)
    await write.void("publish_testimonial", [one.id, 1, actor, null])
    await write.void("update_testimonial", [
      one.id,
      "Le même texte, une coquille en moins.",
      one.author,
      "Fonction, Entreprise",
      "XY",
      Math.floor(Date.UTC(2026, 7, 1) / 1000),
      "E-mail du 01/08/2026, dossier client",
      null,
      actor,
      null,
    ])
    expect((await mine(one.id))?.status).toBe("published")
  })
})

describeDb("lecture publique", () => {
  it("ne rend que les citations publiées, sans la trace de l'accord", async () => {
    const draft = await make()
    const live = await make()
    await fillForPublication(live.id, live.author)
    await write.void("publish_testimonial", [live.id, 1, actor, null])

    const rows = await write.rows<PublicRow>("pub_list_testimonials")
    const authors = rows.map((one) => one.author_name)
    expect(authors).toContain(live.author)
    expect(authors).not.toContain(draft.author)

    /*
      La procédure publique ne rend que ce qui s'affiche. La date d'accord et sa note sont
      des données internes : une procédure accordée au déploiement public ne doit pas les
      exposer, et une colonne rendue mais non consommée est le mode de panne où l'on croit
      qu'une donnée arrive quelque part.
    */
    const row = rows.find((one) => one.author_name === live.author)!
    expect(Object.keys(row).sort()).toEqual([
      "author_name",
      "author_role",
      "initials",
      "quote",
    ])
  })

  it("réordonne", async () => {
    const first = await make()
    const second = await make()
    await write.void("reorder_testimonials", [
      JSON.stringify([
        { id: toHex(second.id), position: 1 },
        { id: toHex(first.id), position: 2 },
      ]),
      actor,
      null,
    ])
    expect(Number((await mine(second.id))?.position)).toBe(1)
    expect(Number((await mine(first.id))?.position)).toBe(2)
  })
})
