import { afterAll, beforeAll, expect, it } from "vitest"

import { write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"
import {
  FAKE_HASH,
  cleanupUsers,
  describeDb,
  trackUser,
  uniqueEmail,
} from "@/tests/db/helpers"

/**
 * Tests d'intégration des articles et du comptage de vues.
 *
 * Le comptage mérite son attention : c'est la **seule écriture accordée au compte de
 * lecture**, et les tests vérifient à la fois qu'elle fonctionne et qu'elle ne
 * permet rien d'autre - notamment qu'un brouillon reste invisible et sans effet.
 */

type ArticleRow = {
  id: Buffer
  slug: string
  title: string
  status: "draft" | "published"
  view_count: number
  featured: number
}

let actor: Buffer
const created: Buffer[] = []

const uniqueSlug = (prefix = "art") =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`

async function makeArticle(overrides: { slug?: string; title?: string } = {}) {
  const row = await write.rowStrict<ArticleRow>("create_article", [
    overrides.slug ?? uniqueSlug(),
    overrides.title ?? "Article de test",
    "Guide",
    "12 juillet 2026",
    actor,
    null,
  ])
  created.push(row.id)
  return row
}

/** Remplit ce que la publication exige, et pose un bloc. */
async function fillForPublication(id: Buffer, slug: string) {
  await write.void("update_article", [
    id,
    slug,
    "Guide",
    "Article de test",
    "Le chapô, qui porte la promesse.",
    "Léa Roussel",
    "Associée, direction produit",
    "LR",
    "2026-07-12",
    "12 juillet 2026",
    "8 min",
    null,
    "",
    null,
    actor,
    null,
  ])
  await write.void("set_article_blocks", [
    id,
    JSON.stringify([{ kind: "paragraph", text: "Un paragraphe." }]),
    actor,
    null,
  ])
}

beforeAll(async () => {
  const user = await write.rowStrict<{ id: Buffer }>("create_user", [
    uniqueEmail("articles"),
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
    await write.void("delete_article", [id, actor, null]).catch(() => {})
  }
  await cleanupUsers()
  await closePool()
})

describeDb("create_article", () => {
  it("crée un brouillon daté du jour", async () => {
    const row = await makeArticle({ title: "Faut-il acheter ou construire ?" })
    expect(row.status).toBe("draft")

    const sets = await write.sets("get_article_full", [row.id, null])
    const fiche = sets[0][0] as { published_on: Date | string | null }
    // Une date fausse se remarque mieux qu'une date absente.
    expect(fiche.published_on).not.toBeNull()
  })

  it("dérive le slug du titre", async () => {
    const row = await write.rowStrict<ArticleRow>("create_article", [
      null,
      `L'IA dans les outils métiers ${Math.random().toString(36).slice(2, 7)}`,
      "Analyse",
      "",
      actor,
      null,
    ])
    created.push(row.id)
    expect(row.slug).toMatch(/^l-ia-dans-les-outils-metiers-[a-z0-9]+$/)
  })

  it("refuse un slug déjà pris", async () => {
    const first = await makeArticle()
    await expect(
      write.row("create_article", [
        first.slug,
        "Doublon",
        "Guide",
        "",
        actor,
        null,
      ])
    ).rejects.toMatchObject({ code: "SLUG_TAKEN" })
  })
})

describeDb("blocs du corps", () => {
  it("écrit les quatre types et les rend dans l'ordre", async () => {
    const row = await makeArticle()
    await write.void("set_article_blocks", [
      row.id,
      JSON.stringify([
        { kind: "paragraph", text: "<p>Un paragraphe.</p>" },
        { kind: "heading", text: "Un intertitre" },
        { kind: "callout", lead: "La phrase.", text: "Son explication." },
        {
          kind: "numbered",
          items: JSON.stringify([
            { num: "01", title: "Premier", text: "Un." },
            { num: "02", title: "Second", text: "Deux." },
          ]),
        },
      ]),
      actor,
      null,
    ])

    const sets = await write.sets("get_article_full", [row.id, null])
    const blocks = sets[1] as {
      kind: string
      text: string | null
      lead: string | null
      items: string | null
    }[]

    expect(blocks.map((b) => b.kind)).toEqual([
      "paragraph",
      "heading",
      "callout",
      "numbered",
    ])
    expect(blocks[2].lead).toBe("La phrase.")
    expect(JSON.parse(blocks[3].items!)).toHaveLength(2)
  })

  it("ne stocke `items` que pour un bloc numéroté", async () => {
    const row = await makeArticle()
    await write.void("set_article_blocks", [
      row.id,
      JSON.stringify([
        // `items` fourni à tort sur un paragraphe : la procédure l'ignore, pour que
        // la forme en base dise le type sans avoir à l'interpréter.
        { kind: "paragraph", text: "Un.", items: JSON.stringify([{ a: 1 }]) },
      ]),
      actor,
      null,
    ])
    const sets = await write.sets("get_article_full", [row.id, null])
    expect((sets[1][0] as { items: string | null }).items).toBeNull()
  })

  it("écarte un bloc vide plutôt que d'échouer sur toute la liste", async () => {
    const row = await makeArticle()
    await write.void("set_article_blocks", [
      row.id,
      JSON.stringify([
        { kind: "paragraph", text: "Gardé." },
        { kind: "paragraph", text: "   " },
        { kind: "heading", text: "" },
        { kind: "numbered", items: "[]" },
      ]),
      actor,
      null,
    ])
    const sets = await write.sets("get_article_full", [row.id, null])
    expect(sets[1]).toHaveLength(1)
  })

  it("écarte un type inconnu", async () => {
    const row = await makeArticle()
    await write.void("set_article_blocks", [
      row.id,
      JSON.stringify([
        { kind: "video", text: "Non." },
        { kind: "paragraph", text: "Oui." },
      ]),
      actor,
      null,
    ])
    const sets = await write.sets("get_article_full", [row.id, null])
    expect(sets[1]).toHaveLength(1)
  })

  it("remplace en bloc plutôt que d'ajouter", async () => {
    const row = await makeArticle()
    const set = (items: unknown) =>
      write.void("set_article_blocks", [
        row.id,
        JSON.stringify(items),
        actor,
        null,
      ])

    await set([
      { kind: "paragraph", text: "A" },
      { kind: "paragraph", text: "B" },
    ])
    await set([{ kind: "paragraph", text: "C" }])

    const sets = await write.sets("get_article_full", [row.id, null])
    expect(sets[1]).toHaveLength(1)
    expect((sets[1][0] as { text: string }).text).toBe("C")
  })

  it("refuse un JSON illisible", async () => {
    const row = await makeArticle()
    await expect(
      write.void("set_article_blocks", [row.id, "pas du json", actor, null])
    ).rejects.toMatchObject({ code: "INVALID_JSON" })
  })
})

describeDb("update_article", () => {
  it("préserve la mise en avant quand elle n'est pas fournie", async () => {
    const row = await makeArticle()
    await write.void("set_article_featured", [row.id, 1, actor, null])
    await fillForPublication(row.id, row.slug)

    const sets = await write.sets("get_article_full", [row.id, null])
    // `update_article` reçoit `NULL` pour `featured` : la valeur doit survivre,
    // sinon enregistrer la fiche retirerait l'article de la tête du flux.
    expect((sets[0][0] as ArticleRow).featured).toBe(1)
  })

  it("garde la date précédente quand la nouvelle est illisible", async () => {
    const row = await makeArticle()
    await fillForPublication(row.id, row.slug)

    await write.void("update_article", [
      row.id,
      row.slug,
      "Guide",
      "Titre",
      "Chapô.",
      "Auteur",
      "Rôle",
      "AA",
      "pas-une-date",
      "12 juillet 2026",
      "8 min",
      null,
      "",
      null,
      actor,
      null,
    ])

    const sets = await write.sets("get_article_full", [row.id, null])
    const fiche = sets[0][0] as { published_on: Date | string | null }
    // Une faute de frappe ne doit pas effacer une date valide.
    expect(fiche.published_on).not.toBeNull()
  })
})

describeDb("set_article_featured", () => {
  it("est exclusive : mettre en avant retire la précédente", async () => {
    const first = await makeArticle()
    const second = await makeArticle()

    await write.void("set_article_featured", [first.id, 1, actor, null])
    await write.void("set_article_featured", [second.id, 1, actor, null])

    const list = await write.rows<ArticleRow>("list_articles", [null])
    const featured = list.filter((one) => one.featured === 1)
    // Le flux public affiche un article en tête et l'exclut de la grille : deux
    // mises en avant en feraient disparaître une.
    expect(featured).toHaveLength(1)
    expect(featured[0].slug).toBe(second.slug)
  })

  it("se retire", async () => {
    const row = await makeArticle()
    await write.void("set_article_featured", [row.id, 1, actor, null])
    await write.void("set_article_featured", [row.id, 0, actor, null])
    const list = await write.rows<ArticleRow>("list_articles", [null])
    expect(list.find((one) => one.slug === row.slug)?.featured).toBe(0)
  })
})

describeDb("publish_article", () => {
  it("publie un article complet", async () => {
    const row = await makeArticle()
    await fillForPublication(row.id, row.slug)
    await expect(
      write.void("publish_article", [row.id, 1, actor, null])
    ).resolves.toBeUndefined()
  })

  it("refuse un article sans chapô ni auteur", async () => {
    const row = await makeArticle()
    await expect(
      write.void("publish_article", [row.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "ARTICLE_INCOMPLETE" })
  })

  it("refuse un article sans bloc", async () => {
    const row = await makeArticle()
    await write.void("update_article", [
      row.id,
      row.slug,
      "Guide",
      "Titre",
      "Chapô.",
      "Auteur",
      "Rôle",
      "AA",
      "2026-07-12",
      "12 juillet 2026",
      "",
      null,
      "",
      null,
      actor,
      null,
    ])
    await expect(
      write.void("publish_article", [row.id, 1, actor, null])
    ).rejects.toMatchObject({ code: "ARTICLE_NO_BLOCK" })
  })

  it("n'exige pas le temps de lecture : utile, pas indispensable", async () => {
    const row = await makeArticle()
    await write.void("update_article", [
      row.id,
      row.slug,
      "Guide",
      "Titre",
      "Chapô.",
      "Auteur",
      "Rôle",
      "AA",
      "2026-07-12",
      "12 juillet 2026",
      "",
      null,
      "",
      null,
      actor,
      null,
    ])
    await write.void("set_article_blocks", [
      row.id,
      JSON.stringify([{ kind: "paragraph", text: "Un." }]),
      actor,
      null,
    ])
    await expect(
      write.void("publish_article", [row.id, 1, actor, null])
    ).resolves.toBeUndefined()
  })
})

describeDb("comptage des vues", () => {
  it("incrémente le total et la ligne du jour, dans la même transaction", async () => {
    const row = await makeArticle()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_article", [row.id, 1, actor, null])

    await write.void("pub_count_article_view", [row.slug])
    await write.void("pub_count_article_view", [row.slug])
    await write.void("pub_count_article_view", [row.slug])

    const sets = await write.sets("get_article_views", [row.id])
    const totals = sets[0][0] as { view_count: number; views_7d: number }
    expect(Number(totals.view_count)).toBe(3)
    // Le total dénormalisé et l'agrégat quotidien doivent toujours s'accorder.
    expect(Number(totals.views_7d)).toBe(3)

    const daily = sets[1] as { views: number }[]
    expect(daily).toHaveLength(1)
    expect(Number(daily[0].views)).toBe(3)
  })

  it("reste sans effet sur un brouillon, et sans erreur", async () => {
    const row = await makeArticle()
    await fillForPublication(row.id, row.slug)
    // Pas publié : l'appel doit être silencieux et ne rien compter, sinon le
    // compteur révélerait l'existence d'un brouillon.
    await expect(
      write.void("pub_count_article_view", [row.slug])
    ).resolves.toBeUndefined()

    const sets = await write.sets("get_article_views", [row.id])
    expect(Number((sets[0][0] as { view_count: number }).view_count)).toBe(0)
  })

  it("reste sans effet sur un slug inconnu, et sans erreur", async () => {
    await expect(
      write.void("pub_count_article_view", ["ce-slug-nexiste-pas"])
    ).resolves.toBeUndefined()
  })

  it("conserve le compteur à la dépublication", async () => {
    const row = await makeArticle()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_article", [row.id, 1, actor, null])
    await write.void("pub_count_article_view", [row.slug])
    await write.void("publish_article", [row.id, 0, actor, null])

    const sets = await write.sets("get_article_views", [row.id])
    // Dépublier n'est pas remettre à zéro : republier doit retrouver son histoire.
    expect(Number((sets[0][0] as { view_count: number }).view_count)).toBe(1)
  })

  it("emporte les vues avec l'article supprimé", async () => {
    const row = await makeArticle()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_article", [row.id, 1, actor, null])
    await write.void("pub_count_article_view", [row.slug])

    await write.void("delete_article", [row.id, actor, null])

    // `ON DELETE CASCADE` : aucune ligne de comptage orpheline.
    const sets = await write.sets("get_article_views", [row.id])
    expect(sets[0]).toHaveLength(0)
    expect(sets[1]).toHaveLength(0)
  })
})

describeDb("surface publique des articles", () => {
  it("ne montre que les articles publiés", async () => {
    const draft = await makeArticle()
    const live = await makeArticle()
    await fillForPublication(live.id, live.slug)
    await write.void("publish_article", [live.id, 1, actor, null])

    const rows = await write.rows<{ slug: string }>("pub_list_articles")
    const slugs = rows.map((one) => one.slug)
    expect(slugs).toContain(live.slug)
    expect(slugs).not.toContain(draft.slug)
  })

  it("rend zéro ligne sur un brouillon comme sur un article inexistant", async () => {
    const draft = await makeArticle()
    expect((await write.sets("pub_get_article", [draft.slug]))[0]).toHaveLength(
      0
    )
    expect((await write.sets("pub_get_article", ["inconnu"]))[0]).toHaveLength(
      0
    )
  })

  it("rend deux jeux pour un article publié", async () => {
    const row = await makeArticle()
    await fillForPublication(row.id, row.slug)
    await write.void("publish_article", [row.id, 1, actor, null])

    const sets = await write.sets("pub_get_article", [row.slug])
    expect(sets).toHaveLength(2)
    expect(sets[0]).toHaveLength(1)
    expect(sets[1]).toHaveLength(1)
  })
})
