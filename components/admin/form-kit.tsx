"use client"

import * as React from "react"
import { ChevronRight, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Les petites pièces de formulaire de l'administration, en un seul endroit.
 *
 * Elles étaient recopiées dans les trois éditeurs, avec des tailles et des
 * espacements qui avaient commencé à diverger. Les rassembler ici n'est pas de
 * l'abstraction gratuite : c'est ce qui garantit qu'un champ de réalisation et un
 * champ d'article se remplissent de la même façon, ce qui est la moitié du confort
 * de saisie.
 */

export const input =
  "border-line-strong bg-surface text-ink placeholder:text-faint h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"

export const area =
  "border-line-strong bg-surface text-ink placeholder:text-faint w-full rounded-sm border px-3.5 py-3 text-[0.94rem] leading-relaxed transition-colors duration-100 aria-invalid:border-danger"

/**
 * Un champ, son libellé, son aide et son erreur.
 *
 * L'aide est en dessous du champ et non collée au libellé. C'est le changement qui
 * a le plus allégé les écrans : un libellé suivi de son explication sur la même
 * ligne se lit comme une phrase coupée, et il fallait la relire pour trouver où
 * s'arrête le nom du champ.
 *
 * `example` est à part de `hint` : une aide dit **où la valeur s'affiche**, un
 * exemple montre **à quoi elle ressemble**. Les mélanger produisait des libellés
 * de trois lignes.
 */
export function Field({
  label,
  hint,
  example,
  error,
  optional,
  children,
}: {
  label: string
  hint?: string
  example?: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  const id = React.useId()
  const hintId = `${id}-hint`
  const describedBy = hint || example || error ? hintId : undefined

  return (
    // `content-start` : sans lui, un champ court placé à côté d'un champ dont
    // l'aide tient sur deux lignes voit ses rangées automatiques s'étirer pour
    // combler la hauteur, et son cadre de saisie descend de quelques pixels. Deux
    // champs côte à côte cessaient de s'aligner sans qu'on voie pourquoi.
    <div className="grid content-start gap-1.5">
      <label
        htmlFor={id}
        className="flex flex-wrap items-baseline gap-x-2 text-[0.845rem] font-medium text-ink"
      >
        {label}
        {optional ? (
          <span className="text-[0.72rem] font-normal tracking-[0.04em] text-faint uppercase">
            facultatif
          </span>
        ) : null}
      </label>

      {/* L'identifiant est posé sur l'enfant : c'est ce qui relie le libellé au
          champ, quel que soit le type de contrôle passé. */}
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              id?: string
              "aria-invalid"?: boolean
              "aria-describedby"?: string
            }>,
            {
              id,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": describedBy,
            }
          )
        : children}

      {error ? (
        <p id={hintId} className="text-[0.8rem] text-danger-text">
          {error}
        </p>
      ) : hint || example ? (
        <p id={hintId} className="text-[0.8rem] leading-snug text-label">
          {hint}
          {hint && example ? " " : null}
          {example ? (
            <span className="text-faint">Par exemple : {example}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

/** Un groupe de champs, avec ce qu'il sert à décider. */
export function Fieldset({
  title,
  hint,
  children,
  className,
}: {
  title?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    // `content-start` pour la même raison que dans `Field` : à côté d'un aperçu
    // plus haut que lui, un groupe voyait ses rangées s'étirer et son titre se
    // détacher de son explication de soixante pixels.
    <section className={cn("grid content-start gap-4", className)}>
      {title || hint ? (
        <div className="grid content-start gap-1">
          {title ? (
            <h3 className="font-display text-[1rem] font-bold tracking-[-0.01em] text-ink">
              {title}
            </h3>
          ) : null}
          {hint ? (
            <p className="max-w-prose text-[0.82rem] leading-relaxed text-label">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Select({
  value,
  onChange,
  options,
  id,
  className,
  ...aria
}: {
  value: string
  onChange: (value: string) => void
  options: readonly (readonly [string, string])[]
  id?: string
  className?: string
  /** Posés par `Field`, qui clone son enfant pour l'appareiller à son libellé. */
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}) {
  return (
    <select
      id={id}
      {...aria}
      className={cn(input, "cursor-pointer appearance-none", className)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-sm py-1 text-[0.9rem] text-body transition-colors duration-100 hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-brand-solid"
      />
      <span className="grid gap-0.5">
        <span className="font-medium text-ink">{label}</span>
        {hint ? (
          <span className="text-[0.8rem] leading-snug text-label">{hint}</span>
        ) : null}
      </span>
    </label>
  )
}

export function AddButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong text-[0.875rem] font-medium text-body transition-colors duration-100 hover:border-ink hover:bg-surface hover:text-ink"
    >
      <Plus className="size-4" strokeWidth={2} />
      {label}
    </button>
  )
}

export function RemoveButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 shrink-0 place-items-center rounded-sm text-label transition-colors duration-100 hover:bg-danger-subtle hover:text-danger-text"
    >
      <Trash2 className="size-3.5" strokeWidth={1.5} />
    </button>
  )
}

/**
 * Un repli pour ce qui se règle une fois.
 *
 * Halo, accent, libellé de bloc : des choix qu'on fait à la création et qu'on ne
 * rouvre jamais. Les laisser dépliés à côté du titre et du résumé leur donnait le
 * même poids visuel, alors qu'ils ne demandent pas la même attention.
 */
export function Folded({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <details className="group rounded-lg border border-line bg-surface">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.875rem] font-medium text-body transition-colors duration-100 hover:text-ink">
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-label transition-transform duration-100 group-open:rotate-90"
          strokeWidth={1.75}
        />
        {title}
        {hint ? (
          <span className="truncate text-[0.8rem] font-normal text-faint">
            {hint}
          </span>
        ) : null}
      </summary>
      <div className="grid gap-4 border-t border-line px-4 py-4">
        {children}
      </div>
    </details>
  )
}

/** L'erreur d'une ligne de collection, sous elle. */
export function RowError({ message }: { message?: string }) {
  if (!message) {
    return null
  }
  return <p className="text-[0.8rem] text-danger-text">{message}</p>
}

/**
 * Une collection vide, et ce qu'il faudrait y mettre.
 *
 * Le libellé dit ce que la publication exige quand elle exige quelque chose : une
 * liste vide sans explication laisse croire qu'elle est facultative, et on l'apprend
 * au moment de publier.
 */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-line-strong px-5 py-8 text-center text-[0.875rem] text-label">
      {children}
    </p>
  )
}

/** Un compteur de caractères, discret, qui ne se montre qu'à l'approche. */
export function Counter({ value, max }: { value: string; max: number }) {
  const used = value.trim().length
  // Rien avant 70 % : un compteur permanent transforme la rédaction en exercice
  // de remplissage.
  if (used < max * 0.7) {
    return null
  }
  return (
    <span
      className={cn(
        "text-[0.75rem] tabular-nums",
        used > max ? "font-semibold text-danger-text" : "text-label"
      )}
    >
      {used} / {max}
    </span>
  )
}
