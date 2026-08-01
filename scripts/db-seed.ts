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

import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { stdout } from "node:process"

import { hashPassword } from "@/lib/auth/password"
import { articles } from "@/lib/content/articles"
import { caseStudies } from "@/lib/content/cases"
import { clients } from "@/lib/content/clients"
import { expertiseFamilies, expertiseServices } from "@/lib/content/expertises"
import { partners, team } from "@/lib/content/team"
import { blocksToJson } from "@/lib/db/articles"
import { BusinessError, write } from "@/lib/db/call"
import { closePool } from "@/lib/db/pool"
import { objectKey, putObject } from "@/lib/s3"
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

    /*
      Le corps est repris tel quel, et non plus enveloppé dans un `<p>`.

      Les six fiches de démonstration portaient un paragraphe de texte brut par
      chapitre, que l'amorçage enveloppait pour le rendre équivalent à ce que produit
      l'éditeur riche. Les neuf fiches réelles portent déjà leur HTML, deux paragraphes
      par chapitre : les envelopper donnerait un `<p>` contenant deux `<p>`, du HTML
      imbriqué à tort que l'éditeur ne saurait pas rouvrir proprement.
    */
    await write.void("set_case_chapters", [
      row.id,
      JSON.stringify(
        study.chapters.map((chapter) => ({
          num: chapter.num,
          title: chapter.title,
          text: chapter.text,
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

/**
 * Importe les familles et les services d'expertise.
 *
 * Les familles d'abord : un service sans famille est refusé par la base. La cible de
 * nav de chaque famille est posée **après** ses services, puisqu'elle doit désigner un
 * service qui existe - et elle reprend la coïncidence du contenu statique, où le
 * service porte le même slug que sa famille. C'est précisément cette coïncidence que
 * `nav_service_slug` rend explicite.
 */
async function seedExpertises(actor: Buffer) {
  const existingFamilies = new Map(
    (
      await write.rows<{ id: Buffer; slug: string }>("list_expertise_families")
    ).map((row) => [row.slug, row.id])
  )
  const existingServices = new Set(
    (await write.rows<{ slug: string }>("list_expertise_services", [null])).map(
      (row) => row.slug
    )
  )

  let families = 0
  let services = 0
  let skipped = 0

  for (const family of expertiseFamilies) {
    let id = existingFamilies.get(family.slug)

    if (!id) {
      const row = await write.rowStrict<{ id: Buffer }>(
        "create_expertise_family",
        [family.slug, family.label, actor, null]
      )
      id = row.id
      existingFamilies.set(family.slug, id)
      families += 1
      stdout.write(`  + famille ${family.slug}\n`)
    }

    // La cible de nav est laissée vide à cette étape : elle est posée plus bas,
    // quand les services existent.
    await write.void("update_expertise_family", [
      id,
      family.slug,
      family.label,
      family.title,
      family.summary,
      family.tag,
      family.halo,
      family.lines[0],
      family.lines[1],
      family.lines[2],
      "",
      actor,
      null,
    ])
  }

  for (const service of expertiseServices) {
    if (existingServices.has(service.slug)) {
      skipped += 1
      continue
    }

    const familyId = existingFamilies.get(service.family)
    if (!familyId) {
      stdout.write(`  ! ${service.slug} : famille ${service.family} absente\n`)
      continue
    }

    const row = await write.rowStrict<{ id: Buffer }>(
      "create_expertise_service",
      [service.slug, service.title, familyId, actor, null]
    )

    await write.void("update_expertise_service", [
      row.id,
      service.slug,
      familyId,
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

    await write.void("publish_expertise_service", [row.id, 1, actor, null])

    services += 1
    stdout.write(`  + ${service.slug}\n`)
  }

  // La cible de nav, maintenant que les services existent.
  for (const family of expertiseFamilies) {
    const id = existingFamilies.get(family.slug)
    const hasTwin = expertiseServices.some(
      (service) => service.slug === family.slug
    )
    if (id && hasTwin) {
      await write.void("update_expertise_family", [
        id,
        family.slug,
        family.label,
        family.title,
        family.summary,
        family.tag,
        family.halo,
        family.lines[0],
        family.lines[1],
        family.lines[2],
        family.slug,
        actor,
        null,
      ])
    }
  }

  return { families, services, skipped }
}

/**
 * Dépose un fichier du dépôt dans le stockage objet et rend son identifiant de média.
 *
 * **C'est le seul endroit du projet où un fichier traverse l'application**, et c'est
 * inévitable ici : il n'y a pas de navigateur pour recevoir une URL signée. Les fichiers
 * viennent du dépôt, pas d'un appelant, donc la surface est nulle.
 *
 * **Les dimensions restent nulles**, et c'est un choix, pas un manque : la bande de logos
 * borne la hauteur de chaque image et laisse la largeur suivre, `shape` décidant de cette
 * hauteur. Les lire demanderait une bibliothèque de décodage pour une donnée qu'aucun
 * rendu ne consomme - et un SVG n'en a de toute façon pas.
 *
 * L'empreinte est calculée pour que la ligne soit identique à celle d'un envoi par le
 * navigateur, qui la fournit.
 */
async function seedMedia(
  actor: Buffer,
  chemin: string,
  alt = ""
): Promise<Buffer> {
  const octets = await readFile(join(process.cwd(), "public", chemin))
  const nom = chemin.split("/").pop() ?? chemin
  const extension = nom.split(".").pop()?.toLowerCase() ?? ""
  const mime =
    extension === "svg"
      ? "image/svg+xml"
      : extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : extension === "avif"
            ? "image/avif"
            : "image/jpeg"

  const key = objectKey(mime)
  await putObject(key, octets, mime)

  const row = await write.rowStrict<{ id: Buffer }>("create_media", [
    key,
    process.env.S3_BUCKET ?? "heliara",
    mime,
    octets.byteLength,
    null,
    null,
    alt,
    nom,
    createHash("sha256").update(octets).digest("hex"),
    actor,
    null,
  ])

  // Une ligne n'est `ready` qu'après confirmation : un envoi interrompu ne laisse rien
  // d'affichable, et l'amorçage doit produire des médias affichables.
  await write.void("confirm_media", [
    row.id,
    null,
    null,
    octets.byteLength,
    actor,
    null,
  ])

  return row.id
}

/**
 * Les références clientes du bandeau, publiées d'emblée.
 *
 * **Elles le sont parce qu'elles le sont déjà** : les huit logos s'affichent aujourd'hui
 * sur l'accueil depuis le contenu statique, et les remettre en brouillon les retirerait du
 * site. Leur autorisation d'usage a donc déjà été obtenue - c'est la condition qui les a
 * fait entrer dans `lib/content/clients.ts`.
 *
 * Idempotent par nom, comme le reste de l'amorçage. Les fichiers déposés une première fois
 * ne le sont pas deux : une référence dont le nom existe est passée avant tout dépôt.
 */
async function seedClients(actor: Buffer) {
  const existing = new Set(
    (await write.rows<{ name: string }>("list_client_references")).map(
      (row) => row.name
    )
  )

  let created = 0
  let skipped = 0

  for (const client of clients) {
    if (existing.has(client.name)) {
      skipped += 1
      continue
    }

    /*
      Une chaîne quand un seul fichier tient sur les deux thèmes, une paire quand la
      marque est monochrome. C'est la distinction que porte `Client.logo`, et elle se
      traduit ici en un ou deux médias.
    */
    const [clair, sombre] =
      typeof client.logo === "string"
        ? [client.logo, null]
        : [client.logo.light, client.logo.dark]

    const logoId = await seedMedia(actor, clair, client.name)
    const darkId = sombre ? await seedMedia(actor, sombre, "") : null

    const row = await write.rowStrict<{ id: Buffer }>(
      "create_client_reference",
      [client.name, logoId, actor, null]
    )

    await write.void("update_client_reference", [
      row.id,
      client.name,
      logoId,
      darkId,
      client.shape,
      client.site,
      actor,
      null,
    ])

    await write.void("publish_client_reference", [row.id, 1, actor, null])

    created += 1
    stdout.write(`  + ${client.name}\n`)
  }

  return { created, skipped }
}

/**
 * L'équipe, publiée d'emblée.
 *
 * **Elle l'est parce qu'elle l'est déjà** : les trois personnes s'affichent aujourd'hui
 * sur `/a-propos` et les deux associés sur `/contact` depuis le contenu statique. Les
 * laisser en brouillon les retirerait du site, l'amorçage faisant précisément cesser le
 * repli.
 *
 * **L'ordre du tableau est l'ordre d'affichage**, et il porte plus qu'un rang : la
 * teinte des pastilles en est déduite à la lecture. Les données statiques déclarent
 * `accent` et suivent déjà cette répartition - orange, bleu, encre - donc l'amorçage la
 * reproduit sans rien avoir à écrire.
 *
 * Idempotent par nom. Les portraits déposés une première fois ne le sont pas deux : une
 * personne dont le nom existe est passée avant tout dépôt.
 */
async function seedTeam(actor: Buffer) {
  const existing = new Set(
    (await write.rows<{ name: string }>("list_team_members")).map(
      (row) => row.name
    )
  )

  let created = 0
  let skipped = 0

  for (const person of team) {
    if (existing.has(person.name)) {
      skipped += 1
      continue
    }

    // Aucun texte alternatif : la carte rend ces images en `alt=""`, le nom de la
    // personne étant écrit juste dessous. Une alternative le répéterait à voix haute.
    const lightId = await seedMedia(actor, person.photo.white)
    const darkId = await seedMedia(actor, person.photo.orange)

    const row = await write.rowStrict<{ id: Buffer }>("create_team_member", [
      person.name,
      person.role,
      actor,
      null,
    ])

    await write.void("update_team_member", [
      row.id,
      person.name,
      person.role,
      person.initials,
      person.bio,
      // `partners` est `[...]` et `team` commence par lui : l'appartenance se lit donc
      // sur la liste des associés, jamais sur le rang.
      partners.some((one) => one.name === person.name) ? 1 : 0,
      lightId,
      darkId,
      actor,
      null,
    ])

    await write.void("set_team_skills", [
      row.id,
      JSON.stringify(person.skills.map((label) => ({ label }))),
      actor,
      null,
    ])

    await write.void("publish_team_member", [row.id, 1, actor, null])

    created += 1
    stdout.write(`  + ${person.name}\n`)
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

  stdout.write("\nExpertises\n")
  const skills = await seedExpertises(actor)
  stdout.write(
    `  ${skills.families} famille(s), ${skills.services} service(s) créé(s)`
  )
  stdout.write(
    skills.skipped ? `, ${skills.skipped} déjà présent(s).\n` : ".\n"
  )
  stdout.write("\nRéférences clientes\n")
  const refs = await seedClients(actor)
  stdout.write(`  ${refs.created} créée(s)`)
  stdout.write(refs.skipped ? `, ${refs.skipped} déjà présente(s).\n` : ".\n")

  stdout.write("\nÉquipe\n")
  const people = await seedTeam(actor)
  stdout.write(`  ${people.created} personne(s) créée(s)`)
  stdout.write(
    people.skipped ? `, ${people.skipped} déjà présente(s).\n` : ".\n"
  )

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
