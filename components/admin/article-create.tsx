"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Dialog } from "@base-ui/react/dialog"
import { Plus, X } from "lucide-react"

import { createArticle } from "@/app/admin/(protected)/articles/actions"
import { Button } from "@/components/ui/button"
import { articleCategories, createArticleSchema } from "@/lib/schemas/article"
import { cn } from "@/lib/utils"

const fieldClass =
  "border-line-strong bg-surface text-ink placeholder:text-label h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"

/** Même dérivation que `Slugify()` en SQL, pour l'aperçu de l'URL. */
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
 * Création d'un article : trois champs.
 *
 * Le reste - chapô, signature, corps - se remplit dans l'éditeur. Un article se
 * rédige par étapes, et la complétude est exigée à la publication.
 */
function ArticleCreate() {
  const [open, setOpen] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm({
    resolver: standardSchemaResolver(createArticleSchema),
    defaultValues: { title: "", slug: "", category: "Guide" as const },
  })

  const title = useWatch({ control: form.control, name: "title" })
  const slug = useWatch({ control: form.control, name: "slug" })
  const preview = slug || slugify(title ?? "")

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    const result = await createArticle(values)
    if (result?.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as "title" | "slug" | "category", { message })
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
            Nouvel article
          </Button>
        }
      />

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-300 bg-inverse/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-400 w-[calc(100vw-2.5rem)] max-w-105 -translate-1/2 rounded-xl border border-line bg-raised p-6 shadow-4 transition-[opacity,transform] duration-[180ms] ease-expo data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-[1.25rem] font-bold tracking-[-0.015em] text-ink">
                Nouvel article
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[0.845rem] text-body">
                Le titre et la catégorie suffisent pour commencer.
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

            <div className="grid gap-1.5">
              <label
                htmlFor="title"
                className="text-[0.82rem] font-medium text-ink"
              >
                Titre
              </label>
              <textarea
                id="title"
                rows={2}
                autoFocus
                placeholder="Faut-il un logiciel du marché ou une plateforme sur mesure ?"
                aria-invalid={errors.title ? true : undefined}
                className="w-full rounded-sm border border-line-strong bg-surface px-3.5 py-3 text-[0.94rem] leading-relaxed text-ink placeholder:text-label aria-invalid:border-danger"
                {...form.register("title")}
              />
              {errors.title ? (
                <p className="text-[0.78rem] text-danger-text">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="slug"
                className="text-[0.82rem] font-medium text-ink"
              >
                Identifiant d&apos;URL{" "}
                <span className="font-normal text-label">(optionnel)</span>
              </label>
              <input
                id="slug"
                placeholder={slugify(title ?? "") || "acheter-ou-construire"}
                aria-invalid={errors.slug ? true : undefined}
                className={cn(fieldClass, "font-mono text-[0.875rem]")}
                {...form.register("slug")}
              />
              <p className="text-xs text-label">
                {preview ? (
                  <>
                    Adresse publique :{" "}
                    <span className="font-mono text-body">
                      /ressources/{preview}
                    </span>
                  </>
                ) : (
                  "Déduit du titre si laissé vide."
                )}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="category"
                className="text-[0.82rem] font-medium text-ink"
              >
                Catégorie
              </label>
              <select
                id="category"
                className={cn(fieldClass, "cursor-pointer appearance-none")}
                {...form.register("category")}
              >
                {articleCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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

export { ArticleCreate }
