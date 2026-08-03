import "@/scripts/env"

import { createHash } from "node:crypto"
import { readFile, readdir, stat } from "node:fs/promises"
import { join, relative } from "node:path"
import { stdout } from "node:process"

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import mysql from "mysql2/promise"

/**
 * Rejoue un export de `pnpm db:export` : les objets d'abord, le contenu ensuite.
 *
 * **Les objets d'abord, et l'ordre n'est pas indifférent.** Les lignes `media` de la base
 * pointent vers des clés du stockage : les insérer avant que les fichiers soient là donne
 * un site dont les images répondent 404 pendant tout le temps du transfert. Dans l'autre
 * sens, des objets sans ligne ne sont référencés par rien - invisibles, donc inoffensifs.
 *
 * **Le schéma doit exister.** Ce script n'insère que des données : jouer `pnpm db:migrate`
 * avant, sur une base vierge comme sur une base à resynchroniser.
 *
 * **Aucun compte n'est transporté** : l'export a effacé les colonnes d'auteur, et le
 * premier compte de la production se crée avec `pnpm admin:create`.
 *
 * Il se connecte en `db_migrate` et non en `app_write` : ce sont des `REPLACE INTO` sur
 * les tables, ce que le compte applicatif ne sait pas faire - et ne doit pas savoir faire.
 */

const mime = (nom: string) => {
  const ext = nom.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "svg") return "image/svg+xml"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  if (ext === "avif") return "image/avif"
  return "image/jpeg"
}

async function fichiers(racine: string): Promise<string[]> {
  const trouves: string[] = []
  async function descendre(dossier: string) {
    for (const entree of await readdir(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, entree.name)
      if (entree.isDirectory()) {
        await descendre(chemin)
      } else {
        trouves.push(chemin)
      }
    }
  }
  await descendre(racine)
  return trouves
}

async function pousserObjets(dossier: string) {
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

  const liste = await fichiers(dossier)
  let octets = 0
  for (const chemin of liste) {
    const corps = await readFile(chemin)
    // La clé est le chemin relatif : c'est exactement ce que l'export a écrit, donc
    // ce que les lignes `media` référencent.
    const Key = relative(dossier, chemin).split("\\").join("/")
    await client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: corps,
        ContentType: mime(Key),
        // L'empreinte accompagne l'objet comme à l'envoi par le navigateur.
        ChecksumSHA256: createHash("sha256").update(corps).digest("base64"),
      })
    )
    octets += corps.byteLength
  }
  return { nombre: liste.length, octets }
}

function connexion() {
  return mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3307),
    user: "db_migrate",
    password: process.env.DB_MIGRATE_PASSWORD,
    database: process.env.DB_NAME ?? "heliara",
    // Le fichier est une suite d'instructions : sans cela, seule la première passe.
    multipleStatements: true,
  })
}

async function jouerSql(chemin: string) {
  /*
    Lu en UTF-8, ce qui n'est sûr que parce que l'export passe par `--hex-blob` : un dump
    qui porterait ses identifiants en octets bruts verrait chaque octet invalide remplacé
    par U+FFFD, donc des clés primaires distinctes devenues identiques, que `REPLACE INTO`
    écraserait l'une après l'autre. Mesuré avant correction : neuf réalisations arrivaient
    à deux, et l'import se déclarait terminé. La vérification des comptes ci-dessous est
    ce qui rend ce mode de panne impossible à ignorer.
  */
  const sql = await readFile(chemin, "utf8")
  const lien = await connexion()
  try {
    await lien.query(sql)
  } finally {
    await lien.end()
  }
}

/**
 * Compare les lignes en base aux comptes du manifeste.
 *
 * Un import partiel ne lève aucune erreur : les contraintes sont satisfaites, les
 * instructions passent, et il manque simplement des lignes. Seul un comptage le voit.
 */
async function verifier(manifeste: Record<string, number>) {
  const tables = Object.keys(manifeste)
  const lien = await connexion()
  const ecarts: string[] = []
  try {
    for (const table of tables) {
      const [rows] = await lien.query<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM \`${table}\``
      )
      const obtenu = Number(rows[0]?.n ?? 0)
      if (obtenu !== manifeste[table]) {
        ecarts.push(`${table} : ${obtenu} au lieu de ${manifeste[table]}`)
      }
    }
  } finally {
    await lien.end()
  }
  return ecarts
}

async function main() {
  const racine = process.argv[2]
  if (!racine) {
    stdout.write("\nUsage : pnpm db:import <dossier d'export>\n\n")
    process.exitCode = 1
    return
  }

  const sqlPath = join(racine, "contenu.sql")
  const objetsPath = join(racine, "objets")
  await stat(sqlPath)
  const manifeste = JSON.parse(
    await readFile(join(racine, "manifeste.json"), "utf8")
  ) as { lignes: Record<string, number> }

  stdout.write(`\nImport de ${racine}.\n\n`)

  const objets = await pousserObjets(objetsPath)
  stdout.write(
    `  objets             ${objets.nombre} fichier(s), ${Math.round(objets.octets / 1024)} ko\n`
  )

  await jouerSql(sqlPath)
  const attendu = Object.values(manifeste.lignes).reduce((s, n) => s + n, 0)
  stdout.write(`  contenu            ${attendu} ligne(s) attendue(s)\n`)

  const ecarts = await verifier(manifeste.lignes)
  if (ecarts.length > 0) {
    stdout.write(`\nImport incomplet :\n  ${ecarts.join("\n  ")}\n\n`)
    process.exitCode = 1
    return
  }

  stdout.write(
    "\nToutes les tables comptent le nombre de lignes attendu. Vérifier à l'écran qu'une fiche avec image de tête montre sa couverture.\n\n"
  )
}

main().catch((error) => {
  stdout.write(
    `\n${error instanceof Error ? error.message : String(error)}\n\n`
  )
  process.exitCode = 1
})
