import "@/scripts/env"

import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { stdout } from "node:process"

import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3"

/**
 * Exporte le contenu réel de la base et du stockage objet, pour le rejouer ailleurs.
 *
 * **Pourquoi ce script existe, alors que `pnpm db:seed` amorce déjà une base.** Les deux
 * ne font pas la même chose, et confondre les deux donne une production incomplète :
 *
 * - `db:seed` reconstruit ce que **le dépôt** contient : les fiches de `lib/content/*.ts`,
 *   les logos et les portraits de `public/`. C'est ce qu'on veut pour initialiser une base
 *   vierge à partir du code.
 * - Ce script transporte ce que **la base** contient, c'est-à-dire aussi tout ce qui est
 *   passé par l'administration : les images de tête déposées, les textes corrigés, les
 *   témoignages. Sur cette base au moment où ces lignes sont écrites, cela fait cinq
 *   couvertures de réalisation que `db:seed` ne recréerait pas - les fichiers ne sont pas
 *   dans le dépôt, ils ont été déposés dans le navigateur.
 *
 * **Ce qui n'est pas exporté, et c'est délibéré :**
 *
 * - **Le schéma et les procédures.** Ils viennent du dépôt, par `pnpm db:migrate`. Les
 *   dumper créerait une seconde source de vérité, et un dump de routines demande
 *   `DELIMITER`, que le client ne sait pas jouer.
 * - **Les comptes et les sessions.** Un hash de développement n'a rien à faire en
 *   production, et un jeton de session encore moins. Les colonnes d'auteur sont donc
 *   remises à `NULL` à l'import - elles sont toutes nullables, vérifié. On perd la trace
 *   de qui a saisi quoi en développement, ce qui n'a aucune valeur ailleurs.
 * - **Le journal d'audit et les vues quotidiennes.** Des évènements de développement, et
 *   des compteurs de lecture qui gonfleraient les chiffres publics d'un site neuf.
 */

/** Les tables de contenu, dans l'ordre où les clés étrangères permettent de les insérer. */
const TABLES = [
  "media",
  "case_study",
  "case_meta",
  "case_chapter",
  "case_result",
  "case_lesson",
  "case_media",
  "article",
  "article_block",
  "expertise_family",
  "expertise_service",
  "expertise_deliverable",
  "expertise_tech_choice",
  "expertise_faq",
  "expertise_why_custom",
  "client_reference",
  "team_member",
  "team_member_skill",
  "testimonial",
] as const

/** Les colonnes d'auteur à effacer, table par table. */
const AUTHOR_COLUMNS: Record<string, string[]> = {
  media: ["created_by"],
  case_study: ["created_by", "updated_by"],
  article: ["created_by", "updated_by"],
  expertise_family: ["updated_by"],
  expertise_service: ["created_by", "updated_by"],
  client_reference: ["updated_by"],
  team_member: ["updated_by"],
  testimonial: ["updated_by"],
}

function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args)
    let out = ""
    let err = ""
    child.stdout.on("data", (chunk) => (out += chunk))
    child.stderr.on("data", (chunk) => (err += chunk))
    child.on("error", reject)
    child.on("close", (code) =>
      code === 0
        ? resolve(out)
        : reject(new Error(`${command} a échoué : ${err.trim()}`))
    )
  })
}

/**
 * Le dump, par `mariadb-dump` dans le conteneur.
 *
 * `--no-create-info` : les tables viennent des migrations. `--complete-insert` nomme les
 * colonnes, ce qui rend l'export tolérant à l'ajout d'une colonne ailleurs. `--replace`
 * plutôt que `INSERT` : rejouer un export deux fois doit converger, pas échouer.
 *
 * **`--hex-blob` n'est pas une option de confort, c'est la condition pour que l'export
 * soit juste.** Les identifiants sont des `BINARY(16)` : sans elle, le dump contient ces
 * octets tels quels, et un fichier qui mélange du texte et du binaire n'est plus lisible
 * comme du texte. Le défaut a été mesuré - relire un tel dump en UTF-8 remplace chaque
 * octet invalide par U+FFFD, ce qui fait **collisionner des clés primaires distinctes**,
 * et `REPLACE INTO` écrase alors les lignes les unes après les autres : neuf réalisations
 * arrivaient à deux. Rien ne le signalait, l'import se déclarait terminé.
 *
 * Avec `--hex-blob`, les colonnes binaires sortent en `0x…` : le fichier est de l'ASCII
 * pur, donc transportable, relisible et comparable d'une version à l'autre.
 */
async function dumpTables(): Promise<string> {
  const sql = await run("docker", [
    "compose",
    "exec",
    "-T",
    "mariadb",
    "sh",
    "-c",
    `exec mariadb-dump -u db_admin -p"$DB_ADMIN_PASSWORD" --no-create-info --skip-triggers --complete-insert --replace --hex-blob --single-transaction --skip-add-locks --skip-comments "$MARIADB_DATABASE" ${TABLES.join(" ")}`,
  ])

  const nettoyage = Object.entries(AUTHOR_COLUMNS)
    .map(
      ([table, columns]) =>
        `UPDATE \`${table}\` SET ${columns.map((c) => `\`${c}\` = NULL`).join(", ")};`
    )
    .join("\n")

  return [
    "-- Contenu Heliara, exporte par pnpm db:export.",
    "-- Le schema et les procedures viennent du depot : jouer pnpm db:migrate avant.",
    "SET FOREIGN_KEY_CHECKS = 0;",
    "",
    sql.trim(),
    "",
    "-- Les colonnes d'auteur sont effacees : aucun compte n'est transporte.",
    nettoyage,
    "",
    "SET FOREIGN_KEY_CHECKS = 1;",
    "",
  ].join("\n")
}

/** Tous les objets du seau, téléchargés en conservant leur clé comme chemin. */
async function dumpObjects(dossier: string) {
  const client = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ROOT_USER ?? "",
      secretAccessKey: process.env.S3_ROOT_PASSWORD ?? "",
    },
  })
  const Bucket = process.env.S3_BUCKET ?? "heliara"

  const cles: string[] = []
  let token: string | undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket, ContinuationToken: token })
    )
    for (const objet of page.Contents ?? []) {
      if (objet.Key) {
        cles.push(objet.Key)
      }
    }
    token = page.NextContinuationToken
  } while (token)

  let octets = 0
  for (const key of cles) {
    const objet = await client.send(new GetObjectCommand({ Bucket, Key: key }))
    const corps = await objet.Body?.transformToByteArray()
    if (!corps) {
      continue
    }
    const cible = join(dossier, key)
    await mkdir(join(cible, ".."), { recursive: true })
    await writeFile(cible, corps)
    octets += corps.byteLength
  }

  return { nombre: cles.length, octets, cles }
}

/**
 * Le nombre de lignes de chaque table, relevé dans la base.
 *
 * **C'est la pièce qui rend l'import vérifiable**, et elle a été ajoutée après coup : sans
 * elle, un import silencieusement incomplet se déclarait terminé. L'import compare et
 * refuse de se dire réussi si un compte diffère.
 */
async function compter(): Promise<Record<string, number>> {
  /*
    Sans accents graves autour des noms de tables : la requête traverse un `sh -c`, qui
    les prendrait pour une substitution de commande et les remplacerait par du vide. La
    requête devenait `... COUNT(*) AS n FROM  UNION ALL ...`, et le serveur refusait. Ces
    noms sont des identifiants simples, ils n'ont pas besoin d'être protégés.
  */
  const requete = TABLES.map(
    (table) => `SELECT '${table}' AS t, COUNT(*) AS n FROM ${table}`
  ).join(" UNION ALL ")

  const sortie = await run("docker", [
    "compose",
    "exec",
    "-T",
    "mariadb",
    "sh",
    "-c",
    `exec mariadb -u db_admin -p"$DB_ADMIN_PASSWORD" --batch --skip-column-names "$MARIADB_DATABASE" -e "${requete}"`,
  ])

  const comptes: Record<string, number> = {}
  for (const ligne of sortie.trim().split("\n")) {
    const [table, nombre] = ligne.split("\t")
    if (table) {
      comptes[table] = Number(nombre)
    }
  }
  return comptes
}

async function main() {
  const racine = process.argv[2] ?? "export"
  const objets = join(racine, "objets")
  await mkdir(objets, { recursive: true })

  stdout.write("\nExport du contenu de la base et du stockage.\n\n")

  const sql = await dumpTables()
  await writeFile(join(racine, "contenu.sql"), sql, "utf8")
  const comptes = await compter()
  const total = Object.values(comptes).reduce((s, n) => s + n, 0)
  stdout.write(
    `  contenu.sql        ${total} ligne(s) sur ${TABLES.length} tables\n`
  )

  const media = await dumpObjects(objets)
  stdout.write(
    `  objets/            ${media.nombre} fichier(s), ${Math.round(media.octets / 1024)} ko\n`
  )

  await writeFile(
    join(racine, "manifeste.json"),
    JSON.stringify(
      {
        // Pas de date : elle viendrait de l'horloge de la machine, et un export se
        // date par le nom de son dossier ou par le dépôt qui l'accueille.
        lignes: comptes,
        objets: media.cles,
      },
      null,
      2
    ),
    "utf8"
  )

  stdout.write(
    `\nÉcrit dans ${racine}/. Pour le rejouer : pnpm db:migrate puis pnpm db:import ${racine}\n\n`
  )
}

main().catch((error) => {
  stdout.write(
    `\n${error instanceof Error ? error.message : String(error)}\n\n`
  )
  process.exitCode = 1
})
