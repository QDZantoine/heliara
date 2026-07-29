"use client"

import * as React from "react"
import Link from "next/link"
import {
  Archive,
  Check,
  Eye,
  Globe,
  Layers,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react"

import {
  deleteService,
  publishService,
  reorderServices,
} from "@/app/admin/(protected)/expertises/actions"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import type { FamilySummary, ServiceSummary } from "@/lib/db/expertises"
import { cn } from "@/lib/utils"

/**
 * Les services, groupés par famille.
 *
 * Le regroupement n'est pas décoratif : le hub public affiche exactement ces groupes,
 * dans cet ordre. Une liste plate obligerait à imaginer le résultat.
 *
 * Le réordonnancement se fait **dans une famille**, pas entre familles : déplacer un
 * service d'une famille à l'autre est un changement de sens, qui se fait dans sa
 * fiche. L'ordre des familles se règle dans l'onglet dédié.
 */
function ExpertiseBoard({
  families,
  services,
}: {
  families: FamilySummary[]
  services: ServiceSummary[]
}) {
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

  const onReorder = (next: ServiceSummary[]) => {
    setError(null)
    React.startTransition(async () => {
      const result = await reorderServices({
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

  if (families.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-[0.9rem] text-label">
        Aucune famille. Créez-en une dans l&apos;onglet Familles : un service a
        besoin d&apos;une famille pour exister.
      </p>
    )
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}

      {families.map((family) => {
        const own = services.filter((item) => item.familyId === family.id)
        return (
          <section key={family.id} className="grid gap-2.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="flex items-center gap-2 font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
                <Layers className="size-4 text-label" strokeWidth={1.5} />
                {family.label}
              </h2>
              <span className="font-mono text-xs text-label">
                /{family.slug}
              </span>
              <span className="text-xs text-label">
                {own.length} service{own.length > 1 ? "s" : ""}
                {own.length > 0 ? ` · ${family.publishedCount} en ligne` : ""}
              </span>
            </div>

            {own.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-5 text-[0.845rem] text-label">
                Aucun service. Cette famille reste dans la nav du site et mène
                au hub, mais elle n&apos;y apparaît pas.
              </p>
            ) : (
              <SortableList
                id={`services-${family.slug}`}
                items={own}
                onReorder={onReorder}
              >
                {(item) => (
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/expertises/${item.slug}`}
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
                        {family.navServiceSlug === item.slug ? (
                          <span
                            title="L'entrée de nav de cette famille mène à ce service"
                            className="rounded-xs bg-info-subtle px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.06em] text-info-text uppercase"
                          >
                            Nav
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-label">
                        {item.deliverableCount} livrable
                        {item.deliverableCount > 1 ? "s" : ""} · {item.faqCount}{" "}
                        objection{item.faqCount > 1 ? "s" : ""}
                        {item.updatedByName ? ` · ${item.updatedByName}` : ""}
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
                          onClick={() =>
                            act(item.id, () => deleteService(item.id))
                          }
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
                            act(item.id, () =>
                              publishService(
                                item.id,
                                item.status !== "published"
                              )
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
                            {item.status === "published"
                              ? "Dépublier"
                              : "Publier"}
                          </span>
                        </Button>

                        <Link
                          href={`/admin/expertises/${item.slug}/apercu`}
                          title="Aperçu"
                          className="inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-body transition-colors duration-100 hover:bg-inset hover:text-ink"
                        >
                          <Eye className="size-3.5" strokeWidth={1.5} />
                          <span className="hidden sm:inline">Aperçu</span>
                        </Link>

                        <Link
                          href={`/admin/expertises/${item.slug}`}
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
                  </div>
                )}
              </SortableList>
            )}
          </section>
        )
      })}
    </div>
  )
}

export { ExpertiseBoard }
