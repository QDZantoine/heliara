"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"

import { createArticle } from "@/app/admin/(protected)/articles/actions"
import { CreateDialog, SlugField } from "@/components/admin/create-dialog"
import { Field, Select, area } from "@/components/admin/form-kit"
import { articleCategories, createArticleSchema } from "@/lib/schemas/article"

/**
 * Création d'un article : trois champs.
 *
 * Le reste - chapô, signature, corps - se remplit dans l'éditeur. Un article se
 * rédige par étapes, et la complétude est exigée à la publication.
 */
function ArticleCreate() {
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm({
    resolver: standardSchemaResolver(createArticleSchema),
    defaultValues: { title: "", slug: "", category: "Guide" as const },
  })

  const title = useWatch({ control: form.control, name: "title" })
  const slug = useWatch({ control: form.control, name: "slug" })
  const category = useWatch({ control: form.control, name: "category" })

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
    <CreateDialog
      trigger="Nouvel article"
      title="Nouvel article"
      description="Le titre et la catégorie suffisent pour commencer. Le chapô et le corps s'écrivent ensuite."
      formError={formError}
      submitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <Field label="Titre" error={errors.title?.message}>
        <textarea
          rows={2}
          autoFocus
          placeholder="Faut-il un logiciel du marché ou une plateforme sur mesure ?"
          className={area}
          {...form.register("title")}
        />
      </Field>

      <SlugField
        id="article-slug"
        prefix="/ressources/"
        title={title ?? ""}
        slug={slug ?? ""}
        example="acheter-ou-construire"
        error={errors.slug?.message}
        register={form.register("slug")}
      />

      <Field
        label="Catégorie"
        hint="Filtre du flux, et couleur de la pastille."
        error={errors.category?.message}
      >
        {/*
          `Select` et non le `register` de react-hook-form : la valeur est de type
          littéral, et `setValue` la garde typée là où le `register` d'un `<select>`
          rendrait une chaîne large.
        */}
        <Select
          value={category}
          onChange={(value) =>
            form.setValue("category", value as typeof category)
          }
          options={articleCategories.map(
            (name) => [name, name] as [string, string]
          )}
        />
      </Field>
    </CreateDialog>
  )
}

export { ArticleCreate }
