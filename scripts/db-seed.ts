/**
 * Importe le contenu éditorial statique dans la base.
 *
 * `pnpm db:seed`
 *
 * **Pourquoi cette commande est nécessaire, et pas seulement pratique.**
 *
 * Le site public lit la base, avec repli sur `lib/content/*.ts` quand celle-ci est
 * vide ou injoignable. Ce repli est le bon comportement pour un incident, mais il
 * est « tout ou rien » : dès qu'**une** fiche est publiée en base, le repli cesse
 * de s'appliquer et les six fiches statiques disparaissent de la grille. La
 * première publication viderait donc le portfolio.
 *
 * L'alternative - fusionner base et statique à la lecture - a été écartée : elle
 * installe une ambiguïté permanente, puisqu'il devient impossible de supprimer une
 * fiche statique depuis l'administration. Mieux vaut que la base soit la seule
 * source, et que le statique ne serve que de secours.
 *
 * D'où cette commande : elle amorce la base avec le contenu existant, une fois,
 * pour que la bascule se fasse sans rien perdre.
 *
 * **Idempotente** : une fiche dont le slug existe déjà est laissée telle quelle,
 * jamais écrasée. Rejouer la commande après avoir modifié un contenu dans
 * l'administration ne défait donc pas le travail fait.
 */
import "@/scripts/env"

import { stdout } from "node:process"

import { hashPassword } from "@/lib/auth/password"
import { articles } from "@/lib/content/articles"
import { caseStudies } from "@/lib/content/cases"
import { blocksToJson } from "@/lib/db/articles"
import { BusinessError, write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"
import type { BlockInput } from "@/lib/schemas/article"

/** Compte technique auteur de l'amorçage, pour que le journal d'audit ait un acteur. */
const SEED_EMAIL = "seed@heliara.local"

/**
 * L'acteur de l'amorçage.
 *
 * Un compte dédié plutôt que `NULL` : le journal d'audit doit pouvoir distinguer
 * ce qui vient de l'import de ce qu'une personne a écrit. Il est créé suspendu -
 * enfin, il le serait s'il restait un autre administrateur actif ; on se contente
 * d'un mot de passe aléatoire jamais communiqué, ce qui le rend inutilisable.
 */
async function seedActor(): Promise<Buffer> {
  const existing = await write.row<{ id: Buffer }>("get_user_for_login", [
    SEED_EMAIL,
  ])
  if (existing) {
    return existing.id
  }

  const row = await write.rowStrict<{ id: Buffer }>("create_user", [
    SEED_EMAIL,
    // Un mot de passe aléatoire, jamais affiché : le compte ne sert qu'à signer
    // les écritures de l'import, personne ne doit pouvoir s'en servir.
    await hashPassword(crypto.randomUUID() + crypto.randomUUID()),
    "Import du contenu",
    "admin",
    null,
    null,
  ])
  return row.id
}

async function seedCases(actor: Buffer) {
  const existing = new Set(
    (await write.rows<{ slug: string }>("list_case_studies", [null])).map(
      (row) => row.slug
    )
  )

  let created = 0
  let skipped = 0

  for (const study of caseStudies) {
    if (existing.has(study.slug)) {
      skipped += 1
      continue
    }

    const row = await write.rowStrict<{ id: Buffer }>("create_case_study", [
      study.slug,
      study.title,
      study.sector,
      study.year,
      actor,
      null,
    ])

    await write.void("update_case_study", [
      row.id,
      study.slug,
      study.sector,
      study.year,
      study.badge,
      study.title,
      study.heroTitle,
      study.teaser,
      study.summary,
      study.figure,
      study.measure,
      study.halo,
      study.accent,
      study.featured ? 1 : 0,
      study.wide ? 1 : 0,
      study.resultsLabel,
      study.testimonial.quote,
      study.testimonial.name,
      study.testimonial.role,
      study.testimonial.initials,
      null,
      actor,
      null,
    ])

    // Les corps de chapitre sont du texte brut dans le contenu statique ; ils
    // deviennent du HTML sous l'éditeur riche. Un paragraphe suffit à les rendre
    // équivalents, et l'éditeur les reprendra tels quels.
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify(
        study.chapters.map((chapter) => ({
          num: chapter.num,
          title: chapter.title,
          text: `<p>${chapter.text}</p>`,
          callout: chapter.callout ?? "",
        }))
      ),
      actor,
      null,
    ])

    await write.void("set_case_results", [
      row.id,
      JSON.stringify(study.results),
      actor,
      null,
    ])
    await write.void("set_case_meta", [
      row.id,
      JSON.stringify(study.meta),
      actor,
      null,
    ])
    await write.void("set_case_lessons", [
      row.id,
      JSON.stringify(study.lessons.map((text) => ({ text }))),
      actor,
      null,
    ])

    // Publiée d'emblée : ces fiches sont déjà en ligne aujourd'hui, les remettre
    // en brouillon les retirerait du site.
    await write.void("publish_case_study", [row.id, 1, actor, null])

    created += 1
    stdout.write(`  + ${study.slug}\n`)
  }

  return { created, skipped }
}

/**
 * Importe les articles.
 *
 * Le corps passe des blocs typés du fichier à la forme plate de la base :
 * `text` / `lead` / `items`. La conversion est faite par `blocksToJson`, la même que
 * celle de l'action d'administration - une seule définition du passage, donc aucune
 * chance de voir l'import et l'éditeur produire des formes différentes.
 *
 * La mise en avant n'est pas posée dans la boucle : elle est exclusive, et
 * `set_article_featured` s'en charge après coup, une fois. Sinon chaque insertion
 * retirerait la précédente et seul le dernier article resterait en tête.
 */
async function seedArticles(actor: Buffer) {
  const existing = new Set(
    (await write.rows<{ slug: string }>("list_articles", [null])).map(
      (row) => row.slug
    )
  )

  let created = 0
  let skipped = 0
  let featured: Buffer | null = null

  for (const article of articles) {
    if (existing.has(article.slug)) {
      skipped += 1
      continue
    }

    const row = await write.rowStrict<{ id: Buffer }>("create_article", [
      article.slug,
      article.title,
      article.category,
      article.date,
      actor,
      null,
    ])

    await write.void("update_article", [
      row.id,
      article.slug,
      article.category,
      article.title,
      article.lead,
      article.author,
      article.authorRole,
      article.authorInitials,
      article.publishedAt,
      article.date,
      article.readingTime,
      null,
      article.relatedCase ?? "",
      null,
      actor,
      null,
    ])

    await write.void("set_article_blocks", [
      row.id,
      JSON.stringify(blocksToJson(article.body as BlockInput[])),
      actor,
      null,
    ])

    await write.void("publish_article", [row.id, 1, actor, null])

    if (article.featured) {
      featured = row.id
    }

    created += 1
    stdout.write(`  + ${article.slug}\n`)
  }

  if (featured) {
    // Après la boucle, et une seule fois : la mise en avant est exclusive.
    await write.void("set_article_featured", [featured, 1, actor, null])
  }

  return { created, skipped }
}

async function main() {
  stdout.write("\nAmorçage de la base depuis le contenu statique.\n\n")

  const actor = await seedActor()

  stdout.write("Réalisations\n")
  const cases = await seedCases(actor)
  stdout.write(`  ${cases.created} créée(s)`)
  stdout.write(cases.skipped ? `, ${cases.skipped} déjà présente(s).\n` : ".\n")

  stdout.write("\nArticles\n")
  const posts = await seedArticles(actor)
  stdout.write(`  ${posts.created} créé(s)`)
  stdout.write(posts.skipped ? `, ${posts.skipped} déjà présent(s).\n` : ".\n")
  stdout.write(
    "\nLe site public lit désormais la base. Le contenu statique reste en secours.\n\n"
  )
}

main()
  .catch((error) => {
    stdout.write(
      `\n${
        error instanceof BusinessError
          ? `Refus de la base : ${error.code}`
          : error instanceof Error
            ? error.message
            : String(error)
      }\n\n`
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
