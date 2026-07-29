import "server-only"

import { randomUUID } from "node:crypto"
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * Stockage objet : MinIO en développement, n'importe quel S3 ailleurs.
 *
 * **Le fichier ne traverse jamais l'application.** L'action serveur signe une URL
 * de dépôt, le navigateur envoie l'octet directement à MinIO. Trois bénéfices :
 * aucune limite de taille de corps de requête à contourner, aucune mémoire
 * mobilisée côté serveur, et une barre de progression réelle plutôt qu'estimée.
 *
 * Seul le préfixe `public/` du seau est ouvert en lecture anonyme. Conséquence
 * assumée et documentée : l'image d'un brouillon est atteignable par qui connaît
 * son URL, laquelle n'est ni listée ni devinable - la clé porte un UUID.
 */

/** Formats acceptés. Volontairement court : ce sont ceux que le site sait servir. */
export const ALLOWED_TYPES = [
  "image/webp",
  "image/avif",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
] as const

/**
 * 8 Mio. Au-delà, ce n'est plus une image de site mais un fichier source, qui n'a
 * rien à faire ici. La limite est vérifiée à la signature **et** à la confirmation :
 * le navigateur n'est pas une autorité.
 */
export const MAX_BYTES = 8 * 1024 * 1024

/** Validité de l'URL de dépôt. Assez pour un envoi, trop peu pour être partagée. */
const UPLOAD_TTL_SECONDS = 300

const extensions: Record<string, string> = {
  "image/webp": "webp",
  "image/avif": "avif",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
}

export function bucket() {
  return process.env.S3_BUCKET ?? "heliara"
}

const store = globalThis as typeof globalThis & { __heliaraS3?: S3Client }

function client() {
  store.__heliaraS3 ??= new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
    // Indispensable avec MinIO : il n'y a pas de DNS par seau, la clé se met dans
    // le chemin et non dans le sous-domaine.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ROOT_USER ?? "",
      secretAccessKey: process.env.S3_ROOT_PASSWORD ?? "",
    },
  })
  return store.__heliaraS3
}

/**
 * Fabrique la clé d'objet.
 *
 * Un UUID, jamais le nom d'origine : celui-ci peut contenir des accents, des
 * espaces, un chemin, ou révéler quelque chose du poste de la personne qui
 * téléverse. Il reste stocké en base pour l'affichage, mais ne détermine rien.
 */
export function objectKey(mimeType: string, year = new Date().getFullYear()) {
  const extension = extensions[mimeType] ?? "bin"
  return `public/${year}/${randomUUID()}.${extension}`
}

export function publicUrl(key: string) {
  const base = process.env.S3_PUBLIC_URL
  if (base) {
    return `${base.replace(/\/$/, "")}/${key}`
  }
  const endpoint = (process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000").replace(
    /\/$/,
    ""
  )
  return `${endpoint}/${bucket()}/${key}`
}

/**
 * URL de dépôt à durée limitée.
 *
 * Le type et la taille sont **inscrits dans la signature** : un client qui
 * enverrait autre chose que ce qui a été annoncé verrait son dépôt refusé par
 * MinIO, sans que l'application ait à le vérifier après coup.
 */
export async function signedUpload(
  key: string,
  mimeType: string,
  byteSize: number
) {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: mimeType,
    ContentLength: byteSize,
  })

  return getSignedUrl(client(), command, { expiresIn: UPLOAD_TTL_SECONDS })
}

export async function deleteObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

/** Le type et la taille annoncés sont-ils acceptables ? */
export function checkUpload(mimeType: string, byteSize: number) {
  if (!ALLOWED_TYPES.includes(mimeType as (typeof ALLOWED_TYPES)[number])) {
    return "Ce format n'est pas accepté. Utilisez WebP, AVIF, PNG, JPEG ou SVG."
  }
  if (!Number.isInteger(byteSize) || byteSize <= 0) {
    return "La taille du fichier est illisible."
  }
  if (byteSize > MAX_BYTES) {
    return `Ce fichier dépasse ${Math.round(MAX_BYTES / 1024 / 1024)} Mo.`
  }
  return null
}
