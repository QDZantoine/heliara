"use client"

import * as React from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import {
  createFamily,
  deleteFamily,
  reorderFamilies,
  updateFamily,
} from "@/app/admin/(protected)/expertises/actions"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import type { FamilySummary, ServiceSummary } from "@/lib/db/expertises"
import { cn } from "@/lib/utils"

const input =
  "border-line-strong bg-surface text-ink placeholder:text-label h-10 w-full rounded-sm border px-3 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"
const area =
  "border-line-strong bg-surface text-ink placeholder:text-label w-full rounded-sm border px-3 py-2.5 text-[0.94rem] leading-relaxed"

/**
 * Les familles d'expertise.
 *
 * **Ce sont les entrées de nav du site**, et c'est ce qui rend cet écran particulier :
 * leur ordre est celui du menu, leur libellé est celui du menu, et supprimer une
 * famille non vide emporterait des pages publiées - la base le refuse.
 *
 * Chaque famille s'enregistre séparément, comme un onglet d'éditeur : on modifie
 * rarement les trois d'un coup, et un enregistrement global obligerait à revalider
 * des lignes auxquelles on n'a pas touché.
 */
function FamilyBoard({
  families,
  services,
}: {
  families: FamilySummary[]
  /** Pour proposer la cible de nav : elle doit désigner un service qui existe. */
  services: ServiceSummary[]
}) {
  const [error, setError] = React.useState<string | null>(null)

  const onReorder = (next: FamilySummary[]) => {
    setError(null)
    React.startTransition(async () => {
      const result = await reorderFamilies({
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

  return (
    <div className="grid gap-5">
      <p className="text-[0.845rem] text-body">
        Les familles sont les entrées « Expertises » du menu et du pied de page.
        Leur ordre ici est celui du site.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}

      {families.length > 0 ? (
        <SortableList id="families" items={families} onReorder={onReorder}>
          {(family) => (
            <FamilyRow
              key={family.id}
              family={family}
              services={services}
              onError={setError}
            />
          )}
        </SortableList>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-5 py-8 text-center text-[0.9rem] text-label">
          Aucune famille. Créez la première ci-dessous.
        </p>
      )}

      <CreateFamily />
    </div>
  )
}

function FamilyRow({
  family,
  services,
  onError,
}: {
  family: FamilySummary
  services: ServiceSummary[]
  onError: (message: string | null) => void
}) {
  const [values, setValues] = React.useState({
    slug: family.slug,
    label: family.label,
    title: family.title,
    summary: family.summary,
    tag: family.tag,
    halo: family.halo,
    sketch1: family.sketch[0],
    sketch2: family.sketch[1],
    sketch3: family.sketch[2],
    navServiceSlug: family.navServiceSlug,
  })
  const [dirty, setDirty] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [pending, startTransition] = React.useTransition()
  const [confirming, setConfirming] = React.useState(false)

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const own = services.filter((one) => one.familyId === family.id)

  const save = () =>
    startTransition(async () => {
      onError(null)
      setFieldErrors({})
      const result = await updateFamily(family.id, values)
      if (result.status === "error") {
        setFieldErrors(result.fieldErrors ?? {})
        onError(
          result.formError ?? Object.values(result.fieldErrors ?? {})[0] ?? null
        )
        return
      }
      setDirty(false)
      setSaved(true)
    })

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
        <Field label="Libellé de nav" error={fieldErrors.label}>
          <input
            className={input}
            value={values.label}
            onChange={(event) => set("label", event.target.value)}
          />
        </Field>
        <Field
          label="Identifiant d'URL"
          hint="Le regroupement, pas une page"
          error={fieldErrors.slug}
        >
          <input
            className={cn(input, "font-mono text-[0.875rem]")}
            value={values.slug}
            onChange={(event) => set("slug", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Titre du groupe sur le hub" error={fieldErrors.title}>
        <input
          className={input}
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
        />
      </Field>

      <Field label="Résumé" error={fieldErrors.summary}>
        <textarea
          rows={2}
          className={area}
          value={values.summary}
          onChange={(event) => set("summary", event.target.value)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-[8rem_9rem_1fr]">
        <Field label="Étiquette" hint="« saas »" error={fieldErrors.tag}>
          <input
            className={cn(input, "font-mono text-[0.875rem]")}
            value={values.tag}
            onChange={(event) => set("tag", event.target.value)}
          />
        </Field>
        <Field label="Halo">
          <select
            className={cn(input, "cursor-pointer appearance-none")}
            value={values.halo}
            onChange={(event) =>
              set("halo", event.target.value as "warm" | "cool")
            }
          >
            <option value="warm">Chaud</option>
            <option value="cool">Froid</option>
          </select>
        </Field>
        <Field
          label="Entrée de nav vers"
          hint={
            own.length === 0
              ? "Aucun service : la nav mènera au hub"
              : "Le service que le menu ouvre"
          }
          error={fieldErrors.navServiceSlug}
        >
          <select
            className={cn(input, "cursor-pointer appearance-none")}
            value={values.navServiceSlug}
            onChange={(event) => set("navServiceSlug", event.target.value)}
          >
            <option value="">Le hub /expertises</option>
            {own.map((one) => (
              <option key={one.slug} value={one.slug}>
                {one.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Croquis"
        hint="Les trois barres de l'illustration, en pourcentage de largeur"
      >
        <div className="flex items-center gap-2">
          {([1, 2, 3] as const).map((index) => {
            const key = `sketch${index}` as "sketch1" | "sketch2" | "sketch3"
            return (
              <span key={key} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={100}
                  aria-label={`Barre ${index}`}
                  className={cn(input, "w-18 text-center font-mono")}
                  value={values[key]}
                  onChange={(event) => set(key, Number(event.target.value))}
                />
                <span
                  aria-hidden="true"
                  className="h-1.5 w-24 overflow-hidden rounded-full bg-inset"
                >
                  <span
                    className="block h-full bg-brand"
                    style={{
                      width: `${Math.min(100, Math.max(0, values[key]))}%`,
                    }}
                  />
                </span>
              </span>
            )
          })}
        </div>
      </Field>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={pending || !dirty}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Enregistrer
        </Button>

        {saved && !dirty ? (
          <span role="status" className="text-[0.82rem] text-success-text">
            Enregistré.
          </span>
        ) : dirty ? (
          <span className="text-[0.82rem] text-label">Non enregistré.</span>
        ) : null}

        <span className="flex-1" />

        {confirming ? (
          <span className="flex items-center gap-1.5">
            <span className="text-[0.82rem] text-danger-text">
              Supprimer « {family.label} » ?
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteFamily(family.id)
                  if (result.status === "error") {
                    onError(result.formError ?? "La suppression a échoué.")
                    setConfirming(false)
                  }
                })
              }
            >
              Oui
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Annuler
            </Button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Supprimer la famille ${family.label}`}
            title={
              own.length > 0
                ? "Impossible : cette famille porte encore des services"
                : "Supprimer cette famille"
            }
            className="grid size-8 place-items-center rounded-xs text-label transition-colors duration-100 hover:bg-danger-subtle hover:text-danger-text"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

function CreateFamily() {
  const [label, setLabel] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-line-strong p-4">
      <label
        htmlFor="new-family"
        className="text-[0.82rem] font-medium text-ink"
      >
        Nouvelle famille
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="new-family"
          placeholder="Data & décisionnel"
          className={cn(input, "min-w-48 flex-1")}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Button
          type="button"
          size="md"
          disabled={pending || label.trim() === ""}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              const result = await createFamily({ label })
              if (result.status === "error") {
                setError(
                  result.formError ??
                    Object.values(result.fieldErrors ?? {})[0] ??
                    "La création a échoué."
                )
                return
              }
              setLabel("")
            })
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" strokeWidth={2} />
          )}
          Ajouter
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-[0.78rem] text-danger-text">
          {error}
        </p>
      ) : (
        <p className="text-xs text-label">
          Elle apparaîtra dans le menu du site dès qu&apos;elle portera un
          service publié.
        </p>
      )}
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  const id = React.useId()
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-[0.78rem] font-medium text-ink">
        {label}
        {hint ? <span className="font-normal text-label"> {hint}</span> : null}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              id?: string
              "aria-invalid"?: boolean
            }>,
            { id, "aria-invalid": error ? true : undefined }
          )
        : children}
      {error ? (
        <p className="text-[0.78rem] text-danger-text">{error}</p>
      ) : null}
    </div>
  )
}

export { FamilyBoard }
