import { clients as staticClients, type Client } from "@/lib/content/clients"
import { read } from "@/lib/db/call"
import { publicUrl } from "@/lib/s3"

/**
 * Les références clientes lues en base, **avec repli sur `lib/content/clients.ts`**.
 *
 * Même contrat que les réalisations : un déploiement ne doit pas perdre sa preuve sociale
 * parce que la base n'a pas répondu, et le repli est silencieux pour le visiteur mais
 * bruyant dans les journaux - une base injoignable est un incident.
 *
 * **Le repli est « tout ou rien ».** Dès qu'une référence est publiée en base, les
 * entrées statiques cessent de s'appliquer : sans amorçage, la première publication ferait
 * disparaître les huit logos. C'est pourquoi `pnpm db:seed` les importe, une fois.
 *
 * Fusionner base et statique a été écarté pour la même raison qu'ailleurs : il
 * deviendrait impossible de retirer une référence depuis l'administration, ce qui est
 * exactement ce qu'on doit pouvoir faire le jour où une autorisation est retirée.
 */

type PublicRow = {
  name: string
  shape: "wide" | "square"
  site: string
  logo_key: string
  logo_alt: string
  dark_key: string | null
  dark_alt: string | null
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

/** Journalise un repli. Silencieux pour le visiteur, visible en exploitation. */
function fallback(reason: string, error?: unknown) {
  console.warn(
    `Références clientes : repli sur le contenu statique (${reason}).`,
    error ?? ""
  )
}

/**
 * La forme rendue est celle de `Client`, pour que la bande ignore la provenance.
 *
 * `logo` reste une chaîne quand un seul fichier tient sur les deux thèmes, et devient une
 * paire `{ light, dark }` quand la marque est monochrome - la distinction que la bande
 * consomme déjà. Le rendu n'a donc rien à changer.
 */
function toClient(row: PublicRow): Client {
  return {
    name: row.name,
    shape: row.shape,
    site: text(row.site),
    logo: row.dark_key
      ? { light: publicUrl(row.logo_key), dark: publicUrl(row.dark_key) }
      : publicUrl(row.logo_key),
  }
}

export async function listPublicClients(): Promise<readonly Client[]> {
  try {
    const rows = await read.rows<PublicRow>("pub_list_client_references")
    if (rows.length === 0) {
      fallback("aucune référence publiée")
      return staticClients
    }
    return rows.map(toClient)
  } catch (error) {
    fallback("base injoignable", error)
    return staticClients
  }
}
