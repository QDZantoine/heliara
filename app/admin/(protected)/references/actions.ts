"use server"

import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"

import { requireSession, type SessionUser } from "@/lib/auth/session"
import { BusinessError, write } from "@/lib/db/call"
import { parseId } from "@/lib/db/id"
import { clientSchema, createClientSchema } from "@/lib/schemas/client"
import { orderSchema } from "@/lib/schemas/order"

/**
 * Actions d'écriture des références clientes.
 *
 * **Chacune commence par `requireSession()`**, comme partout : une action serveur est une
 * route publique, atteignable sans passer par la moindre page.
 *
 * Le dépôt de fichiers n'a pas d'action ici : `MediaDropzone` appelle `requestUpload` et
 * `confirmUpload` des réalisations, qui ne sont spécifiques à aucune collection. Les
 * dupliquer aurait donné deux chemins de téléversement à tenir d'accord.
 */

export type ActionResult = {
  status: "ok" | "error"
  fieldErrors?: Record<string, string>
  formError?: string
}

const OK: ActionResult = { status: "ok" }

const messages: Record<string, string> = {
  NAME_REQUIRED: "Indiquez le nom du client.",
  NAME_TAKEN: "Une référence porte déjà ce nom.",
  CLIENT_NOT_FOUND: "Cette référence n'existe plus.",
  MEDIA_NOT_FOUND: "Ce logo n'a pas fini d'être envoyé. Redéposez le fichier.",
  CLIENT_INCOMPLETE: "Il manque le logo : c'est tout ce que la bande affiche.",
  INVALID_JSON: "Les données envoyées sont illisibles.",
}

const errorFields: Record<string, string> = {
  NAME_REQUIRED: "name",
  NAME_TAKEN: "name",
  MEDIA_NOT_FOUND: "logoMediaId",
}

async function context(): Promise<{ actor: SessionUser; ip: string | null }> {
  const [actor, list] = await Promise.all([requireSession(), headers()])
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim()
  return { actor, ip: forwarded || list.get("x-real-ip") || null }
}

async function run(work: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof BusinessError) {
      const message = messages[error.code] ?? "L'enregistrement a échoué."
      const field = errorFields[error.code]
      return field
        ? { status: "error", fieldErrors: { [field]: message } }
        : { status: "error", formError: message }
    }
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_")
    ) {
      throw error
    }
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return { status: "error", formError: "Votre session a expiré." }
    }
    console.error("Références : écriture en échec.", error)
    return {
      status: "error",
      formError: "L'enregistrement a échoué. Réessayez.",
    }
  }
}

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "_"
    fieldErrors[key] ??= issue.message
  }
  return fieldErrors
}

/**
 * Invalide ce que l'écriture rend périmé.
 *
 * La bande vit sur **l'accueil seulement**, ce qui rend l'invalidation courte. Le tag est
 * quand même posé : il est ce que le déploiement public écoute, et son absence laisserait
 * la bande périmée jusqu'au prochain `revalidate`.
 */
function invalidate() {
  updateTag("clients")
  revalidatePath("/admin/references")
  revalidatePath("/admin")
}

export async function createClient(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = createClientSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    const logoId = parseId(parsed.data.logoMediaId)
    if (!logoId) {
      return { status: "error", fieldErrors: { logoMediaId: "Média inconnu." } }
    }

    await write.rowStrict("create_client_reference", [
      parsed.data.name,
      logoId,
      actor.id,
      ip,
    ])

    invalidate()
    return OK
  })
}

export async function updateClient(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const clientId = parseId(id)
    if (!clientId) {
      return { status: "error", formError: "Référence inconnue." }
    }

    const parsed = clientSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    const logoId = parseId(parsed.data.logoMediaId)
    if (!logoId) {
      return { status: "error", fieldErrors: { logoMediaId: "Média inconnu." } }
    }

    /*
      La variante sombre est facultative, et `parseId` rend `null` sur une entrée
      invalide comme sur une entrée absente. Les distinguer importe : une valeur fournie
      mais illisible est une erreur à signaler, une absence est le cas courant.
    */
    const darkRaw = parsed.data.logoDarkMediaId ?? null
    const darkId = darkRaw ? parseId(darkRaw) : null
    if (darkRaw && !darkId) {
      return {
        status: "error",
        fieldErrors: { logoDarkMediaId: "Média inconnu." },
      }
    }

    await write.void("update_client_reference", [
      clientId,
      parsed.data.name,
      logoId,
      darkId,
      parsed.data.shape,
      parsed.data.site ?? "",
      actor.id,
      ip,
    ])

    invalidate()
    return OK
  })
}

/**
 * Publie ou retire une référence.
 *
 * **Publier, ici, veut dire « l'autorisation est obtenue ».** Aucune base ne peut le
 * vérifier : un logo est une marque, et l'afficher sous « ils nous font confiance » est une
 * affirmation commerciale qui se couvre par un accord écrit. L'écran le rappelle avant le
 * clic ; la procédure ne vérifie que la présence du logo.
 */
export async function publishClient(
  id: string,
  publish: boolean
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const clientId = parseId(id)
    if (!clientId) {
      return { status: "error", formError: "Référence inconnue." }
    }
    await write.void("publish_client_reference", [
      clientId,
      publish ? 1 : 0,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function deleteClient(id: string): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const clientId = parseId(id)
    if (!clientId) {
      return { status: "error", formError: "Référence inconnue." }
    }
    await write.void("delete_client_reference", [clientId, actor.id, ip])
    invalidate()
    return OK
  })
}

export async function reorderClients(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = orderSchema.safeParse(input)
    if (!parsed.success) {
      return { status: "error", formError: "Ordre illisible." }
    }
    await write.void("reorder_client_references", [
      JSON.stringify(parsed.data.order),
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}
