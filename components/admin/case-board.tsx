"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Eye, EyeOff, Loader2, Pencil, ScanEye } from "lucide-react"

import {
  publishCase,
  reorderCases,
} from "@/app/admin/(protected)/realisations/actions"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import type { CaseSummary } from "@/lib/db/cases"
import { cn } from "@/lib/utils"

/**
 * Grille des réalisations : réordonnancement, publication, accès à l'édition.
 *
 * **L'ordre est appliqué à l'écran avant d'être enregistré**, par `useOptimistic` :
 * attendre la réponse du serveur pour bouger la ligne rendrait le geste poussif.
 * C'est la seule mise à jour optimiste de l'administration, et elle est justifiée -
 * réordonner est un geste qu'on répète. En cas d'échec, l'ordre du serveur revient
 * de lui-même à la fin de la transition, et le message dit ce qui s'est passé.
 *
 * `position` est recalculée de 10 en 10 à chaque enregistrement : insérer entre
 * deux voisines reste possible sans renuméroter, et la valeur reste lisible en base.
 */
function CaseBoard({ cases }: { cases: CaseSummary[] }) {
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  /**
   * `useOptimistic` plutôt qu'un état local recopié depuis les props.
   *
   * Deux raisons. D'abord la ligne bouge à l'instant du geste, sans attendre le
   * serveur : réordonner est un geste qu'on répète, il doit répondre. Ensuite
   * React retombe tout seul sur la valeur du serveur à la fin de la transition,
   * donc il n'y a **ni rollback à écrire, ni synchronisation à faire** quand la
   * liste change pour une autre raison. Un `useState` initialisé sur les props
   * aurait demandé un effet pour se resynchroniser, ce que la règle
   * `react-hooks/set-state-in-effect` refuse - et à raison.
   */
  const [items, applyOrder] = React.useOptimistic(
    cases,
    (_current: CaseSummary[], next: CaseSummary[]) => next
  )

  const onReorder = (next: CaseSummary[]) => {
    setError(null)
    // L'appel doit vivre dans une transition, sinon l'état optimiste serait
    // abandonné avant que l'action aboutisse.
    React.startTransition(async () => {
      applyOrder(next)
      const result = await reorderCases({
        order: next.map((item, index) => ({
          id: item.id,
          position: index * 10,
        })),
      })
      if (result.status === "error") {
        setError(result.formError ?? "L'ordre n'a pas pu être enregistré.")
      }
    })
  }

  const onPublish = async (item: CaseSummary) => {
    setBusy(item.id)
    setError(null)
    const result = await publishCase(item.id, item.status !== "published")
    if (result.status === "error") {
      setError(
        result.formError ??
          Object.values(result.fieldErrors ?? {})[0] ??
          "L'action a échoué."
      )
    }
    setBusy(null)
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-[0.9rem] text-label">
        Aucune réalisation. Créez la première avec le bouton ci-dessus.
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

      <p className="text-xs text-label">
        L&apos;ordre de cette liste est celui de la grille publique. Attrapez
        une poignée pour le changer, ou utilisez Espace puis les flèches au
        clavier.
      </p>

      <SortableList items={items} onReorder={onReorder}>
        {(item) => (
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/realisations/${item.slug}`}
                  className="truncate text-[0.94rem] font-medium text-ink hover:text-info-text hover:underline"
                >
                  {item.title}
                </Link>
                <StatusBadge status={item.status} />
                {item.featured ? (
                  <span className="rounded-xs bg-brand-subtle px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.06em] text-brand-text uppercase">
                    Accueil
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-label">
                {item.sector} · {item.year} · {item.chapterCount} chapitre
                {item.chapterCount > 1 ? "s" : ""} · {item.resultCount} résultat
                {item.resultCount > 1 ? "s" : ""}
                {item.updatedByName ? ` · ${item.updatedByName}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onPublish(item)}
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
                  <EyeOff className="size-3.5" strokeWidth={1.5} />
                ) : (
                  <Eye className="size-3.5" strokeWidth={1.5} />
                )}
                <span className="hidden sm:inline">
                  {item.status === "published" ? "Dépublier" : "Publier"}
                </span>
              </Button>

              <Link
                href={`/admin/realisations/${item.slug}/apercu`}
                title="Aperçu"
                className="inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-body transition-colors duration-100 hover:bg-inset hover:text-ink"
              >
                <ScanEye className="size-3.5" strokeWidth={1.5} />
                <span className="sr-only">Aperçu de {item.title}</span>
              </Link>

              <Link
                href={`/admin/realisations/${item.slug}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-body transition-colors duration-100 hover:bg-inset hover:text-ink"
              >
                <Pencil className="size-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Modifier</span>
              </Link>
            </div>
          </div>
        )}
      </SortableList>
    </div>
  )
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase",
        status === "published"
          ? "bg-success-subtle text-success-text"
          : "bg-inset text-label"
      )}
    >
      {status === "published" ? (
        <>
          <Check className="size-2.5" strokeWidth={2.5} />
          En ligne
        </>
      ) : (
        "Brouillon"
      )}
    </span>
  )
}

export { CaseBoard }
