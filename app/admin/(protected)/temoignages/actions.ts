"use server"

import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"

import { requireSession, type SessionUser } from "@/lib/auth/session"
import { BusinessError, write } from "@/lib/db/call"
import { parseId } from "@/lib/db/id"
import { orderSchema } from "@/lib/schemas/order"
import {
  createTestimonialSchema,
  testimonialSchema,
} from "@/lib/schemas/testimonial"

/**
 * Actions d'écriture des témoignages.
 *
 * **Chacune commence par `requireSession()`** : une action serveur est une route publique.
 *
 * Ces écritures ne touchent qu'une page, l'accueil - la section « Ils en parlent mieux
 * que nous », entre la preuve et la demande.
 */

export type ActionResult = {
  status: "ok" | "error"
  fieldErrors?: Record<string, string>
  formError?: string
}

const OK: ActionResult = { status: "ok" }

const messages: Record<string, string> = {
  QUOTE_REQUIRED: "Recopiez la citation telle que son auteur l'a validée.",
  AUTHOR_REQUIRED: "Indiquez le nom de la personne citée.",
  ROLE_REQUIRED: "Indiquez sa fonction et son employeur.",
  TESTIMONIAL_NOT_FOUND: "Ce témoignage n'existe plus.",
  TESTIMONIAL_NO_CONSENT:
    "Il manque la trace de l'accord : la date de validation par son auteur, et où l'écrit se trouve. Un verbatim attribué à une personne nommée ne se publie pas sans elle.",
  TESTIMONIAL_NO_INITIALS:
    "Il manque les initiales : la carte affiche une pastille, et vide elle se lit comme un défaut d'affichage.",
  CASE_NOT_FOUND: "Cette réalisation n'existe plus.",
  INVALID_JSON: "Les données envoyées sont illisibles.",
}

const errorFields: Record<string, string> = {
  QUOTE_REQUIRED: "quote",
  AUTHOR_REQUIRED: "authorName",
  ROLE_REQUIRED: "authorRole",
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
    console.error("Témoignages : écriture en échec.", error)
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
  updateTag("testimonials")
  revalidatePath("/admin/temoignages")
  revalidatePath("/admin")
}

export async function createTestimonial(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = createTestimonialSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    await write.rowStrict("create_testimonial", [
      parsed.data.quote,
      parsed.data.authorName,
      parsed.data.authorRole,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function updateTestimonial(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const testimonialId = parseId(id)
    if (!testimonialId) {
      return { status: "error", formError: "Témoignage inconnu." }
    }

    const parsed = testimonialSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    /*
      La date d'accord est un jour de calendrier, la colonne un horodatage. La conversion
      passe par `Date.UTC` sur les trois composantes : un `new Date("2026-08-01")` serait
      déjà interprété en UTC, mais reconstruire explicitement évite d'avoir à s'en
      souvenir - et la valeur relue est ramenée au jour local par `isoDay`.
    */
    const day = parsed.data.consentAt || ""
    let consentAt: number | null = null
    if (day) {
      const [year, month, date] = day.split("-").map(Number)
      consentAt = Math.floor(Date.UTC(year, month - 1, date) / 1000)
    }

    const rawCase = parsed.data.caseId || null
    const caseId = rawCase ? parseId(rawCase) : null
    if (rawCase && !caseId) {
      return { status: "error", formError: "Réalisation inconnue." }
    }

    await write.void("update_testimonial", [
      testimonialId,
      parsed.data.quote,
      parsed.data.authorName,
      parsed.data.authorRole,
      parsed.data.initials ?? "",
      consentAt,
      parsed.data.consentNote ?? "",
      caseId,
      actor.id,
      ip,
    ])

    invalidate()
    return OK
  })
}

export async function publishTestimonial(
  id: string,
  publish: boolean
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const testimonialId = parseId(id)
    if (!testimonialId) {
      return { status: "error", formError: "Témoignage inconnu." }
    }
    await write.void("publish_testimonial", [
      testimonialId,
      publish ? 1 : 0,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const testimonialId = parseId(id)
    if (!testimonialId) {
      return { status: "error", formError: "Témoignage inconnu." }
    }
    await write.void("delete_testimonial", [testimonialId, actor.id, ip])
    invalidate()
    return OK
  })
}

export async function reorderTestimonials(
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = orderSchema.safeParse(input)
    if (!parsed.success) {
      return { status: "error", formError: "Ordre illisible." }
    }
    await write.void("reorder_testimonials", [
      JSON.stringify(parsed.data.order),
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}
