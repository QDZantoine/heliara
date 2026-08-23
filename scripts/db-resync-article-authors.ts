/**
 * Repose la signature des articles en base.
 *
 * `pnpm db:resync-article-authors <slug> [<slug>...]`
 *
 * **Pourquoi ce script existe.** Les six articles étaient signés par cinq personnes
 * inventées - les mêmes noms de démonstration que ceux déjà retirés de l'équipe. Le
 * dépôt est corrigé, mais les articles sont administrables : le site public les lit en
 * base, et `lib/content/articles.ts` n'est plus que le repli et la source d'amorçage.
 * Corriger le fichier ne change donc **rien** au site en ligne, et `pnpm db:seed` ne le
 * fera pas non plus - il est idempotent et laisse intact tout article dont le slug
 * existe déjà, ce qui est exactement ce qu'on veut de lui.
 *
 * **Ce qu'il touche, et ce qu'il ne touche pas.** Les trois champs de signature - nom,
 * fonction, initiales - des articles **nommés en argument**, et rien d'autre : ni le
 * titre, ni le chapô, ni les blocs, ni le statut de publication, ni la date. Toutes les
 * autres valeurs sont relues en base et repassées telles quelles, ce qui préserve ce
 * qui a été retouché dans l'administration.
 *
 * **Aucun slug par défaut, volontairement.** Un tel script lancé sans argument
 * écraserait la signature de tous les articles, y compris celle d'un auteur qui aurait
 * légitimement signé son texte depuis l'administration.
 *
 * **Il passe par les procédures stockées**, comme tout le reste : mêmes contrôles,
 * mêmes transactions, et le journal d'audit garde la trace de chaque écriture sous le
 * compte d'amorçage. Aucune requête SQL n'est écrite ici.
 */
import "@/scripts/env"

import { stdout } from "node:process"

import { studioByline } from "@/lib/content/articles"
import { BusinessError, write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"

/** Le même acteur que l'amorçage : l'audit distingue l'import de la saisie humaine. */
const SEED_EMAIL = "seed@heliara.local"

type ArticleRow = {
  id: Buffer
  slug: string
  category: string
  title: string
  lead: string
  author: string
  published_on: Date | string
  date_label: string
  reading_time: string
  featured: number
  related_case_slug: string | null
  hero_media_id: Buffer | null
}

async function seedActor(): Promise<Buffer> {
  const rows = await write.rows<{ id: Buffer; email: string }>("list_users")
  const found = rows.find((row) => row.email === SEED_EMAIL)
  if (!found) {
    throw new Error(
      `Compte d'amorçage ${SEED_EMAIL} absent. Lancez d'abord \`pnpm db:seed\`.`
    )
  }
  return found.id
}

/**
 * La date au format que la procédure attend.
 *
 * `update_article` reçoit la date en texte et la filtre par expression régulière :
 * elle garde la valeur précédente si la forme ne lui plaît pas. Le pilote MariaDB rend
 * un `Date` pour une colonne `DATE`, dont l'`toISOString` part en UTC - à Paris, un
 * 1er juillet à minuit y devient le 30 juin. On prend donc les composantes locales.
 */
function jour(value: Date | string) {
  if (typeof value === "string") {
    return value.slice(0, 10)
  }
  const mois = String(value.getMonth() + 1).padStart(2, "0")
  const jourDuMois = String(value.getDate()).padStart(2, "0")
  return `${value.getFullYear()}-${mois}-${jourDuMois}`
}

async function main() {
  const slugs = process.argv.slice(2)
  if (slugs.length === 0) {
    stdout.write(
      "Usage : pnpm db:resync-article-authors <slug> [<slug>...]\n" +
        "Aucun slug par défaut : ce script écrase la signature des articles nommés.\n"
    )
    process.exit(1)
  }

  const actor = await seedActor()
  // `null` : tous les statuts. Un brouillon se corrige aussi - il sera publié un jour.
  const rows = await write.rows<ArticleRow>("list_articles", [null])
  const inBase = new Map(rows.map((row) => [row.slug, row]))

  for (const slug of slugs) {
    const row = inBase.get(slug)
    if (!row) {
      stdout.write(`  ! ${slug} : absent de la base\n`)
      continue
    }
    if (row.author === studioByline.author) {
      stdout.write(`  = ${slug} : déjà signé « ${row.author} »\n`)
      continue
    }

    await write.void("update_article", [
      row.id,
      row.slug,
      row.category,
      row.title,
      row.lead,
      studioByline.author,
      studioByline.authorRole,
      studioByline.authorInitials,
      jour(row.published_on),
      row.date_label,
      row.reading_time,
      row.featured,
      row.related_case_slug,
      row.hero_media_id,
      actor,
      null,
    ])

    stdout.write(`  ${slug} : « ${row.author} » → « ${studioByline.author} »\n`)
  }

  await closePool()
}

main().catch(async (error) => {
  if (error instanceof BusinessError) {
    stdout.write(`Refus de la base : ${error.code}\n`)
  } else {
    console.error(error)
  }
  await closePool()
  process.exit(1)
})
