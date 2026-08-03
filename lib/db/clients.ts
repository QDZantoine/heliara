import { write } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"
import type { MediaRef } from "@/lib/media"
import { publicUrl } from "@/lib/s3"

/**
 * Lecture des références clientes côté administration : brouillons compris.
 *
 * Un seul appel rend tout : la table est plate, et ses deux logos sont joints par la
 * procédure. Pas de second aller-retour pour les médias, contrairement aux
 * réalisations dont la galerie vit dans une table de liaison.
 */

type ClientRow = {
  id: Buffer
  name: string
  shape: "wide" | "square"
  site: string
  position: number
  status: "draft" | "published"
  published_at: number | null
  updated_at: number
  logo_media_id: Buffer
  logo_dark_media_id: Buffer | null
  logo_key: string
  logo_alt: string
  logo_mime: string
  logo_name: string
  dark_key: string | null
  dark_alt: string | null
  dark_mime: string | null
  dark_name: string | null
}

/** Un logo, tel que l'écran de dépôt le consomme. */
export type ClientLogo = MediaRef & {
  id: string
  mimeType: string
  originalName: string
}

export type ClientDetail = {
  id: string
  name: string
  shape: "wide" | "square"
  site: string
  position: number
  status: "draft" | "published"
  publishedAt: number | null
  updatedAt: number
  logo: ClientLogo
  /** La variante sombre, absente dans le cas courant. */
  logoDark: ClientLogo | null
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

/**
 * Les dimensions ne sont pas jointes par la procédure et restent donc nulles.
 *
 * C'est volontaire : la bande borne la **hauteur** de chaque logo et laisse la largeur
 * suivre, `shape` décidant de cette hauteur. Les dimensions du fichier n'entrent dans
 * aucun calcul, à la différence d'une couverture de réalisation dont la boîte prend le
 * rapport du fichier. Les demander aurait allongé la requête pour rien.
 */
function toLogo(
  id: Buffer,
  key: string,
  alt: string,
  mime: string,
  name: string
): ClientLogo {
  return {
    id: toHex(id),
    url: publicUrl(key),
    alt: text(alt),
    width: null,
    height: null,
    mimeType: text(mime),
    originalName: text(name),
  }
}

export async function listClients(): Promise<ClientDetail[]> {
  const rows = await write.rows<ClientRow>("list_client_references")

  return rows.map((row) => ({
    id: toHex(row.id),
    name: row.name,
    shape: row.shape,
    site: text(row.site),
    position: Number(row.position),
    status: row.status,
    publishedAt: row.published_at === null ? null : Number(row.published_at),
    updatedAt: Number(row.updated_at),
    logo: toLogo(
      row.logo_media_id,
      row.logo_key,
      row.logo_alt,
      row.logo_mime,
      row.logo_name
    ),
    logoDark:
      row.logo_dark_media_id && row.dark_key
        ? toLogo(
            row.logo_dark_media_id,
            row.dark_key,
            text(row.dark_alt),
            text(row.dark_mime),
            text(row.dark_name)
          )
        : null,
  }))
}
