"use server"

import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { requireSession, type SessionUser } from "@/lib/auth/session"
import { BusinessError, write } from "@/lib/db/call"
import { parseId } from "@/lib/db/id"
import {
  createFamilySchema,
  createServiceSchema,
  familySchema,
  faqListSchema,
  orderSchema,
  pairsSchema,
  serviceSchema,
} from "@/lib/schemas/expertise"

/**
 * Actions d'écriture des expertises.
 *
 * **Chacune commence par `requireSession()`**, comme partout : une action serveur est
 * une route publique.
 *
 * Ces écritures ont une portée que les autres n'ont pas : les familles alimentent la
 * **navigation du site**, présente sur chaque page. C'est pourquoi les invalidations
 * couvrent la mise en page publique et pas seulement les pages d'expertise.
 */

export type ActionResult = {
  status: "ok" | "error"
  fieldErrors?: Record<string, string>
  formError?: string
}

const OK: ActionResult = { status: "ok" }

const messages: Record<string, string> = {
  SLUG_TAKEN: "Cet identifiant d'URL est déjà pris.",
  SLUG_REQUIRED: "Indiquez un identifiant d'URL.",
  FAMILY_NOT_FOUND: "Cette famille n'existe plus.",
  FAMILY_NOT_EMPTY:
    "Cette famille porte encore des services : déplacez-les ou supprimez-les d'abord.",
  SERVICE_NOT_FOUND: "Ce service n'existe plus.",
  SERVICE_INCOMPLETE:
    "Il manque des champs obligatoires : titre, accroche et problème.",
  SERVICE_NO_DELIVERABLE:
    "Ajoutez au moins un livrable : la page promet de dire ce qu'on obtient.",
  SERVICE_IS_NAV_TARGET:
    "Ce service porte l'entrée de nav de sa famille : désignez-en un autre avant de le supprimer.",
  NAV_SERVICE_UNKNOWN: "Aucun service ne porte ce slug.",
  INVALID_JSON: "Les données envoyées sont illisibles.",
}

const errorFields: Record<string, string> = {
  SLUG_TAKEN: "slug",
  SLUG_REQUIRED: "slug",
  NAV_SERVICE_UNKNOWN: "navServiceSlug",
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
    console.error("Expertises : écriture en échec.", error)
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
 * `nav` est un tag à part : les familles alimentent l'en-tête et le pied de page de
 * **toutes** les pages du site. Une écriture de famille périme donc bien plus que la
 * page qu'on éditait, et l'oublier laisserait un menu périmé partout.
 */
function invalidate(slug?: string) {
  updateTag("expertises")
  updateTag("nav")
  if (slug) {
    updateTag(`expertise:${slug}`)
  }
  revalidatePath("/admin/expertises")
  revalidatePath("/admin")
}

// ------------------------------------------------------------
// Familles
// ------------------------------------------------------------

export async function createFamily(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = createFamilySchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    await write.rowStrict("create_expertise_family", [
      parsed.data.slug || null,
      parsed.data.label,
      actor.id,
      ip,
    ])

    invalidate()
    return OK
  })
}

export async function updateFamily(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const familyId = parseId(id)
    if (!familyId) {
      return { status: "error", formError: "Famille inconnue." }
    }

    const parsed = familySchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    const v = parsed.data

    await write.void("update_expertise_family", [
      familyId,
      v.slug,
      v.label,
      v.title ?? "",
      v.summary ?? "",
      v.tag ?? "",
      v.halo,
      v.sketch1,
      v.sketch2,
      v.sketch3,
      v.navServiceSlug ?? "",
      actor.id,
      ip,
    ])

    invalidate()
    return OK
  })
}

export async function deleteFamily(id: string): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const familyId = parseId(id)
    if (!familyId) {
      return { status: "error", formError: "Famille inconnue." }
    }
    await write.void("delete_expertise_family", [familyId, actor.id, ip])
    invalidate()
    return OK
  })
}

export async function reorderFamilies(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = orderSchema.safeParse(input)
    if (!parsed.success) {
      return { status: "error", formError: "Ordre illisible." }
    }
    await write.void("reorder_expertise_families", [
      JSON.stringify(parsed.data.order),
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

// ------------------------------------------------------------
// Services
// ------------------------------------------------------------

export async function createService(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = createServiceSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    const row = await write.rowStrict<{ slug: string }>(
      "create_expertise_service",
      [
        parsed.data.slug || null,
        parsed.data.title,
        parseId(parsed.data.familyId),
        actor.id,
        ip,
      ]
    )

    invalidate(row.slug)
    redirect(`/admin/expertises/${row.slug}`)
  })
}

export async function updateService(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const serviceId = parseId(id)
    if (!serviceId) {
      return { status: "error", formError: "Service inconnu." }
    }

    const parsed = serviceSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    const v = parsed.data

    await write.void("update_expertise_service", [
      serviceId,
      v.slug,
      parseId(v.familyId),
      v.title,
      v.tagline ?? "",
      v.problem ?? "",
      v.relatedCase ?? "",
      v.ctaTitle ?? "",
      actor.id,
      ip,
    ])

    invalidate(v.slug)
    revalidatePath(`/admin/expertises/${v.slug}`)
    return OK
  })
}

export async function publishService(
  id: string,
  publish: boolean
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const serviceId = parseId(id)
    if (!serviceId) {
      return { status: "error", formError: "Service inconnu." }
    }
    await write.void("publish_expertise_service", [
      serviceId,
      publish ? 1 : 0,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function deleteService(id: string): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const serviceId = parseId(id)
    if (!serviceId) {
      return { status: "error", formError: "Service inconnu." }
    }
    await write.void("delete_expertise_service", [serviceId, actor.id, ip])
    invalidate()
    redirect("/admin/expertises")
  })
}

export async function reorderServices(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = orderSchema.safeParse(input)
    if (!parsed.success) {
      return { status: "error", formError: "Ordre illisible." }
    }
    await write.void("reorder_expertise_services", [
      JSON.stringify(parsed.data.order),
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

// ------------------------------------------------------------
// Collections d'un service
// ------------------------------------------------------------

async function setCollection(
  procedure: string,
  id: string,
  slug: string,
  items: unknown
): Promise<ActionResult> {
  const { actor, ip } = await context()
  const serviceId = parseId(id)
  if (!serviceId) {
    return { status: "error", formError: "Service inconnu." }
  }
  await write.void(procedure, [serviceId, JSON.stringify(items), actor.id, ip])
  invalidate(slug)
  revalidatePath(`/admin/expertises/${slug}`)
  return OK
}

export async function setDeliverables(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = pairsSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    return setCollection(
      "set_expertise_deliverables",
      id,
      slug,
      parsed.data.items
    )
  })
}

export async function setTechChoices(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = pairsSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    return setCollection(
      "set_expertise_tech_choices",
      id,
      slug,
      parsed.data.items
    )
  })
}

export async function setFaq(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = faqListSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    return setCollection("set_expertise_faq", id, slug, parsed.data.items)
  })
}
