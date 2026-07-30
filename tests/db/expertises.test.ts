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
 * Tests d'intégration des expertises.
 *
 * Ce qui mérite le plus d'attention ici est la **famille** : elle porte une entrée de
 * nav présente sur chaque page du site, ce qui en fait la seule collection dont une
 * écriture peut casser la navigation. Les garde-fous sont donc testés un par un.
 */

type FamilyRow = {
  id: Buffer
  slug: string
  label: string
  nav_service_slug: string | null
  position: number
  service_count: number
  published_count: number
}

type ServiceRow = {
  id: Buffer
  slug: string
  title: string
  status: "draft" | "published"
  family_id: Buffer
  position: number
}

let actor: Buffer
/** Les familles créées, avec leur slug : le ménage a besoin des deux. */
const families: { id: Buffer; slug: string }[] = []
const services: Buffer[] = []

const unique = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`

async function makeFamily(label = "Famille de test") {
  const row = await write.rowStrict<FamilyRow>("create_expertise_family", [
    unique("fam"),
    label,
    actor,
    null,
  ])
  families.push({ id: row.id, slug: row.slug })
  return row
}

async function makeService(familyId: Buffer, title = "Service de test") {
  const row = await write.rowStrict<ServiceRow>("create_expertise_service", [
    unique("svc"),
    title,
    familyId,
    actor,
    null,
  ])
  services.push(row.id)
  return row
}

/** Remplit ce que la publication exige : les textes, et un livrable. */
async function fillForPublication(id: Buffer, slug: string, familyId: Buffer) {
  await write.void("update_expertise_service", [
    id,
    slug,
    familyId,
    "Service de test",
    "Une accroche qui dit à qui ça sert.",
    "Le problème du visiteur, dans ses mots.",
    "",
    "Parlons-en",
    actor,
    null,
  ])
  await write.void("set_expertise_deliverables", [
    id,
    JSON.stringify([
      { title: "Un livrable nommé", text: "Ce qu'il contient." },
    ]),
    actor,
    null,
  ])
}

beforeAll(async () => {
  const user = await write.rowStrict<{ id: Buffer }>("create_user", [
    uniqueEmail("expertises"),
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
    Le ménage suit l'ordre exact que les garde-fous imposent, et c'est ce qui le rend
    fiable.

    **1. Retirer les cibles de nav.** Un service qui porte l'entrée de nav de sa
    famille refuse d'être supprimé - c'est l'un des tests. Sans cette étape, ce
    service survivait, donc sa famille aussi, et ces familles d'essai finissaient dans
    le menu du **vrai site** : deux familles vides y produisaient deux entrées vers la
    même adresse. Constaté en navigateur, pas en test.

    **2. Les services**, **3. les familles**, qu'une famille non vide refuse de
    laisser partir.

    Les échecs sont journalisés et non avalés : un ménage silencieusement inefficace
    est précisément ce qui a laissé passer le défaut ci-dessus.
  */
  const complain = (step: string) => (error: unknown) => {
    const cause = (error as { cause?: Error }).cause
    console.warn(
      `Ménage (${step}) :`,
      cause?.message ?? (error as Error).message
    )
  }

  for (const family of families) {
    await write
      .void("update_expertise_family", [
        family.id,
        family.slug,
        "À supprimer",
        "",
        "",
        "",
        "warm",
        60,
        45,
        75,
        "",
        actor,
        null,
      ])
      .catch(complain(`nav de ${family.slug}`))
  }

  for (const id of services.reverse()) {
    await write
      .void("delete_expertise_service", [id, actor, null])
      .catch(complain("service"))
  }

  for (const family of families.reverse()) {
    await write
      .void("delete_expertise_family", [family.id, actor, null])
      .catch(complain(`famille ${family.slug}`))
  }

  await cleanupUsers()
  await closePool()
})

describeDb("familles", () => {
  it("crée une famille et la place après la dernière", async () => {
    const first = await makeFamily()
    const second = await makeFamily()
    const list = await write.rows<FamilyRow>("list_expertise_families")
    const positions = new Map(
      list.map((one) => [one.slug, Number(one.position)])
    )
    expect(positions.get(second.slug)!).toBeGreaterThan(
      positions.get(first.slug)!
    )
  })

  it("dérive le slug du libellé", async () => {
    const row = await write.rowStrict<FamilyRow>("create_expertise_family", [
      null,
      `Data & décisionnel ${Math.random().toString(36).slice(2, 7)}`,
      actor,
      null,
    ])
    families.push({ id: row.id, slug: row.slug })
    expect(row.slug).toMatch(/^data-decisionnel-[a-z0-9]+$/)
  })

  it("refuse un slug déjà pris", async () => {
    const first = await makeFamily()
    await expect(
      write.row("create_expertise_family", [first.slug, "Doublon", actor, null])
    ).rejects.toMatchObject({ code: "SLUG_TAKEN" })
  })

  it("compte ses services, publiés et total", async () => {
    const family = await makeFamily()
    const draft = await makeService(family.id)
    void draft
    const live = await makeService(family.id)
    await fillForPublication(live.id, live.slug, family.id)
    await write.void("publish_expertise_service", [live.id, 1, actor, null])

    const list = await write.rows<FamilyRow>("list_expertise_families")
    const found = list.find((one) => one.slug === family.slug)
    expect(Number(found?.service_count)).toBe(2)
    expect(Number(found?.published_count)).toBe(1)
  })

  it("refuse de supprimer une famille qui porte des services", async () => {
    const family = await makeFamily()
    await makeService(family.id)
    // La contrainte `RESTRICT` l'empêcherait de toute façon, mais elle remonterait
    // une erreur de pilote : le code métier est affichable.
    await expect(
      write.void("delete_expertise_family", [family.id, actor, null])
    ).rejects.toMatchObject({ code: "FAMILY_NOT_EMPTY" })
  })

  it("supprime une famille vide", async () => {
    const family = await makeFamily()
    await expect(
      write.void("delete_expertise_family", [family.id, actor, null])
    ).resolves.toBeUndefined()
  })

  it("réordonne", async () => {
    const a = await makeFamily()
    const b = await makeFamily()
    await write.void("reorder_expertise_families", [
      JSON.stringify([
        { id: toHex(b.id), position: 5000 },
        { id: toHex(a.id), position: 5010 },
      ]),
      actor,
      null,
    ])
    const list = await write.rows<FamilyRow>("list_expertise_families")
    const positions = new Map(
      list.map((one) => [one.slug, Number(one.position)])
    )
    expect(positions.get(b.slug)).toBe(5000)
    expect(positions.get(a.slug)).toBe(5010)
  })
})

/**
 * La cible de nav, dans sa propre suite : c'est le point qui portait un défaut de
 * conception dans le contenu statique, où la nav ne fonctionnait que par coïncidence
 * de slugs entre une famille et un service.
 */
describeDb("cible de nav d'une famille", () => {
  it("refuse une cible de nav qui ne désigne aucun service", async () => {
    const family = await makeFamily()
    await expect(
      write.void("update_expertise_family", [
        family.id,
        family.slug,
        family.label,
        "",
        "",
        "",
        "warm",
        60,
        45,
        75,
        "ce-service-nexiste-pas",
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "NAV_SERVICE_UNKNOWN" })
  })

  it("accepte une cible vide : la nav mènera au hub", async () => {
    const family = await makeFamily()
    await expect(
      write.void("update_expertise_family", [
        family.id,
        family.slug,
        family.label,
        "",
        "",
        "",
        "warm",
        60,
        45,
        75,
        "",
        actor,
        null,
      ])
    ).resolves.toBeUndefined()
  })

  it("suit le renommage du service qu'elle désigne", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)

    await write.void("update_expertise_family", [
      family.id,
      family.slug,
      family.label,
      "",
      "",
      "",
      "warm",
      60,
      45,
      75,
      service.slug,
      actor,
      null,
    ])

    const renamed = unique("svc")
    await write.void("update_expertise_service", [
      service.id,
      renamed,
      family.id,
      "Service renommé",
      "Accroche.",
      "Problème.",
      "",
      "",
      actor,
      null,
    ])

    const list = await write.rows<FamilyRow>("list_expertise_families")
    // Sans ce suivi, renommer un service laisserait un lien mort dans la nav de
    // **toutes** les pages du site, sans que rien le signale.
    expect(list.find((one) => one.slug === family.slug)?.nav_service_slug).toBe(
      renamed
    )
  })

  it("refuse de supprimer un service qui porte une entrée de nav", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)
    await write.void("update_expertise_family", [
      family.id,
      family.slug,
      family.label,
      "",
      "",
      "",
      "warm",
      60,
      45,
      75,
      service.slug,
      actor,
      null,
    ])

    await expect(
      write.void("delete_expertise_service", [service.id, actor, null])
    ).rejects.toMatchObject({ code: "SERVICE_IS_NAV_TARGET" })
  })
})

describeDb("services", () => {
  it("refuse une famille inexistante", async () => {
    await expect(
      write.row("create_expertise_service", [
        unique("svc"),
        "Orphelin",
        Buffer.alloc(16),
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "FAMILY_NOT_FOUND" })
  })

  it("rend quatre jeux de résultats en un appel", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)

    await write.void("set_expertise_deliverables", [
      service.id,
      JSON.stringify([
        { title: "A", text: "un" },
        { title: "B", text: "deux" },
      ]),
      actor,
      null,
    ])
    await write.void("set_expertise_tech_choices", [
      service.id,
      JSON.stringify([{ title: "TypeScript", text: "Un seul langage." }]),
      actor,
      null,
    ])
    await write.void("set_expertise_faq", [
      service.id,
      JSON.stringify([{ question: "Combien de temps ?", answer: "Six mois." }]),
      actor,
      null,
    ])

    /*
      Un seul payload pour les trois pièces, et non trois paramètres : la procédure les
      écrit dans la même transaction, parce qu'un chapô sans ses signes ou des signes
      sans leur conclusion ne forment pas la section. Les signes sont des chaînes nues,
      pas des objets - ils n'ont ni identité ni autre champ.
    */
    await write.void("set_expertise_why_custom", [
      service.id,
      JSON.stringify({
        lead: "Pourquoi du sur-mesure.",
        signals: ["Un signe."],
        closing: "En conclusion.",
      }),
      actor,
      null,
    ])

    const sets = await write.sets("get_expertise_service_full", [
      service.id,
      null,
    ])
    /*
      Cinq jeux : le service, les livrables, les choix techniques, la FAQ, puis les
      signes de la section sur-mesure. Le cinquième est arrivé après les quatre autres,
      et ce test l'a signalé en échouant sur le compte - c'est exactement ce qu'on lui
      demande, une procédure à plusieurs jeux se lit par position.
    */
    expect(sets).toHaveLength(5)
    expect(sets[1]).toHaveLength(2)
    expect(sets[2]).toHaveLength(1)
    expect(sets[3]).toHaveLength(1)
    expect(sets[4]).toHaveLength(1)
  })

  it("écarte une entrée sans titre plutôt que d'échouer sur la liste", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)
    await write.void("set_expertise_deliverables", [
      service.id,
      JSON.stringify([
        { title: "Gardé", text: "un" },
        { title: "", text: "deux" },
      ]),
      actor,
      null,
    ])
    const sets = await write.sets("get_expertise_service_full", [
      service.id,
      null,
    ])
    expect(sets[1]).toHaveLength(1)
  })

  it("change de famille", async () => {
    const first = await makeFamily()
    const second = await makeFamily()
    const service = await makeService(first.id)

    await write.void("update_expertise_service", [
      service.id,
      service.slug,
      second.id,
      "Déplacé",
      "Accroche.",
      "Problème.",
      "",
      "",
      actor,
      null,
    ])

    const sets = await write.sets("get_expertise_service_full", [
      service.id,
      null,
    ])
    expect(toHex((sets[0][0] as ServiceRow).family_id)).toBe(toHex(second.id))
  })

  it("refuse un JSON illisible", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)
    await expect(
      write.void("set_expertise_faq", [service.id, "{pas du json", actor, null])
    ).rejects.toMatchObject({ code: "INVALID_JSON" })
  })
})

describeDb("publication d'un service", () => {
  it("publie un service complet", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)
    await fillForPublication(service.id, service.slug, family.id)
    await expect(
      write.void("publish_expertise_service", [service.id, 1, actor, null])
    ).resolves.toBeUndefined()
  })

  it("refuse un service sans accroche ni problème", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)
    await expect(
      write.void("publish_expertise_service", [service.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "SERVICE_INCOMPLETE" })
  })

  it("refuse un service sans livrable", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)
    await write.void("update_expertise_service", [
      service.id,
      service.slug,
      family.id,
      "Titre",
      "Accroche.",
      "Problème.",
      "",
      "",
      actor,
      null,
    ])
    // La page promet de dire ce qu'on obtient : sans livrable, elle ne le dit pas.
    await expect(
      write.void("publish_expertise_service", [service.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "SERVICE_NO_DELIVERABLE" })
  })
})

describeDb("surface publique des expertises", () => {
  it("rend une famille sans service publié, avec une cible nulle", async () => {
    const family = await makeFamily("Famille sans service publié")
    await makeService(family.id)

    const rows = await write.rows<{ slug: string; nav_slug: string | null }>(
      "pub_list_expertise_families"
    )
    const found = rows.find((one) => one.slug === family.slug)
    /*
      La procédure rend toutes les familles : c'est un inventaire fidèle, et
      l'administration en a besoin.

      La cible nulle est ce qui compte : c'est elle qui fait écarter la famille de la
      nav **et** du hub. Les garder en les faisant mener au hub paraissait prudent, et
      c'était une erreur - deux familles vides donnaient deux entrées vers la même
      adresse, et le visiteur y aurait trouvé un hub où la famille n'apparaît pas.
    */
    expect(found).toBeDefined()
    expect(found?.nav_slug).toBeNull()
  })

  it("retombe sur le premier service publié quand la cible ne l'est pas", async () => {
    const family = await makeFamily()
    const target = await makeService(family.id, "Cible non publiée")
    const other = await makeService(family.id, "Autre, publié")

    await write.void("update_expertise_family", [
      family.id,
      family.slug,
      family.label,
      "",
      "",
      "",
      "warm",
      60,
      45,
      75,
      target.slug,
      actor,
      null,
    ])

    await fillForPublication(other.id, other.slug, family.id)
    await write.void("publish_expertise_service", [other.id, 1, actor, null])

    const rows = await write.rows<{ slug: string; nav_slug: string | null }>(
      "pub_list_expertise_families"
    )
    // La cible désignée est en brouillon : plutôt qu'un lien mort, la nav mène au
    // premier service publié de la famille.
    expect(rows.find((one) => one.slug === family.slug)?.nav_slug).toBe(
      other.slug
    )
  })

  it("ne liste que les services publiés", async () => {
    const family = await makeFamily()
    const draft = await makeService(family.id)
    const live = await makeService(family.id)
    await fillForPublication(live.id, live.slug, family.id)
    await write.void("publish_expertise_service", [live.id, 1, actor, null])

    const rows = await write.rows<{ slug: string }>(
      "pub_list_expertise_services"
    )
    const slugs = rows.map((one) => one.slug)
    expect(slugs).toContain(live.slug)
    expect(slugs).not.toContain(draft.slug)
  })

  it("rend zéro ligne sur un brouillon comme sur un service inexistant", async () => {
    const family = await makeFamily()
    const draft = await makeService(family.id)
    expect(
      (await write.sets("pub_get_expertise_service", [draft.slug]))[0]
    ).toHaveLength(0)
    expect(
      (await write.sets("pub_get_expertise_service", ["inconnu"]))[0]
    ).toHaveLength(0)
  })

  it("rend cinq jeux pour un service publié", async () => {
    const family = await makeFamily()
    const service = await makeService(family.id)
    await fillForPublication(service.id, service.slug, family.id)
    await write.void("publish_expertise_service", [service.id, 1, actor, null])

    const sets = await write.sets("pub_get_expertise_service", [service.slug])
    // Le cinquième jeu porte les signes de la section sur-mesure, vides ici : la vue
    // publique conditionne le bloc à son contenu, un service sans signe n'en montre pas.
    expect(sets).toHaveLength(5)
    expect(sets[0]).toHaveLength(1)
    expect(sets[1]).toHaveLength(1)
    expect(sets[4]).toHaveLength(0)
  })
})
