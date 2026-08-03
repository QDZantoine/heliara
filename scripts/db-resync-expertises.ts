/**
 * Repousse en base les blocs éditoriaux d'un service d'expertise.
 *
 * `pnpm db:resync-expertises <slug> [<slug>...]`
 *
 * **Pourquoi ce script existe.** Les expertises sont administrables : le site public
 * les lit en base, et `lib/content/expertises.ts` n'est plus que le repli et la source
 * d'amorçage. Corriger une affirmation technique dans le fichier ne change donc **rien**
 * au site en ligne. `pnpm db:seed` ne le fera pas non plus - il est idempotent et
 * laisse intact tout service dont le slug existe déjà, ce qui est exactement ce qu'on
 * veut de lui : rejouer l'amorçage ne doit pas défaire le travail fait dans
 * l'administration.
 *
 * Il restait donc un trou entre les deux. Pour une correction de fond - une techno
 * nommée à tort, une préconisation absente - on ne veut ni tout réamorcer ni ressaisir
 * à la main dans l'administration ce qui est déjà écrit et relu dans le dépôt.
 *
 * **Ce qu'il touche, et ce qu'il ne touche pas.** Il remplace la fiche, les livrables,
 * les choix techniques et les objections des services **nommés en argument**, et rien
 * d'autre : ni les familles, ni le statut de publication, ni les services qu'on ne lui
 * demande pas. Aucun slug par défaut, volontairement - un script de ce genre lancé
 * sans argument ne doit pas écraser neuf services.
 *
 * **Il passe par les procédures stockées**, comme tout le reste : mêmes contrôles,
 * mêmes transactions, et le journal d'audit garde la trace de chaque écriture sous le
 * compte d'amorçage. Aucune requête SQL n'est écrite ici.
 */
import "@/scripts/env"

import { stdout } from "node:process"

import { expertiseServices } from "@/lib/content/expertises"
import { BusinessError, write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"

/** Le même acteur que l'amorçage : l'audit distingue l'import de la saisie humaine. */
const SEED_EMAIL = "seed@heliara.local"

type ServiceRow = { id: Buffer; slug: string; family_id: Buffer }

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

async function main() {
  const slugs = process.argv.slice(2)
  if (slugs.length === 0) {
    stdout.write(
      "Usage : pnpm db:resync-expertises <slug> [<slug>...]\n" +
        "Aucun slug par défaut : ce script écrase le contenu des services nommés.\n"
    )
    process.exit(1)
  }

  const actor = await seedActor()
  // `null` : tous les statuts. Un service en brouillon se corrige aussi.
  const rows = await write.rows<ServiceRow>("list_expertise_services", [null])
  const inBase = new Map(rows.map((row) => [row.slug, row]))

  for (const slug of slugs) {
    const service = expertiseServices.find((one) => one.slug === slug)
    if (!service) {
      stdout.write(`  ! ${slug} : absent de lib/content/expertises.ts\n`)
      continue
    }
    const row = inBase.get(slug)
    if (!row) {
      stdout.write(`  ! ${slug} : absent de la base\n`)
      continue
    }

    // La famille reste celle de la base : ce script corrige des textes, il ne
    // reclasse pas un service - un reclassement déplace une entrée de menu.
    await write.void("update_expertise_service", [
      row.id,
      service.slug,
      row.family_id,
      service.title,
      service.tagline,
      service.problem,
      service.relatedCase,
      service.ctaTitle,
      actor,
      null,
    ])
    await write.void("set_expertise_deliverables", [
      row.id,
      JSON.stringify(service.deliverables),
      actor,
      null,
    ])
    await write.void("set_expertise_tech_choices", [
      row.id,
      JSON.stringify(service.techChoices),
      actor,
      null,
    ])
    await write.void("set_expertise_faq", [
      row.id,
      JSON.stringify(service.faq),
      actor,
      null,
    ])

    // Appelée même quand la section est absente : c'est ce qui permet de la
    // **retirer** d'un service qui en portait une. Sans cet appel, un contenu
    // supprimé du dépôt survivrait en base sans que rien ne le signale.
    await write.void("set_expertise_why_custom", [
      row.id,
      JSON.stringify(
        service.whyCustom ?? { lead: "", closing: "", signals: [] }
      ),
      actor,
      null,
    ])

    stdout.write(
      `  ${slug} : fiche, ${service.deliverables.length} livrables, ` +
        `${service.techChoices.length} points techniques, ${service.faq.length} objections` +
        (service.whyCustom
          ? `, ${service.whyCustom.signals.length} signes de sur-mesure`
          : ", sans section sur-mesure") +
        "\n"
    )
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
