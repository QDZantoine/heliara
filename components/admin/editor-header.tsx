"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ExternalLink, Eye, Loader2, Trash2 } from "lucide-react"

import type { SaveOutcome } from "@/components/admin/editor-state"
import { Button } from "@/components/ui/button"
import { publicSiteUrl } from "@/lib/public-url"
import { cn } from "@/lib/utils"

/**
 * L'en-tête d'un éditeur : où l'on est, comment on regarde, comment on supprime.
 *
 * Recopié à l'identique dans les trois éditeurs jusqu'ici, à trois détails près qui
 * n'étaient pas des choix : les réalisations refermaient la confirmation de
 * suppression en cas d'échec, les expertises la refermaient **et** perdaient le
 * message, les articles la laissaient ouverte. Un seul composant tranche une fois -
 * on garde la confirmation ouverte et l'on affiche l'erreur en dessous, parce que
 * l'échec le plus courant est métier (« une famille non vide ne se supprime pas ») et
 * que refermer obligerait à recliquer pour lire la cause.
 *
 * La publication n'est **pas** ici : elle vit dans `PublishPanel`, qui dit ce qu'il
 * manque avant d'échouer. Un bouton « Publier » dans l'en-tête aurait rendu ce
 * panneau redondant, et c'est le panneau qui est utile.
 */
export function EditorHeader({
  backHref,
  backLabel,
  crumb,
  slug,
  title,
  published,
  previewHref,
  publicPath,
  remove,
  removeHint,
}: {
  backHref: string
  backLabel: string
  /** Un niveau intermédiaire, quand la collection en a un. La famille d'un service. */
  crumb?: string
  slug: string
  title: string
  published: boolean
  previewHref: string
  /** Le chemin sur le site public. Le lien n'apparaît que si la fiche est en ligne. */
  publicPath: string
  /** L'action de suppression. Elle redirige en cas de succès : rien ne suit. */
  remove: () => Promise<SaveOutcome | void>
  /** Ce qui va disparaître, s'il y a plus que la fiche elle-même. */
  removeHint?: string
}) {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  return (
    <header className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2 text-[0.82rem] text-label">
        <Link href={backHref} className="hover:text-ink hover:underline">
          {backLabel}
        </Link>
        {crumb ? (
          <>
            <span aria-hidden="true">/</span>
            <span>{crumb}</span>
          </>
        ) : null}
        <span aria-hidden="true">/</span>
        <span className="font-mono">{slug}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="max-w-[40rem] font-display text-[1.6rem] leading-tight font-bold tracking-[-0.02em] text-ink">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 font-semibold tracking-[0.06em] uppercase",
                published
                  ? "bg-success-subtle text-success-text"
                  : "bg-inset text-label"
              )}
            >
              {published ? (
                <>
                  <Check className="size-2.5" strokeWidth={2.5} /> En ligne
                </>
              ) : (
                "Brouillon"
              )}
            </span>

            {/* L'aperçu vaut pour un brouillon comme pour une fiche en ligne :
                c'est le rendu exact de la page, servi par l'administration parce
                que seule elle a le droit de lire un brouillon. */}
            <Link
              href={previewHref}
              className="inline-flex items-center gap-1 text-info-text hover:underline"
            >
              <Eye className="size-3" strokeWidth={1.75} />
              Aperçu
            </Link>

            {published ? (
              <a
                href={publicSiteUrl(publicPath)}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-info-text hover:underline"
              >
                Voir en ligne
                <ExternalLink className="size-3" strokeWidth={1.75} />
              </a>
            ) : null}
          </div>
        </div>

        {/* Confirmation en deux temps plutôt qu'un `confirm()` natif : le libellé
            dit ce qui va disparaître, et l'annulation reste à portée. */}
        {confirming ? (
          <div className="grid justify-items-end gap-2 rounded-sm border border-danger bg-danger-subtle px-3 py-2">
            <p className="text-[0.82rem] text-danger-text">
              Supprimer définitivement&nbsp;?
              {removeHint ? (
                <span className="block text-[0.78rem]">{removeHint}</span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setError(null)
                    const result = await remove()
                    if (result && result.status === "error") {
                      setError(result.formError ?? "La suppression a échoué.")
                    }
                  })
                }
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Oui, supprimer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setConfirming(false)
                  setError(null)
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setConfirming(true)}
            className="text-danger-text"
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
            Supprimer
          </Button>
        )}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}
    </header>
  )
}
