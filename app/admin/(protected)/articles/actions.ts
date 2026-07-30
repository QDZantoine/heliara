"use server"

import { revalidatePath, updateTag } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { requireSession, type SessionUser } from "@/lib/auth/session"
import { todayIso } from "@/lib/date"
import { blocksToJson } from "@/lib/db/articles"
import { BusinessError, write } from "@/lib/db/call"
import { parseId } from "@/lib/db/id"
import {
  articleSchema,
  blocksSchema,
  createArticleSchema,
  frenchDateLabel,
} from "@/lib/schemas/article"

/**
 * Actions d'écriture des articles.
 *
 * **Chacune commence par `requireSession()`**, comme celles des réalisations : une
 * action serveur est une route publique, et le layout ne protège que le rendu des
 * pages. Chacune rejoue aussi son schéma zod.
 */

export type ActionResult = {
  status: "ok" | "error"
  fieldErrors?: Record<string, string>
  formError?: string
}

const OK: ActionResult = { status: "ok" }

const messages: Record<string, string> = {
  SLUG_TAKEN: "Cet identifiant d'URL est déjà pris par un autre article.",
  SLUG_REQUIRED: "Indiquez un identifiant d'URL.",
  ARTICLE_NOT_FOUND: "Cet article n'existe plus.",
  ARTICLE_INCOMPLETE:
    "Il manque des champs obligatoires : titre, chapô, auteur et date.",
  ARTICLE_NO_BLOCK: "Ajoutez au moins un bloc de contenu avant de publier.",
  INVALID_JSON: "Les données envoyées sont illisibles.",
}

const errorFields: Record<string, string> = {
  SLUG_TAKEN: "slug",
  SLUG_REQUIRED: "slug",
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
    // `redirect()` et `notFound()` lèvent : il ne faut pas les intercepter.
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
    console.error("Articles : écriture en échec.", error)
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
 * Invalide le cache de l'administration. Voir la note de l'équivalent des
 * réalisations : le cache du site public est un autre, hors d'atteinte d'ici.
 */
function invalidate(slug?: string) {
  updateTag("articles")
  if (slug) {
    updateTag(`article:${slug}`)
  }
  revalidatePath("/admin/articles")
  revalidatePath("/admin")
}

export async function createArticle(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const parsed = createArticleSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    // `todayIso` et non `toISOString` : celui-ci rend le jour UTC, donc la veille
    // pendant les premières heures de la nuit en Europe. Voir `lib/date.ts`.
    const today = todayIso()
    const row = await write.rowStrict<{ slug: string }>("create_article", [
      parsed.data.slug || null,
      parsed.data.title,
      parsed.data.category,
      // Le libellé français est fabriqué ici : MariaDB le formaterait selon la
      // locale de son serveur, ce qui rendrait le résultat imprévisible.
      frenchDateLabel(today),
      actor.id,
      ip,
    ])

    invalidate(row.slug)
    redirect(`/admin/articles/${row.slug}`)
  })
}

export async function updateArticle(
  id: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const articleId = parseId(id)
    if (!articleId) {
      return { status: "error", formError: "Article inconnu." }
    }

    const parsed = articleSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }
    const v = parsed.data

    await write.void("update_article", [
      articleId,
      v.slug,
      v.category,
      v.title,
      v.lead ?? "",
      v.author ?? "",
      v.authorRole ?? "",
      v.authorInitials ?? "",
      v.publishedOn,
      // Un libellé laissé vide est reconstruit depuis la date : mieux vaut une
      // date en français correcte qu'un champ vide sur une carte de flux.
      v.dateLabel || frenchDateLabel(v.publishedOn),
      v.readingTime ?? "",
      // La mise en avant a sa propre action : elle doit rester exclusive, et
      // l'exclusivité se joue sur plusieurs lignes.
      null,
      v.relatedCase ?? "",
      v.heroMediaId ? parseId(v.heroMediaId) : null,
      actor.id,
      ip,
    ])

    invalidate(v.slug)
    revalidatePath(`/admin/articles/${v.slug}`)
    return OK
  })
}

export async function setBlocks(
  id: string,
  slug: string,
  input: unknown
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const articleId = parseId(id)
    if (!articleId) {
      return { status: "error", formError: "Article inconnu." }
    }

    const parsed = blocksSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    }

    await write.void("set_article_blocks", [
      articleId,
      JSON.stringify(blocksToJson(parsed.data.items)),
      actor.id,
      ip,
    ])

    invalidate(slug)
    revalidatePath(`/admin/articles/${slug}`)
    return OK
  })
}

export async function publishArticle(
  id: string,
  publish: boolean
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const articleId = parseId(id)
    if (!articleId) {
      return { status: "error", formError: "Article inconnu." }
    }
    await write.void("publish_article", [
      articleId,
      publish ? 1 : 0,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

/**
 * Mise en avant, **exclusive**.
 *
 * Le flux public affiche un article en tête et l'exclut de la grille : deux mises en
 * avant en feraient disparaître une sans que personne comprenne pourquoi. La
 * procédure retire donc la précédente, ce qui explique qu'il s'agisse d'une action
 * distincte de l'enregistrement de la fiche.
 */
export async function setFeatured(
  id: string,
  featured: boolean
): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const articleId = parseId(id)
    if (!articleId) {
      return { status: "error", formError: "Article inconnu." }
    }
    await write.void("set_article_featured", [
      articleId,
      featured ? 1 : 0,
      actor.id,
      ip,
    ])
    invalidate()
    return OK
  })
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  return run(async () => {
    const { actor, ip } = await context()
    const articleId = parseId(id)
    if (!articleId) {
      return { status: "error", formError: "Article inconnu." }
    }
    await write.void("delete_article", [articleId, actor.id, ip])
    invalidate()
    redirect("/admin/articles")
  })
}
