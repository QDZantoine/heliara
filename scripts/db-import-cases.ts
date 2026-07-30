/**
 * Importe des fiches de réalisation depuis un fichier JSON.
 *
 * `pnpm db:import-cases docs/realisations-source.json`
 *
 * **Pourquoi un import plutôt qu'une saisie.** Neuf fiches rédigées hors de l'outil,
 * chacune avec ses chapitres, sa fiche technique et ses enseignements, représentent une
 * heure de recopie dans l'administration - et une heure de recopie, c'est une faute de
 * frappe garantie quelque part. Le fichier se relit, se versionne et se rejoue.
 *
 * **Il rejoue le schéma zod de l'administration**, `caseSchema` et ses collections. Pas
 * une validation parallèle : la même. Un import qui accepterait ce que l'éditeur refuse
 * créerait des fiches impossibles à modifier ensuite, et le défaut ne se verrait qu'au
 * premier enregistrement dans l'écran.
 *
 * **Rien n'est publié.** Les fiches arrivent en brouillon, quelles que soient les
 * données : une fiche importée n'a pas encore d'image de tête, ses chiffres restent
 * souvent à confirmer, et la publication est une décision qui se prend devant l'aperçu.
 * `publish_case_study` refuserait de toute façon une fiche incomplète.
 *
 * **Idempotent par slug**, comme `db:seed` : une fiche dont le slug existe déjà est
 * laissée intacte. Rejouer l'import après avoir corrigé une fiche dans l'administration
 * ne défait donc rien - il faut supprimer la fiche pour la réimporter.
 */
import "@/scripts/env"

import { readFileSync } from "node:fs"
import { stdout } from "node:process"

import { BusinessError, write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"
import {
  caseFields,
  chapterSchema,
  lessonSchema,
  metaSchema,
  resultSchema,
  withTestimonialRule,
} from "@/lib/schemas/case"

import { z } from "zod"

/** Le même acteur que l'amorçage : l'audit distingue l'import de la saisie humaine. */
const SEED_EMAIL = "seed@heliara.local"

/**
 * La forme d'une fiche dans le fichier.
 *
 * Elle reprend `caseFields` en rendant facultatif ce que l'administration remplit avec
 * des valeurs par défaut - halo, accent, mise en avant, carte large - parce qu'un
 * rédacteur n'a pas à trancher des réglages d'affichage. Les collections sont vides par
 * défaut : une fiche sans résultat chiffré est un cas normal, pas une omission.
 *
 * `withTestimonialRule` remet la règle du tout ou rien, que `caseFields` ne porte pas :
 * un témoignage à demi rempli doit être refusé ici comme dans l'écran.
 */
const importedCase = withTestimonialRule(
  caseFields
    .omit({ halo: true, accent: true, featured: true, wide: true })
    .extend({
      halo: z.enum(["warm", "cool"]).default("warm"),
      accent: z.enum(["brand", "info"]).default("brand"),
      featured: z.boolean().default(false),
      wide: z.boolean().default(false),
      /**
       * Exigé ici alors que `caseSchema` ne le porte pas : `create_case_study` en a
       * besoin, et une fiche sans année ne peut pas être créée du tout.
       */
      year: z
        .string()
        .trim()
        .min(1, "Indiquez une année.")
        .max(9, "Cette année est trop longue."),
      chapters: z
        .array(chapterSchema)
        .min(1, "Au moins un chapitre est exigé."),
      results: z.array(resultSchema).default([]),
      meta: z.array(metaSchema).default([]),
      lessons: z.array(lessonSchema.shape.text).default([]),
    })
)

const fileSchema = z.array(importedCase).min(1, "Le fichier est vide.")

type Imported = z.infer<typeof importedCase>

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
 * Signale les gabarits laissés en place.
 *
 * Les fiches rédigées hors de l'outil portent des marqueurs du genre « à compléter »
 * pour ce qui reste à confirmer. Ils sont **importés tels quels** - les effacer
 * silencieusement ferait disparaître le rappel - mais ils sont comptés et affichés,
 * parce qu'une fiche qui en contient n'est pas prête à publier.
 */
const GABARIT =
  /\[?\s*(à compléter|à confirmer|à définir|ajoute un résultat)|^20XX$/i

function gabaritsDe(fiche: Imported): string[] {
  const champs: string[] = []
  const voir = (nom: string, valeur: string | undefined) => {
    if (valeur && GABARIT.test(valeur)) {
      champs.push(nom)
    }
  }
  /*
    `year` est un VARCHAR(9) et la publication l'exige : un « [À COMPLÉTER] » n'y tient
    pas. Un fichier de reprise y porte donc un gabarit court, `20XX`, que l'expression
    reconnaît en entier - une année réelle ne peut pas le contenir par accident.
  */
  voir("year", fiche.year)
  voir("title", fiche.title)
  voir("heroTitle", fiche.heroTitle)
  voir("sector", fiche.sector)
  voir("badge", fiche.badge)
  voir("summary", fiche.summary)
  voir("teaser", fiche.teaser)
  voir("figure", fiche.figure)
  voir("measure", fiche.measure)
  voir("resultsLabel", fiche.resultsLabel)
  fiche.chapters.forEach((chapitre, index) => {
    voir(`chapters.${index}.title`, chapitre.title)
    voir(`chapters.${index}.text`, chapitre.text)
    voir(`chapters.${index}.callout`, chapitre.callout)
  })
  fiche.meta.forEach((ligne, index) => {
    voir(`meta.${index}.value`, ligne.value)
  })
  return champs
}

async function main() {
  const chemin = process.argv[2]
  if (!chemin) {
    stdout.write(
      "Usage : pnpm db:import-cases <fichier.json>\n" +
        "Le format attendu est décrit dans docs/brief-realisation.md.\n"
    )
    process.exit(1)
  }

  const brut: unknown = JSON.parse(readFileSync(chemin, "utf8"))
  /*
    Les messages des schémas sont écrits pour un champ rempli de travers, jamais pour un
    champ absent : dans un formulaire, il est toujours là, au pire vide. Un fichier écrit
    à la main omet des clés, et zod répondait alors « expected string, received
    undefined » au milieu de messages français.

    L'aiguillage est posé ici et non dans `lib/schemas/case.ts` : c'est l'import qui a ce
    cas, pas l'éditeur.
  */
  const parsed = fileSchema.safeParse(brut, {
    error: (issue) =>
      issue.code === "invalid_type" && issue.input === undefined
        ? "Ce champ est obligatoire, et il est absent du fichier."
        : undefined,
  })
  if (!parsed.success) {
    stdout.write("Le fichier est refusé. Chaque écart, dans l'ordre :\n\n")
    for (const issue of parsed.error.issues) {
      stdout.write(
        `  ${issue.path.join(".") || "(racine)"} : ${issue.message}\n`
      )
    }
    stdout.write(
      "\nLes règles de chaque champ sont dans docs/brief-realisation.md.\n"
    )
    process.exit(1)
  }

  const actor = await seedActor()
  const existing = new Set(
    (await write.rows<{ slug: string }>("list_case_studies", [null])).map(
      (row) => row.slug
    )
  )

  let cree = 0
  let ignore = 0
  const aCompleter: { slug: string; champs: string[] }[] = []

  for (const fiche of parsed.data) {
    if (existing.has(fiche.slug)) {
      stdout.write(`  = ${fiche.slug} (existe déjà, laissée intacte)\n`)
      ignore += 1
      continue
    }

    const row = await write.rowStrict<{ id: Buffer }>("create_case_study", [
      fiche.slug,
      fiche.title,
      fiche.sector,
      fiche.year,
      actor,
      null,
    ])

    await write.void("update_case_study", [
      row.id,
      fiche.slug,
      fiche.sector,
      fiche.year,
      fiche.badge ?? "",
      fiche.title,
      fiche.heroTitle ?? "",
      fiche.teaser ?? "",
      fiche.summary ?? "",
      fiche.figure ?? "",
      fiche.measure ?? "",
      fiche.halo,
      fiche.accent,
      fiche.featured ? 1 : 0,
      fiche.wide ? 1 : 0,
      fiche.resultsLabel ?? "",
      fiche.testimonialQuote ?? "",
      fiche.testimonialName ?? "",
      fiche.testimonialRole ?? "",
      fiche.testimonialInitials ?? "",
      // L'image de tête arrive par le dépôt de fichiers de l'administration : un
      // identifiant de média ne peut pas venir d'un fichier texte.
      null,
      actor,
      null,
    ])

    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify(
        fiche.chapters.map((chapitre) => ({
          // La numérotation est refaite par la procédure, dans l'ordre du tableau.
          num: "",
          title: chapitre.title,
          text: chapitre.text,
          callout: chapitre.callout ?? "",
        }))
      ),
      actor,
      null,
    ])
    await write.void("set_case_results", [
      row.id,
      JSON.stringify(fiche.results),
      actor,
      null,
    ])
    await write.void("set_case_meta", [
      row.id,
      JSON.stringify(fiche.meta),
      actor,
      null,
    ])
    await write.void("set_case_lessons", [
      row.id,
      JSON.stringify(fiche.lessons.map((text) => ({ text }))),
      actor,
      null,
    ])

    const gabarits = gabaritsDe(fiche)
    if (gabarits.length > 0) {
      aCompleter.push({ slug: fiche.slug, champs: gabarits })
    }

    cree += 1
    stdout.write(
      `  + ${fiche.slug} : ${fiche.chapters.length} chapitre(s), ` +
        `${fiche.results.length} résultat(s), ${fiche.meta.length} ligne(s) technique(s)\n`
    )
  }

  stdout.write(`\n${cree} créée(s) en brouillon, ${ignore} ignorée(s).\n`)

  if (aCompleter.length > 0) {
    stdout.write(
      `\nGabarits restants - ces fiches ne sont pas prêtes à publier :\n`
    )
    for (const { slug, champs } of aCompleter) {
      stdout.write(`  ${slug}\n    ${champs.join(", ")}\n`)
    }
  }

  stdout.write(
    "\nRien n'est publié : une fiche importée n'a pas encore d'image de tête, et la\n" +
      "publication se décide devant l'aperçu.\n"
  )

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
