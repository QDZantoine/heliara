"use server"

import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { requireSession, type SessionUser } from "@/lib/auth/session"
import { BusinessError, write } from "@/lib/db/call"
import { parseId, toHex } from "@/lib/db/id"
import {
  caseSchema,
  chaptersSchema,
  createCaseSchema,
  galleryListSchema,
  lessonsSchema,
  metaListSchema,
  reorderSchema,
  resultsSchema,
  uploadSchema,
} from "@/lib/schemas/case"
import { checkUpload, objectKey, publicUrl, signedUpload } from "@/lib/s3"

/**
 * Actions d'écriture des réalisations.
 *
 * **Chacune commence par `requireSession()`.** Une action serveur est une route
 * publique : le layout d'administration a beau vérifier la session, il ne protège
 * que le rendu des pages. Rien n'empêche d'appeler une action directement, et c'est
 * pour cela que l'autorisation est refaite à chaque fois, sans exception.
 *
 * Chacune rejoue aussi son schéma zod, pour la même raison : la validation du
 * navigateur est un confort, celle du serveur est la seule autorité.
 *
 * Les codes d'erreur métier des procédures sont traduits en français ici, au plus
 * près de l'écran qui les affichera.
 */

export type ActionResult = {
  status: "ok" | "error"
  /** Erreurs par champ, réinjectées sous le champ concerné côté client. */
  fieldErrors?: Record<string, string>
  /** Message global, quand ce n'est pas un champ qui est en cause. */
  formError?: string
}

const OK: ActionResult = { status: "ok" }

/** Traductions des codes métier, affichables telles quelles. */
const messages: Record<string, string> = {
  SLUG_TAKEN: "Cet identifiant d'URL est déjà pris par une autre réalisation.",
  SLUG_REQUIRED: "Indiquez un identifiant d'URL.",
  CASE_NOT_FOUND: "Cette réalisation n'existe plus.",
  CASE_INCOMPLETE:
    "Il manque des champs obligatoires : titre, secteur et les deux résumés.",
  CASE_NO_CHAPTER: "Ajoutez au moins un chapitre avant de publier.",
  MEDIA_NOT_FOUND: "Cette image n'existe plus.",
  MEDIA_IN_USE:
    "Cette image est encore utilisée : retirez-la d'abord des fiches concernées.",
  INVALID_JSON: "Les données envoyées sont illisibles.",
}

/** Le champ sur lequel afficher un code d'erreur donné, quand il y en a un. */
const errorFields: Record<string, string> = {
  SLUG_TAKEN: "slug",
  SLUG_REQUIRED: "slug",
}

/**
 * Contexte de la requête pour le journal d'audit : qui, et depuis où.
 * Jamais bloquant - une écriture ne doit pas échouer faute d'adresse connue.
 */
async function context(): Promise<{ actor: SessionUser; ip: string | null }> {
  const [actor, list] = await Promise.all([requireSession(), headers()])
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim()
  return { actor, ip: forwarded || list.get("x-real-ip") || null }
}

/** Enveloppe commune : traduit les erreurs métier, laisse passer les redirections. */
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
    // `redirect()` et `notFound()` lèvent : il ne faut surtout pas les intercepter.
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
    console.error("Réalisations : écriture en échec.", error)
    return {
      status: "error",
      formError: "L'enregistrement a échoué. Réessayez.",
    }
  }
}

/** Les erreurs de schéma, au format attendu par `react-hook-form`. */
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
 * `updateTag` et non `revalidateTag` : le premier expire immédiatement, le second
 * sert le contenu périmé pendant qu'il se rafraîchit. Dans une administration, on
 * veut voir ce qu'on vient d'écrire, pas l'état d'avant - c'est le cas d'usage que
 * la documentation de Next appelle « read-your-own-writes », et `updateTag` n'est
 * utilisable que depuis une action serveur, ce qui est exactement notre cas.
 *
 * **Conséquence de la séparation en deux processus, à ne pas perdre de vue :** ce
 * cache est celui du processus d'administration. Le déploiement public a le sien,
 * qu'aucun appel d'ici ne peut atteindre. Quand le site public passera en lecture
 * base (étape 6), sa fraîcheur devra venir d'un `cacheLife` plutôt que d'une
 * invalidation par tag - ou d'un signal explicite entre les deux processus. Les
 * tags posés ici restent utiles et corrects, mais ils ne franchissent pas la
 * frontière.
 */
function invalidate(slug?: string) {
  updateTag("cases")
  if (slug) {
    updateTag(`case:${slug}`)
  }
  revalidatePath("/admin/realisations")
  revalidatePath("/admin")
}

// ------------------------------------------------------------
// Fiche
// ------------------------------------------------------------

export async function createCase(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = createCaseSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    const row = await write.rowStrict<{ slug: string }>("create_case_study", [
      parsed.data.slug || null,
      parsed.data.title,
      parsed.data.sector,
      parsed.data.year,
      actor.id,
      ip,
    ])

    invalidate(row.slug)
    // On enchaîne sur l'édition : créer une fiche sans la remplir n'a pas de sens.
    redirect(`/admin/realisations/${row.slug}`)
  })
}

export async function updateCase(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const caseId = parseId(id)
    if (!caseId) {
      return { status: "error", formError: "Réalisation inconnue." }
    }

    const parsed = caseSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    const v = parsed.data

    await write.void("update_case_study", [
      caseId,
      v.slug,
      v.sector,
      v.year,
      v.badge ?? "",
      v.title,
      v.heroTitle || v.title,
      v.teaser ?? "",
      v.summary ?? "",
      v.figure ?? "",
      v.measure ?? "",
      v.halo,
      v.accent,
      v.featured ? 1 : 0,
      v.wide ? 1 : 0,
      v.resultsLabel ?? "",
      v.testimonialQuote ?? "",
      v.testimonialName ?? "",
      v.testimonialRole ?? "",
      v.testimonialInitials ?? "",
      v.heroMediaId ? parseId(v.heroMediaId) : null,
      actor.id,
      ip,
    ])

    invalidate(v.slug)
    revalidatePath(`/admin/realisations/${v.slug}`)
    return OK
  })
}

export async function publishCase(
  id: string,
  publish: boolean
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const caseId = parseId(id)
    if (!caseId) {
      return { status: "error", formError: "Réalisation inconnue." }
    }

    await write.void("publish_case_study", [
      caseId,
      publish ? 1 : 0,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function deleteCase(id: string): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const caseId = parseId(id)
    if (!caseId) {
      return { status: "error", formError: "Réalisation inconnue." }
    }

    await write.void("delete_case_study", [caseId, actor.id, ip])
    invalidate()
    redirect("/admin/realisations")
  })
}

export async function reorderCases(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = reorderSchema.safeParse(input)
    if (!parsed.success) {
      return { status: "error", formError: "Ordre illisible." }
    }

    await write.void("reorder_case_studies", [
      JSON.stringify(parsed.data.order),
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

// ------------------------------------------------------------
// Collections enfants
// ------------------------------------------------------------
// Chacune s'enregistre seule, ce qui permet de valider un onglet du formulaire
// sans réécrire les autres - et de ne pas perdre son travail si un autre onglet
// contient une saisie invalide.

async function setCollection(
  procedure: string,
  id: string,
  slug: string,
  items: unknown
): Promise<ActionResult> {
  const { actor, ip } = await context()
  const caseId = parseId(id)
  if (!caseId) {
    return { status: "error", formError: "Réalisation inconnue." }
  }

  await write.void(procedure, [caseId, JSON.stringify(items), actor.id, ip])
  invalidate(slug)
  revalidatePath(`/admin/realisations/${slug}`)
  return OK
}

export async function setChapters(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = chaptersSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    return setCollection("set_case_chapters", id, slug, parsed.data.items)
  })
}

export async function setResults(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = resultsSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    return setCollection("set_case_results", id, slug, parsed.data.items)
  })
}

export async function setMeta(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = metaListSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    return setCollection("set_case_meta", id, slug, parsed.data.items)
  })
}

export async function setLessons(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = lessonsSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    return setCollection("set_case_lessons", id, slug, parsed.data.items)
  })
}

export async function setGallery(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const parsed = galleryListSchema.safeParse(input)
    if (!parsed.success) {
      return { status: "error", formError: "Galerie illisible." }
    }
    return setCollection("set_case_gallery", id, slug, parsed.data.items)
  })
}

// ------------------------------------------------------------
// Téléversement
// ------------------------------------------------------------

export type UploadTicket =
  | {
      status: "upload"
      /** Le média à confirmer une fois l'octet déposé. */
      mediaId: string
      /** URL de dépôt, valable cinq minutes. */
      url: string
      objectUrl: string
    }
  | {
      status: "exists"
      /** Le fichier était déjà là : rien à envoyer. */
      mediaId: string
      objectUrl: string
    }
  | { status: "error"; formError: string }

/**
 * Signe un dépôt.
 *
 * Le type et la taille sont vérifiés ici **et** inscrits dans la signature : un
 * client qui enverrait autre chose que ce qu'il a annoncé verrait son dépôt refusé
 * par MinIO. La double vérification n'est pas une redondance inutile - la première
 * donne un message lisible, la seconde est celle qui contraint réellement.
 */
export async function requestUpload(input: unknown): Promise<UploadTicket> {
  try {
    const { actor, ip } = await context()
    const parsed = uploadSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        formError: parsed.error.issues[0]?.message ?? "Fichier refusé.",
      }
    }

    const { mimeType, byteSize, originalName, checksum, alt } = parsed.data
    const refusal = checkUpload(mimeType, byteSize)
    if (refusal) {
      return { status: "error", formError: refusal }
    }

    const key = objectKey(mimeType)
    const row = await write.rowStrict<{
      id: Buffer
      object_key: string
      status: "pending" | "ready"
    }>("create_media", [
      key,
      process.env.S3_BUCKET ?? "heliara",
      mimeType,
      byteSize,
      null,
      null,
      alt ?? "",
      originalName,
      checksum ?? null,
      actor.id,
      ip,
    ])

    const mediaId = toHex(row.id)
    const objectUrl = publicUrl(row.object_key)

    // La procédure a reconnu une empreinte déjà stockée : il n'y a rien à envoyer.
    if (row.status === "ready") {
      return { status: "exists", mediaId, objectUrl }
    }

    return {
      status: "upload",
      mediaId,
      url: await signedUpload(row.object_key, mimeType, byteSize),
      objectUrl,
    }
  } catch (error) {
    console.error("Téléversement : signature en échec.", error)
    return {
      status: "error",
      formError: "Le téléversement n'a pas pu démarrer.",
    }
  }
}

/**
 * Confirme un dépôt abouti et rend le média utilisable.
 * C'est le seul chemin vers `ready` : rien ne s'affiche avant.
 */
export async function confirmUpload(
  mediaId: string,
  dimensions: { width?: number; height?: number; byteSize?: number } = {}
): Promise<ActionResult & { url?: string; id?: string }> {
  return run(async () => {
    const { actor, ip } = await context()
    const id = parseId(mediaId)
    if (!id) {
      return { status: "error", formError: "Média inconnu." }
    }

    const row = await write.rowStrict<{ id: Buffer; object_key: string }>(
      "confirm_media",
      [
        id,
        dimensions.width ?? null,
        dimensions.height ?? null,
        dimensions.byteSize ?? null,
        actor.id,
        ip,
      ]
    )

    return {
      status: "ok",
      id: toHex(row.id),
      url: publicUrl(row.object_key),
    }
  })
}

export async function setMediaAlt(
  mediaId: string,
  alt: string
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const id = parseId(mediaId)
    if (!id) {
      return { status: "error", formError: "Média inconnu." }
    }
    await write.void("set_media_alt", [id, alt.slice(0, 300), actor.id, ip])
    return OK
  })
}
