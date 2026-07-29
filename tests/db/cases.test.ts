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
 * Tests d'intégration du CRUD des réalisations.
 *
 * C'est le cœur de l'administration : ce sont ces procédures que le dashboard
 * appelle, et ce fichier vérifie à la fois leur comportement et les garde-fous qui
 * empêchent de publier une page cassée.
 *
 * Chaque suite crée ses propres fiches et les supprime après elle : la base ne doit
 * pas se remplir de résidus d'exécution.
 */

type CaseRow = {
  id: Buffer
  slug: string
  title: string
  status: "draft" | "published"
  position: number
}

let actor: Buffer
const created: Buffer[] = []

/** Un slug unique par test, pour que deux exécutions ne se marchent pas dessus. */
function uniqueSlug(prefix = "cas") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

async function makeCase(
  overrides: {
    slug?: string
    title?: string
    sector?: string
    year?: string
  } = {}
) {
  const row = await write.rowStrict<CaseRow>("create_case_study", [
    overrides.slug ?? uniqueSlug(),
    overrides.title ?? "Fiche de test",
    overrides.sector ?? "Santé",
    overrides.year ?? "2026",
    actor,
    "127.0.0.1",
  ])
  created.push(row.id)
  return row
}

/** Remplit ce que la publication exige, sans le chiffre - il est facultatif. */
async function fillForPublication(id: Buffer, slug: string) {
  await write.void("update_case_study", [
    id,
    slug,
    "Santé",
    "2026",
    "Santé · plateforme",
    "Fiche de test",
    "Un résultat dans le titre",
    "Résumé long, celui de la carte d'accueil.",
    "Résumé court, celui du hub.",
    "",
    "",
    "warm",
    "brand",
    0,
    0,
    "",
    "",
    "",
    "",
    "",
    null,
    actor,
    null,
  ])
  await write.void("set_case_chapters", [
    id,
    JSON.stringify([{ num: "", title: "Découverte", text: "Le récit." }]),
    actor,
    null,
  ])
}

beforeAll(async () => {
  const user = await write.rowStrict<{ id: Buffer }>("create_user", [
    uniqueEmail("cases"),
    FAKE_HASH,
    "Acteur des tests",
    "admin",
    null,
    null,
  ])
  actor = trackUser(user.id)
})

afterAll(async () => {
  for (const id of created.reverse()) {
    await write.void("delete_case_study", [id, actor, null]).catch(() => {})
  }
  await cleanupUsers()
  await closePool()
})

describeDb("create_case_study", () => {
  it("crée un brouillon et rend la ligne écrite", async () => {
    const slug = uniqueSlug()
    const row = await makeCase({ slug, title: "Pilotage de production" })

    expect(row.slug).toBe(slug)
    expect(row.title).toBe("Pilotage de production")
    expect(row.status).toBe("draft")
  })

  it("dérive le slug du titre quand il n'est pas fourni", async () => {
    // Appel direct : `makeCase` fournit toujours un slug, ce qui masquerait la
    // dérivation qu'on veut justement observer.
    const row = await write.rowStrict<CaseRow>("create_case_study", [
      null,
      `Refonte d'un espace élève ${Math.random().toString(36).slice(2, 8)}`,
      "Santé",
      "2026",
      actor,
      null,
    ])
    created.push(row.id)
    // `Slugify()` retire les accents, l'apostrophe et la casse.
    expect(row.slug).toMatch(/^refonte-d-un-espace-eleve-[a-z0-9]+$/)
  })

  it("refuse un slug déjà pris, en erreur métier", async () => {
    const first = await makeCase()
    await expect(
      write.row("create_case_study", [
        first.slug,
        "Doublon",
        "Santé",
        "2026",
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "SLUG_TAKEN" })
  })

  it("espace les positions de dix en dix : insérer entre deux voisines reste possible", async () => {
    const a = await makeCase()
    const b = await makeCase()
    expect(Number(b.position)).toBe(Number(a.position) + 10)
  })

  it("journalise la création", async () => {
    const row = await makeCase()
    const entries = await write.rows<{ action: string; new_value: string }>(
      "list_audit",
      ["case_study", row.id, 5, 0]
    )
    const entry = entries.find((one) => one.action === "case.create")
    expect(entry).toBeDefined()
    expect(JSON.parse(entry!.new_value)).toMatchObject({ slug: row.slug })
  })
})

describeDb("get_case_study_full", () => {
  it("rend cinq jeux de résultats en un seul appel", async () => {
    const row = await makeCase()
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify([
        { title: "Découverte", text: "Immersion." },
        { title: "Cadrage", text: "Périmètre.", callout: "Une décision." },
      ]),
      actor,
      null,
    ])
    await write.void("set_case_results", [
      row.id,
      JSON.stringify([{ value: "-38 %", label: "de temps de traitement" }]),
      actor,
      null,
    ])
    await write.void("set_case_meta", [
      row.id,
      JSON.stringify([{ label: "Durée", value: "14 semaines" }]),
      actor,
      null,
    ])
    await write.void("set_case_lessons", [
      row.id,
      JSON.stringify([{ text: "Un champ vide et signalé vaut mieux." }]),
      actor,
      null,
    ])

    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect(sets).toHaveLength(5)
    expect(sets[0]).toHaveLength(1)
    expect(sets[1]).toHaveLength(2)
    expect(sets[2]).toHaveLength(1)
    expect(sets[3]).toHaveLength(1)
    expect(sets[4]).toHaveLength(1)
  })

  it("se laisse interroger par slug comme par identifiant", async () => {
    const row = await makeCase()
    const bySlug = await write.sets("get_case_study_full", [null, row.slug])
    const byId = await write.sets("get_case_study_full", [row.id, null])
    expect((bySlug[0][0] as CaseRow).slug).toBe(row.slug)
    expect((byId[0][0] as CaseRow).slug).toBe(row.slug)
  })

  it("rend cinq jeux vides sur une fiche inconnue, sans lever", async () => {
    const sets = await write.sets("get_case_study_full", [null, "nexiste-pas"])
    expect(sets).toHaveLength(5)
    expect(sets[0]).toHaveLength(0)
  })
})

describeDb("collections enfants", () => {
  it("remplace en bloc plutôt que d'ajouter", async () => {
    const row = await makeCase()
    const set = (items: unknown) =>
      write.void("set_case_chapters", [
        row.id,
        JSON.stringify(items),
        actor,
        null,
      ])

    await set([
      { title: "A", text: "un" },
      { title: "B", text: "deux" },
    ])
    await set([{ title: "C", text: "trois" }])

    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect(sets[1]).toHaveLength(1)
    expect((sets[1][0] as { title: string }).title).toBe("C")
  })

  it("numérote les chapitres sur leur rang quand aucun numéro n'est fourni", async () => {
    const row = await makeCase()
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify([
        { title: "A", text: "un" },
        { title: "B", text: "deux" },
        { title: "C", text: "trois" },
      ]),
      actor,
      null,
    ])
    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect((sets[1] as { num: string }[]).map((one) => one.num)).toEqual([
      "01",
      "02",
      "03",
    ])
  })

  it("respecte un numéro explicite", async () => {
    const row = await makeCase()
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify([{ num: "07", title: "A", text: "un" }]),
      actor,
      null,
    ])
    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect((sets[1][0] as { num: string }).num).toBe("07")
  })

  it("conserve l'ordre du tableau", async () => {
    const row = await makeCase()
    await write.void("set_case_results", [
      row.id,
      JSON.stringify([
        { value: "1", label: "premier" },
        { value: "2", label: "deuxième" },
        { value: "3", label: "troisième" },
      ]),
      actor,
      null,
    ])
    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect((sets[2] as { label: string }[]).map((one) => one.label)).toEqual([
      "premier",
      "deuxième",
      "troisième",
    ])
  })

  it("ignore une ligne sans son champ obligatoire plutôt que d'échouer", async () => {
    const row = await makeCase()
    await write.void("set_case_chapters", [
      row.id,
      // Le deuxième chapitre n'a pas de titre : il est écarté, le premier passe.
      JSON.stringify([
        { title: "Gardé", text: "un" },
        { title: "", text: "deux" },
      ]),
      actor,
      null,
    ])
    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect(sets[1]).toHaveLength(1)
  })

  it("stocke un encadré vide en NULL, pas en chaîne vide", async () => {
    const row = await makeCase()
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify([{ title: "A", text: "un", callout: "   " }]),
      actor,
      null,
    ])
    const sets = await write.sets("get_case_study_full", [row.id, null])
    // « Absent » et « rempli avec du vide » ne doivent pas se confondre.
    expect((sets[1][0] as { callout: string | null }).callout).toBeNull()
  })

  it("vide une collection avec un tableau vide", async () => {
    const row = await makeCase()
    await write.void("set_case_lessons", [
      row.id,
      JSON.stringify([{ text: "un" }]),
      actor,
      null,
    ])
    await write.void("set_case_lessons", [row.id, "[]", actor, null])
    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect(sets[4]).toHaveLength(0)
  })

  it("refuse un JSON illisible", async () => {
    const row = await makeCase()
    await expect(
      write.void("set_case_chapters", [row.id, "pas du json", actor, null])
    ).rejects.toMatchObject({ code: "INVALID_JSON" })
  })

  it("refuse d'écrire sur une fiche qui n'existe pas", async () => {
    await expect(
      write.void("set_case_chapters", [Buffer.alloc(16), "[]", actor, null])
    ).rejects.toMatchObject({ code: "CASE_NOT_FOUND" })
  })

  it("touche l'horodatage de la fiche", async () => {
    const row = await makeCase()
    const before = await write.sets("get_case_study_full", [row.id, null])
    await new Promise((resolve) => setTimeout(resolve, 1100))
    await write.void("set_case_lessons", [
      row.id,
      JSON.stringify([{ text: "un" }]),
      actor,
      null,
    ])
    const after = await write.sets("get_case_study_full", [row.id, null])
    expect(
      Number((after[0][0] as { updated_at: number }).updated_at)
    ).toBeGreaterThan(
      Number((before[0][0] as { updated_at: number }).updated_at)
    )
  })
})

describeDb("update_case_study", () => {
  it("écrit la fiche et garde un avant / après dans le journal", async () => {
    const row = await makeCase({ title: "Avant" })
    await fillForPublication(row.id, row.slug)

    const entries = await write.rows<{
      action: string
      old_value: string | null
      new_value: string | null
    }>("list_audit", ["case_study", row.id, 10, 0])
    const entry = entries.find((one) => one.action === "case.update")

    expect(entry).toBeDefined()
    expect(JSON.parse(entry!.old_value!)).toMatchObject({ title: "Avant" })
    expect(JSON.parse(entry!.new_value!)).toMatchObject({
      title: "Fiche de test",
    })
  })

  it("refuse un slug déjà porté par une autre fiche", async () => {
    const first = await makeCase()
    const second = await makeCase()

    await expect(
      write.void("update_case_study", [
        second.id,
        first.slug,
        "Santé",
        "2026",
        "",
        "Titre",
        "Titre",
        "",
        "",
        "",
        "",
        "warm",
        "brand",
        0,
        0,
        "",
        "",
        "",
        "",
        "",
        null,
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "SLUG_TAKEN" })
  })

  it("accepte de réécrire une fiche avec son propre slug", async () => {
    const row = await makeCase()
    await expect(fillForPublication(row.id, row.slug)).resolves.toBeUndefined()
  })

  it("stocke un témoignage vide en NULL", async () => {
    const row = await makeCase()
    await fillForPublication(row.id, row.slug)
    const sets = await write.sets("get_case_study_full", [row.id, null])
    const fiche = sets[0][0] as { testimonial_quote: string | null }
    expect(fiche.testimonial_quote).toBeNull()
  })

  it("signale une fiche inconnue", async () => {
    await expect(
      write.void("update_case_study", [
        Buffer.alloc(16),
        "un-slug",
        "Santé",
        "2026",
        "",
        "T",
        "T",
        "",
        "",
        "",
        "",
        "warm",
        "brand",
        0,
        0,
        "",
        "",
        "",
        "",
        "",
        null,
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "CASE_NOT_FOUND" })
  })
})

describeDb("publish_case_study", () => {
  it("publie une fiche complète et l'horodate", async () => {
    const row = await makeCase()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_case_study", [row.id, 1, actor, null])

    const sets = await write.sets("get_case_study_full", [row.id, null])
    const fiche = sets[0][0] as { status: string; published_at: number | null }
    expect(fiche.status).toBe("published")
    expect(Number(fiche.published_at)).toBeGreaterThan(0)
  })

  it("refuse de publier une fiche aux résumés vides", async () => {
    const row = await makeCase()
    await expect(
      write.void("publish_case_study", [row.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "CASE_INCOMPLETE" })
  })

  it("n'exige pas le chiffre : toute mission ne se résume pas à une mesure", async () => {
    const row = await makeCase()
    // `fillForPublication` laisse `figure` et `measure` vides, volontairement.
    await fillForPublication(row.id, row.slug)
    await expect(
      write.void("publish_case_study", [row.id, 1, actor, null])
    ).resolves.toBeUndefined()
  })

  it("refuse de publier une fiche sans chapitre", async () => {
    const row = await makeCase()
    await write.void("update_case_study", [
      row.id,
      row.slug,
      "Santé",
      "2026",
      "",
      "Titre",
      "Titre",
      "Résumé long.",
      "Résumé court.",
      "",
      "",
      "warm",
      "brand",
      0,
      0,
      "",
      "",
      "",
      "",
      "",
      null,
      actor,
      null,
    ])
    await expect(
      write.void("publish_case_study", [row.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "CASE_NO_CHAPTER" })
  })

  it("ne rajeunit pas la date de publication en republiant", async () => {
    const row = await makeCase()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_case_study", [row.id, 1, actor, null])

    const first = await write.sets("get_case_study_full", [row.id, null])
    const stamp = Number((first[0][0] as { published_at: number }).published_at)

    await new Promise((resolve) => setTimeout(resolve, 1100))
    await write.void("publish_case_study", [row.id, 0, actor, null])
    await write.void("publish_case_study", [row.id, 1, actor, null])

    const again = await write.sets("get_case_study_full", [row.id, null])
    expect(Number((again[0][0] as { published_at: number }).published_at)).toBe(
      stamp
    )
  })

  it("dépublie sans effacer la date", async () => {
    const row = await makeCase()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_case_study", [row.id, 1, actor, null])
    await write.void("publish_case_study", [row.id, 0, actor, null])

    const sets = await write.sets("get_case_study_full", [row.id, null])
    const fiche = sets[0][0] as { status: string; published_at: number | null }
    expect(fiche.status).toBe("draft")
    expect(Number(fiche.published_at)).toBeGreaterThan(0)
  })

  it("journalise sous deux actions distinctes", async () => {
    const row = await makeCase()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_case_study", [row.id, 1, actor, null])
    await write.void("publish_case_study", [row.id, 0, actor, null])

    const actions = (
      await write.rows<{ action: string }>("list_audit", [
        "case_study",
        row.id,
        20,
        0,
      ])
    ).map((one) => one.action)
    expect(actions).toContain("case.publish")
    expect(actions).toContain("case.unpublish")
  })
})

describeDb("list_case_studies", () => {
  it("filtre par statut, et rend tout sans filtre", async () => {
    const draft = await makeCase()
    const live = await makeCase()
    await fillForPublication(live.id, live.slug)
    await write.void("publish_case_study", [live.id, 1, actor, null])

    const all = await write.rows<CaseRow>("list_case_studies", [null])
    const published = await write.rows<CaseRow>("list_case_studies", [
      "published",
    ])

    const slugs = (rows: CaseRow[]) => rows.map((one) => one.slug)
    expect(slugs(all)).toContain(draft.slug)
    expect(slugs(all)).toContain(live.slug)
    expect(slugs(published)).toContain(live.slug)
    expect(slugs(published)).not.toContain(draft.slug)
  })

  it("compte les collections enfants sans les charger", async () => {
    const row = await makeCase()
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify([
        { title: "A", text: "un" },
        { title: "B", text: "deux" },
      ]),
      actor,
      null,
    ])

    const list = await write.rows<
      CaseRow & { chapter_count: number; result_count: number }
    >("list_case_studies", [null])
    const found = list.find((one) => one.slug === row.slug)
    expect(Number(found?.chapter_count)).toBe(2)
    expect(Number(found?.result_count)).toBe(0)
  })
})

describeDb("reorder_case_studies", () => {
  it("applique un nouvel ordre", async () => {
    const a = await makeCase()
    const b = await makeCase()

    await write.void("reorder_case_studies", [
      JSON.stringify([
        { id: toHex(b.id), position: 1000 },
        { id: toHex(a.id), position: 1010 },
      ]),
      actor,
      null,
    ])

    const list = await write.rows<CaseRow>("list_case_studies", [null])
    const positions = new Map(
      list.map((one) => [one.slug, Number(one.position)])
    )
    expect(positions.get(b.slug)).toBe(1000)
    expect(positions.get(a.slug)).toBe(1010)
    expect(positions.get(b.slug)!).toBeLessThan(positions.get(a.slug)!)
  })

  it("ignore un identifiant inconnu sans échouer sur le reste", async () => {
    const a = await makeCase()
    await write.void("reorder_case_studies", [
      JSON.stringify([
        { id: "0".repeat(32), position: 500 },
        { id: toHex(a.id), position: 510 },
      ]),
      actor,
      null,
    ])
    const list = await write.rows<CaseRow>("list_case_studies", [null])
    expect(Number(list.find((one) => one.slug === a.slug)?.position)).toBe(510)
  })

  it("refuse un JSON illisible", async () => {
    await expect(
      write.void("reorder_case_studies", ["{pas du json", actor, null])
    ).rejects.toMatchObject({ code: "INVALID_JSON" })
  })
})

describeDb("delete_case_study", () => {
  it("supprime la fiche et ses collections en cascade", async () => {
    const row = await makeCase()
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify([{ title: "A", text: "un" }]),
      actor,
      null,
    ])

    await write.void("delete_case_study", [row.id, actor, null])

    const sets = await write.sets("get_case_study_full", [row.id, null])
    expect(sets[0]).toHaveLength(0)
    expect(sets[1]).toHaveLength(0)
  })

  it("garde dans le journal une copie de ce qui a disparu", async () => {
    const row = await makeCase({ title: "À supprimer" })
    await write.void("delete_case_study", [row.id, actor, null])

    const entries = await write.rows<{ action: string; old_value: string }>(
      "list_audit",
      ["case_study", row.id, 10, 0]
    )
    const entry = entries.find((one) => one.action === "case.delete")
    // C'est le seul endroit où la fiche subsiste : sans cela, on ne saurait pas
    // ce qui a été supprimé.
    expect(JSON.parse(entry!.old_value)).toMatchObject({
      slug: row.slug,
      title: "À supprimer",
    })
  })

  it("signale une fiche inconnue", async () => {
    await expect(
      write.void("delete_case_study", [Buffer.alloc(16), actor, null])
    ).rejects.toMatchObject({ code: "CASE_NOT_FOUND" })
  })
})

describeDb("surface publique", () => {
  it("ne montre que les fiches publiées", async () => {
    const draft = await makeCase()
    const live = await makeCase()
    await fillForPublication(live.id, live.slug)
    await write.void("publish_case_study", [live.id, 1, actor, null])

    const rows = await write.rows<{ slug: string }>("pub_list_case_studies")
    const slugs = rows.map((one) => one.slug)
    expect(slugs).toContain(live.slug)
    expect(slugs).not.toContain(draft.slug)
  })

  it("rend zéro ligne sur un brouillon, comme sur une fiche inexistante", async () => {
    const draft = await makeCase()
    const sets = await write.sets("pub_get_case_study", [draft.slug])
    // La page publique appelle `notFound()` dans les deux cas, sans distinguer
    // « pas encore publié » de « n'existe pas » - et sans le révéler.
    expect(sets[0]).toHaveLength(0)

    const unknown = await write.sets("pub_get_case_study", ["nexiste-pas"])
    expect(unknown[0]).toHaveLength(0)
  })

  it("rend six jeux pour une fiche publiée, galerie comprise", async () => {
    const row = await makeCase()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_case_study", [row.id, 1, actor, null])

    const sets = await write.sets("pub_get_case_study", [row.slug])
    expect(sets).toHaveLength(6)
    expect(sets[0]).toHaveLength(1)
    expect(sets[1]).toHaveLength(1)
  })

  it("n'expose que les secteurs des fiches publiées", async () => {
    const draft = await makeCase({ sector: "Secteur-brouillon" })
    void draft
    const rows = await write.rows<{ sector: string }>("pub_list_case_sectors")
    expect(rows.map((one) => one.sector)).not.toContain("Secteur-brouillon")
  })
})
