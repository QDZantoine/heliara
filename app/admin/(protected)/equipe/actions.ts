"use server"

import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"

import { requireSession, type SessionUser } from "@/lib/auth/session"
import { BusinessError, write } from "@/lib/db/call"
import { parseId } from "@/lib/db/id"
import { orderSchema } from "@/lib/schemas/order"
import {
  createMemberSchema,
  memberSchema,
  skillsSchema,
} from "@/lib/schemas/team"

/**
 * Actions d'écriture de l'équipe.
 *
 * **Chacune commence par `requireSession()`** : une action serveur est une route publique.
 *
 * Ces écritures touchent **deux pages** - `/a-propos` affiche tout le monde, `/contact`
 * les seuls associés - donc l'invalidation couvre les deux. Ne pas l'oublier : une
 * personne retirée de l'équipe qui resterait affichée comme interlocuteur serait pire
 * qu'un contenu périmé.
 */

export type ActionResult = {
  status: "ok" | "error"
  fieldErrors?: Record<string, string>
  formError?: string
}

const OK: ActionResult = { status: "ok" }

const messages: Record<string, string> = {
  NAME_REQUIRED: "Indiquez le nom de la personne.",
  NAME_TAKEN: "Une fiche porte déjà ce nom.",
  ROLE_REQUIRED: "Indiquez la fonction.",
  MEMBER_NOT_FOUND: "Cette fiche n'existe plus.",
  MEMBER_INCOMPLETE:
    "Il manque les initiales ou le parcours : la carte les affiche tous les deux.",
  MEMBER_NO_PORTRAIT:
    "Les deux portraits sont nécessaires. Sans celui du thème sombre, la carte montre un trou que l'on ne voit qu'en basculant le thème.",
  MEDIA_NOT_FOUND:
    "Ce portrait n'a pas fini d'être envoyé. Redéposez le fichier.",
  INVALID_JSON: "Les données envoyées sont illisibles.",
}

const errorFields: Record<string, string> = {
  NAME_REQUIRED: "name",
  NAME_TAKEN: "name",
  ROLE_REQUIRED: "role",
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
    console.error("Équipe : écriture en échec.", error)
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

function invalidate() {
  updateTag("team")
  revalidatePath("/admin/equipe")
  revalidatePath("/admin")
}

export async function createMember(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = createMemberSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    await write.rowStrict("create_team_member", [
      parsed.data.name,
      parsed.data.role,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function updateMember(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const memberId = parseId(id)
    if (!memberId) {
      return { status: "error", formError: "Fiche inconnue." }
    }

    const parsed = memberSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    /*
      Les deux portraits sont facultatifs à l'enregistrement et exigés à la publication.
      `parseId` rend `null` sur une entrée invalide comme sur une absence : les
      distinguer importe, une valeur fournie mais illisible étant une erreur à signaler.
    */
    const light = parsed.data.photoLightMediaId ?? null
    const dark = parsed.data.photoDarkMediaId ?? null
    const lightId = light ? parseId(light) : null
    const darkId = dark ? parseId(dark) : null
    if ((light && !lightId) || (dark && !darkId)) {
      return { status: "error", formError: "Portrait inconnu." }
    }

    await write.void("update_team_member", [
      memberId,
      parsed.data.name,
      parsed.data.role,
      parsed.data.initials ?? "",
      parsed.data.bio ?? "",
      parsed.data.isPartner ? 1 : 0,
      lightId,
      darkId,
      actor.id,
      ip,
    ])

    invalidate()
    return OK
  })
}

export async function setSkills(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const memberId = parseId(id)
    if (!memberId) {
      return { status: "error", formError: "Fiche inconnue." }
    }
    const parsed = skillsSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    await write.void("set_team_skills", [
      memberId,
      JSON.stringify(parsed.data.items),
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function publishMember(
  id: string,
  publish: boolean
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const memberId = parseId(id)
    if (!memberId) {
      return { status: "error", formError: "Fiche inconnue." }
    }
    await write.void("publish_team_member", [
      memberId,
      publish ? 1 : 0,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function deleteMember(id: string): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const memberId = parseId(id)
    if (!memberId) {
      return { status: "error", formError: "Fiche inconnue." }
    }
    await write.void("delete_team_member", [memberId, actor.id, ip])
    invalidate()
    return OK
  })
}

export async function reorderMembers(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = orderSchema.safeParse(input)
    if (!parsed.success) {
      return { status: "error", formError: "Ordre illisible." }
    }
    await write.void("reorder_team_members", [
      JSON.stringify(parsed.data.order),
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}
