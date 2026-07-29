"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Dialog } from "@base-ui/react/dialog"
import { Plus, X } from "lucide-react"

import { createCase } from "@/app/admin/(protected)/realisations/actions"
import { Button } from "@/components/ui/button"
import { createCaseSchema } from "@/lib/schemas/case"
import { cn } from "@/lib/utils"

const fieldClass =
  "border-line-strong bg-surface text-ink placeholder:text-label h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"

/**
 * Dérive un identifiant d'URL depuis un titre, exactement comme `Slugify()` en SQL.
 *
 * L'aperçu est calculé côté client pour que la personne voie l'URL avant
 * d'enregistrer ; c'est la base qui produit la valeur finale si le champ est laissé
 * vide. Les deux implémentations doivent donc rester cohérentes - et le test
 * d'intégration vérifie celle qui compte.
 */
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Création d'une réalisation.
 *
 * Quatre champs seulement, et c'est délibéré : une fiche se remplit par étapes, et
 * exiger le tout d'un coup obligerait à préparer le contenu hors de l'outil. La
 * complétude est exigée à la publication, pas à la création.
 *
 * Le `Dialog` de Base UI fournit le piège à focus, la fermeture par Échap et le
 * verrou de défilement, comme le menu mobile du site public.
 */
function CaseCreate() {
  const [open, setOpen] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm({
    resolver: standardSchemaResolver(createCaseSchema),
    defaultValues: {
      title: "",
      slug: "",
      sector: "",
      year: String(new Date().getFullYear()),
    },
  })

  // `useWatch` et non `form.watch()` : celui-ci rend une fonction que le
  // compilateur React ne peut pas mémoriser, et il désactive alors la
  // mémorisation de tout le composant. `useWatch` s'abonne proprement.
  const title = useWatch({ control: form.control, name: "title" })
  const slug = useWatch({ control: form.control, name: "slug" })
  const preview = slug || slugify(title)

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    // En cas de succès, l'action redirige vers l'édition : rien à faire ici.
    const result = await createCase(values)

    if (result?.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as "title" | "slug" | "sector" | "year", {
          message,
        })
      }
    }
    if (result?.formError) {
      setFormError(result.formError)
    }
  })

  const errors = form.formState.errors

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button type="button" size="md">
            <Plus className="size-4" strokeWidth={2} />
            Nouvelle réalisation
          </Button>
        }
      />

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-300 bg-inverse/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-400 w-[calc(100vw-2.5rem)] max-w-105 -translate-1/2 rounded-xl border border-line bg-raised p-6 shadow-4 transition-[opacity,transform] duration-[180ms] ease-expo data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[1.25rem] font-bold tracking-[-0.015em] text-ink">
                Nouvelle réalisation
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[0.845rem] text-body">
                Le strict nécessaire pour ouvrir un brouillon. Le reste
                s&apos;écrit ensuite.
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

            <Field id="title" label="Titre" error={errors.title?.message}>
              <input
                id="title"
                autoFocus
                placeholder="Refonte de l'espace client"
                aria-invalid={errors.title ? true : undefined}
                className={fieldClass}
                {...form.register("title")}
              />
            </Field>

            <Field
              id="slug"
              label="Identifiant d'URL"
              hint="(optionnel)"
              error={errors.slug?.message}
            >
              <input
                id="slug"
                placeholder={slugify(title) || "refonte-espace-client"}
                aria-invalid={errors.slug ? true : undefined}
                aria-describedby="slug-preview"
                className={cn(fieldClass, "font-mono text-[0.875rem]")}
                {...form.register("slug")}
              />
              <p id="slug-preview" className="text-xs text-label">
                {preview ? (
                  <>
                    Adresse publique :{" "}
                    <span className="font-mono text-body">
                      /realisations/{preview}
                    </span>
                  </>
                ) : (
                  "Déduit du titre si laissé vide."
                )}
              </p>
            </Field>

            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <Field id="sector" label="Secteur" error={errors.sector?.message}>
                <input
                  id="sector"
                  placeholder="Santé"
                  aria-invalid={errors.sector ? true : undefined}
                  className={fieldClass}
                  {...form.register("sector")}
                />
              </Field>
              <Field id="year" label="Année" error={errors.year?.message}>
                <input
                  id="year"
                  inputMode="numeric"
                  aria-invalid={errors.year ? true : undefined}
                  className={cn(fieldClass, "font-mono")}
                  {...form.register("year")}
                />
              </Field>
            </div>

            <div className="mt-1 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <Button type="button" variant="secondary" size="md">
                    Annuler
                  </Button>
                }
              />
              <Button
                type="submit"
                size="md"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Création…"
                  : "Créer le brouillon"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[0.82rem] font-medium text-ink">
        {label}
        {hint ? <span className="font-normal text-label"> {hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[0.78rem] text-danger-text">{error}</p>
      ) : null}
    </div>
  )
}

export { CaseCreate }
