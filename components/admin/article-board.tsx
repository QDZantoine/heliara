"use client"

import * as React from "react"
import Link from "next/link"
import {
  Archive,
  Check,
  Eye,
  Globe,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react"

import {
  deleteArticle,
  publishArticle,
  setFeatured,
} from "@/app/admin/(protected)/articles/actions"
import { Button } from "@/components/ui/button"
import type { ArticleSummary } from "@/lib/db/articles"
import { cn } from "@/lib/utils"

/**
 * Liste des articles.
 *
 * Pas de réordonnancement, à l'inverse des réalisations : le flux public est trié
 * par date de publication, et donner une poignée laisserait croire qu'on peut en
 * changer l'ordre. La date est le seul levier, et elle se règle dans la fiche.
 *
 * La mise en avant est un bouton de liste plutôt qu'une case dans le formulaire :
 * elle est **exclusive** - la choisir ici retire la précédente - et cela se comprend
 * mieux depuis une vue où l'on voit toutes les lignes.
 */
function ArticleBoard({ articles }: { articles: ArticleSummary[] }) {
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState<string | null>(null)

  const act = async (
    id: string,
    work: () => Promise<{ status: string; formError?: string }>
  ) => {
    setBusy(id)
    setError(null)
    const result = await work()
    if (result?.status === "error") {
      setError(result.formError ?? "L'action a échoué.")
    }
    setBusy(null)
    setConfirming(null)
  }

  if (articles.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-[0.9rem] text-label">
        Aucun article. Créez le premier avec le bouton ci-dessus.
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}

      <ul className="grid gap-2">
        {articles.map((item) => (
          <li
            key={item.id}
            className="grid gap-2 rounded-lg border border-line bg-surface px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/articles/${item.slug}`}
                  className="truncate text-[0.94rem] font-medium text-ink hover:text-info-text hover:underline"
                >
                  {item.title}
                </Link>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase",
                    item.status === "published"
                      ? "bg-success-subtle text-success-text"
                      : "bg-inset text-label"
                  )}
                >
                  {item.status === "published" ? (
                    <>
                      <Check className="size-2.5" strokeWidth={2.5} />
                      En ligne
                    </>
                  ) : (
                    "Brouillon"
                  )}
                </span>
                {item.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-xs bg-brand-subtle px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.06em] text-brand-text uppercase">
                    <Star className="size-2.5" strokeWidth={2.5} />
                    En tête
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-label">
                {item.category} · {item.dateLabel || item.publishedOn}
                {item.readingTime ? ` · ${item.readingTime}` : ""} ·{" "}
                {item.blockCount} bloc{item.blockCount > 1 ? "s" : ""}
                {item.status === "published" ? (
                  <>
                    {" · "}
                    <span className="font-mono">{item.viewCount}</span> vue
                    {item.viewCount > 1 ? "s" : ""}
                  </>
                ) : null}
              </p>
            </div>

            {confirming === item.id ? (
              <div className="flex shrink-0 flex-wrap items-center gap-1.5 rounded-sm border border-danger bg-danger-subtle px-2 py-1">
                <span className="text-[0.82rem] text-danger-text">
                  Supprimer « {item.title} » ?
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => act(item.id, () => deleteArticle(item.id))}
                  disabled={busy === item.id}
                >
                  {busy === item.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  Oui, supprimer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(null)}
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    act(item.id, () => setFeatured(item.id, !item.featured))
                  }
                  disabled={busy === item.id}
                  title={
                    item.featured
                      ? "Retirer de la tête du flux"
                      : "Mettre en tête du flux, à la place de l'article actuel"
                  }
                >
                  <Star
                    className={cn(
                      "size-3.5",
                      item.featured && "fill-brand text-brand"
                    )}
                    strokeWidth={1.5}
                  />
                  <span className="sr-only">
                    {item.featured ? "Retirer de la tête" : "Mettre en tête"}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    act(item.id, () =>
                      publishArticle(item.id, item.status !== "published")
                    )
                  }
                  disabled={busy === item.id}
                  title={
                    item.status === "published"
                      ? "Repasser en brouillon"
                      : "Publier"
                  }
                >
                  {busy === item.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : item.status === "published" ? (
                    <Archive className="size-3.5" strokeWidth={1.5} />
                  ) : (
                    <Globe className="size-3.5" strokeWidth={1.5} />
                  )}
                  <span className="hidden sm:inline">
                    {item.status === "published" ? "Dépublier" : "Publier"}
                  </span>
                </Button>

                <Link
                  href={`/admin/articles/${item.slug}/apercu`}
                  title="Aperçu"
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-body transition-colors duration-100 hover:bg-inset hover:text-ink"
                >
                  <Eye className="size-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Aperçu</span>
                  <span className="sr-only">de {item.title}</span>
                </Link>

                <Link
                  href={`/admin/articles/${item.slug}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-body transition-colors duration-100 hover:bg-inset hover:text-ink"
                >
                  <Pencil className="size-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Modifier</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setConfirming(item.id)}
                  aria-label={`Supprimer ${item.title}`}
                  title="Supprimer"
                  className="grid size-9 place-items-center rounded-sm text-label transition-colors duration-100 hover:bg-danger-subtle hover:text-danger-text"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ArticleBoard }
