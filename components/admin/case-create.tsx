"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"

import { createCase } from "@/app/admin/(protected)/realisations/actions"
import { CreateDialog, SlugField } from "@/components/admin/create-dialog"
import { Field, input } from "@/components/admin/form-kit"
import { createCaseSchema } from "@/lib/schemas/case"
import { cn } from "@/lib/utils"

/**
 * Création d'une réalisation.
 *
 * Quatre champs seulement, et c'est délibéré : une fiche se remplit par étapes, et
 * exiger le tout d'un coup obligerait à préparer le contenu hors de l'outil. La
 * complétude est exigée à la publication, pas à la création - c'est le panneau de
 * publication de l'éditeur qui dit ce qu'il reste à faire.
 */
function CaseCreate() {
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
    <CreateDialog
      trigger="Nouvelle réalisation"
      title="Nouvelle réalisation"
      description="Le strict nécessaire pour ouvrir un brouillon. Le récit, les preuves et les visuels s'écrivent ensuite."
      formError={formError}
      submitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <Field label="Titre court" error={errors.title?.message}>
        <input
          autoFocus
          placeholder="Refonte de l'espace client"
          className={input}
          {...form.register("title")}
        />
      </Field>

      <SlugField
        id="case-slug"
        prefix="/realisations/"
        title={title}
        slug={slug ?? ""}
        example="refonte-espace-client"
        error={errors.slug?.message}
        register={form.register("slug")}
      />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <Field
          label="Secteur"
          hint="Sert de filtre sur /realisations."
          error={errors.sector?.message}
        >
          <input
            placeholder="Santé"
            className={input}
            {...form.register("sector")}
          />
        </Field>
        <Field label="Année" error={errors.year?.message}>
          <input
            inputMode="numeric"
            className={cn(input, "font-mono")}
            {...form.register("year")}
          />
        </Field>
      </div>
    </CreateDialog>
  )
}

export { CaseCreate }
