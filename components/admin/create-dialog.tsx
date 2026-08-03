"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Loader2, Plus, X } from "lucide-react"

import { input } from "@/components/admin/form-kit"
import { Button } from "@/components/ui/button"
import { slugify } from "@/lib/slug"
import { cn } from "@/lib/utils"

/**
 * La coque commune aux créations de l'administration.
 *
 * **Trois collections créaient de trois façons différentes** : deux boîtes de
 * dialogue qui avaient déjà divergé - l'une avec un composant de champ, l'autre avec
 * son balisage recopié à la main - et un formulaire en ligne au-dessus de la liste.
 * Le formulaire en ligne était défendable pris seul, et c'est le piège : trois gestes
 * de création différents font ressembler l'administration à trois outils.
 *
 * Le dialogue gagne pour une raison précise : la création demande un identifiant
 * d'URL, dont l'aperçu réclame de la place et une explication. En ligne, cet aperçu
 * n'avait nulle part où tenir, et les deux formulaires qui n'étaient pas des
 * dialogues n'en avaient tout simplement pas.
 *
 * `Dialog` de Base UI fournit le piège à focus, la fermeture par Échap et le verrou
 * de défilement, comme le menu mobile du site public.
 */
export function CreateDialog({
  trigger,
  title,
  description,
  formError,
  submitting,
  submitLabel = "Créer le brouillon",
  onSubmit,
  children,
}: {
  /** Le libellé du bouton d'ouverture. « Nouvelle réalisation ». */
  trigger: string
  title: string
  /** Ce que la création exige, et ce qu'elle n'exige pas. */
  description: string
  formError?: string | null
  submitting: boolean
  submitLabel?: string
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button type="button" size="md">
            <Plus className="size-4" strokeWidth={2} />
            {trigger}
          </Button>
        }
      />

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-300 bg-inverse/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-400 w-[calc(100vw-2.5rem)] max-w-105 -translate-1/2 rounded-xl border border-line bg-raised p-6 shadow-4 transition-[opacity,transform] duration-[180ms] ease-expo data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[1.25rem] font-bold tracking-[-0.015em] text-ink">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[0.845rem] leading-relaxed text-body">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Fermer"
              className="grid size-9 shrink-0 place-items-center rounded-sm text-label transition-colors duration-100 hover:bg-inset hover:text-ink"
            >
              <X className="size-4" strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} noValidate className="grid gap-4">
            {formError ? (
              <p
                role="alert"
                className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
              >
                {formError}
              </p>
            ) : null}

            {children}

            <div className="mt-1 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <Button type="button" variant="secondary" size="md">
                    Annuler
                  </Button>
                }
              />
              <Button type="submit" size="md" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {submitting ? "Création…" : submitLabel}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * Le champ d'identifiant d'URL, et l'adresse qu'il produit.
 *
 * L'aperçu vaut mieux qu'une explication : « déduit du titre » ne dit pas ce qu'on
 * obtient d'un titre à apostrophes et à accents, et c'est précisément là qu'on veut
 * regarder avant d'enregistrer - une adresse ne se corrige plus sans casser des liens.
 */
export function SlugField({
  id,
  label = "Identifiant d'URL",
  prefix,
  title,
  slug,
  example,
  error,
  register,
}: {
  id: string
  label?: string
  /** Le chemin public, sans l'identifiant. « /realisations/ ». */
  prefix: string
  /** Le titre saisi, pour dériver l'aperçu quand le champ est vide. */
  title: string
  /**
   * L'identifiant saisi, observé.
   *
   * Il faut le recevoir séparément : `register()` rend un champ non contrôlé, dont
   * la valeur ne remonte pas dans ses props. Sans cette observation, l'aperçu
   * resterait figé sur la dérivation du titre pendant qu'on tape une adresse à la
   * main - exactement le cas où on le regarde.
   */
  slug: string
  example: string
  error?: string
  /** Ce que rend `form.register("slug")`, posé tel quel sur l'input. */
  register: React.ComponentProps<"input">
}) {
  const derived = slugify(title ?? "")
  const shown = (slug ?? "").trim() || derived
  const previewId = `${id}-preview`

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="flex flex-wrap items-baseline gap-x-2 text-[0.845rem] font-medium text-ink"
      >
        {label}
        <span className="text-[0.72rem] font-normal tracking-[0.04em] text-faint uppercase">
          facultatif
        </span>
      </label>
      <input
        id={id}
        placeholder={derived || example}
        aria-invalid={error ? true : undefined}
        aria-describedby={previewId}
        className={cn(input, "font-mono text-[0.875rem]")}
        {...register}
      />
      {error ? (
        <p className="text-[0.8rem] text-danger-text">{error}</p>
      ) : (
        <p id={previewId} className="text-[0.8rem] text-label">
          Adresse publique :{" "}
          <span className="font-mono text-body">
            {prefix}
            {shown || <span className="text-faint">…</span>}
          </span>
        </p>
      )}
    </div>
  )
}
