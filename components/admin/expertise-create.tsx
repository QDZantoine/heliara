"use client"

import * as React from "react"
import { Loader2, Plus } from "lucide-react"

import { createService } from "@/app/admin/(protected)/expertises/actions"
import { Button } from "@/components/ui/button"
import type { FamilySummary } from "@/lib/db/expertises"
import { cn } from "@/lib/utils"

const input =
  "border-line-strong bg-surface text-ink placeholder:text-label h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100"

/**
 * Création d'un service.
 *
 * En ligne plutôt qu'en dialogue : deux champs, et le bouton vit au-dessus d'une
 * liste qu'on regarde déjà. Une boîte de dialogue ne coûterait qu'un clic de plus.
 *
 * Le choix de la famille est obligatoire : un service sans famille n'a pas de place
 * dans le hub, et la base le refuse.
 */
function ExpertiseCreate({ families }: { families: FamilySummary[] }) {
  const [title, setTitle] = React.useState("")
  const [familyId, setFamilyId] = React.useState(families[0]?.id ?? "")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  if (families.length === 0) {
    return null
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <span className="grid min-w-56 flex-1 gap-1">
          <label
            htmlFor="new-service"
            className="text-[0.78rem] font-medium text-ink"
          >
            Nouveau service
          </label>
          <input
            id="new-service"
            placeholder="Plateformes métiers & SaaS"
            className={input}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </span>
        <span className="grid min-w-40 gap-1">
          <label
            htmlFor="new-service-family"
            className="text-[0.78rem] font-medium text-ink"
          >
            Famille
          </label>
          <select
            id="new-service-family"
            className={cn(input, "cursor-pointer appearance-none")}
            value={familyId}
            onChange={(event) => setFamilyId(event.target.value)}
          >
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.label}
              </option>
            ))}
          </select>
        </span>
        <Button
          type="button"
          size="md"
          disabled={pending || title.trim() === ""}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              // En cas de succès l'action redirige vers l'édition.
              const result = await createService({ title, familyId })
              if (result?.status === "error") {
                setError(
                  result.formError ??
                    Object.values(result.fieldErrors ?? {})[0] ??
                    "La création a échoué."
                )
              }
            })
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" strokeWidth={2} />
          )}
          Créer
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-[0.78rem] text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { ExpertiseCreate }
