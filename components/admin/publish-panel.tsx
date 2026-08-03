"use client"

import * as React from "react"
import { Archive, Check, Globe, Loader2 } from "lucide-react"

import type { SaveOutcome } from "@/components/admin/editor-state"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * « Prêt à publier ? », et la réponse avant le clic.
 *
 * **Le défaut que ce panneau corrige.** La base sait exactement ce qu'exige une
 * publication - un titre, deux résumés, un secteur, au moins un chapitre - et le
 * refusait proprement. Mais elle ne le disait qu'**après** le clic, sous forme
 * d'un message d'erreur. Il fallait donc essayer pour apprendre, ce qui est le pire
 * ordre possible : on découvre le travail restant au moment où on croyait avoir
 * fini.
 *
 * Les exigences listées ici reprennent une à une celles de `publish_case_study` et
 * de ses équivalentes. **C'est une duplication assumée** : le contrôle qui compte
 * reste en base, celui-ci n'est qu'un miroir. S'ils divergent, la base gagne et le
 * clic échoue - avec son message. On ne perd donc pas la sûreté, seulement le
 * confort, et c'est ce que la duplication achète.
 *
 * Chaque manque est un lien vers l'étape qui le comble. Une liste de reproches sans
 * chemin pour y répondre aurait juste déplacé la frustration.
 */

export type Requirement = {
  /** Ce qui est exigé, formulé comme un constat. « Un résumé court ». */
  label: string
  done: boolean
  /** L'étape à ouvrir pour le renseigner. */
  step: string
  stepLabel: string
}

export function PublishPanel({
  published,
  requirements,
  publish,
  onGoToStep,
}: {
  published: boolean
  requirements: readonly Requirement[]
  publish: (next: boolean) => Promise<SaveOutcome>
  onGoToStep: (step: string) => void
}) {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const missing = requirements.filter((one) => !one.done)
  const ready = missing.length === 0

  const act = () =>
    startTransition(async () => {
      setError(null)
      const outcome = await publish(!published)
      if (outcome.status === "error") {
        setError(outcome.formError ?? "L'action a échoué.")
      }
    })

  return (
    <div
      className={cn(
        "grid gap-3 rounded-lg border px-5 py-4",
        published
          ? "border-line bg-surface"
          : ready
            ? "border-success-text/30 bg-success-subtle"
            : "border-line-strong bg-surface"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.9rem] font-medium text-ink">
          {published
            ? "Cette fiche est en ligne."
            : ready
              ? "Tout ce qu'exige la publication est là."
              : missing.length === 1
                ? "Il reste une chose à renseigner avant de publier."
                : `Il reste ${missing.length} choses à renseigner avant de publier.`}
        </p>

        <div className="flex items-center gap-3">
          {error ? (
            <span role="alert" className="text-[0.82rem] text-danger-text">
              {error}
            </span>
          ) : null}
          <Button
            type="button"
            variant={published ? "secondary" : "brand"}
            size="md"
            onClick={act}
            // Le bouton reste actif quand il manque quelque chose : le désactiver
            // aurait rendu la cause invisible aux technologies d'assistance, qui
            // sautent souvent les commandes inertes. Il échoue avec un message.
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : published ? (
              <Archive className="size-4" strokeWidth={1.5} />
            ) : (
              <Globe className="size-4" strokeWidth={1.5} />
            )}
            {published ? "Dépublier" : "Publier"}
          </Button>
        </div>
      </div>

      {!published && missing.length > 0 ? (
        <ul className="grid gap-1.5 border-t border-line pt-3">
          {missing.map((one) => (
            <li key={one.label}>
              <button
                type="button"
                onClick={() => onGoToStep(one.step)}
                className="flex min-h-9 items-center gap-2 text-left text-[0.845rem] text-body transition-colors duration-100 hover:text-ink"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-brand"
                />
                {one.label}
                <span className="text-[0.78rem] text-label underline decoration-line-strong underline-offset-2">
                  {one.stepLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!published && ready ? (
        <p className="flex items-center gap-1.5 border-t border-success-text/20 pt-3 text-[0.82rem] text-success-text">
          <Check className="size-3.5" strokeWidth={2} />
          {requirements.length} exigences vérifiées.
        </p>
      ) : null}
    </div>
  )
}
