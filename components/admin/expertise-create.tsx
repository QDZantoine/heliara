"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"

import { createService } from "@/app/admin/(protected)/expertises/actions"
import { CreateDialog, SlugField } from "@/components/admin/create-dialog"
import { Field, Select, input } from "@/components/admin/form-kit"
import type { FamilySummary } from "@/lib/db/expertises"
import { createServiceSchema } from "@/lib/schemas/expertise"

/**
 * Création d'un service.
 *
 * **En dialogue, comme les deux autres collections.** Ce formulaire vivait en ligne
 * au-dessus de la liste, ce qui se défendait pris seul - deux champs, et un bouton à
 * côté d'une liste qu'on regarde déjà. Mais il en résultait trois gestes de création
 * différents dans la même administration, et surtout : l'identifiant d'URL n'avait
 * nulle part où tenir. Or c'est celui qui compte le plus ici, puisqu'une famille peut
 * le désigner comme cible de son entrée de menu.
 *
 * Le choix de la famille est obligatoire : un service sans famille n'a pas de place
 * dans le hub, et la base le refuse.
 */
function ExpertiseCreate({ families }: { families: FamilySummary[] }) {
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm({
    resolver: standardSchemaResolver(createServiceSchema),
    defaultValues: {
      title: "",
      slug: "",
      familyId: families[0]?.id ?? "",
    },
  })

  const title = useWatch({ control: form.control, name: "title" })
  const slug = useWatch({ control: form.control, name: "slug" })
  const familyId = useWatch({ control: form.control, name: "familyId" })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    // En cas de succès l'action redirige vers l'édition.
    const result = await createService(values)
    if (result?.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as "title" | "slug" | "familyId", { message })
      }
    }
    if (result?.formError) {
      setFormError(result.formError)
    }
  })

  const errors = form.formState.errors

  // Sans famille, il n'y a pas de place où ranger un service : le bouton n'a rien à
  // proposer, et le vide de la liste des familles est le message utile.
  if (families.length === 0) {
    return null
  }

  return (
    <CreateDialog
      trigger="Nouveau service"
      title="Nouveau service"
      description="Le titre et la famille suffisent. La promesse, les livrables et les objections s'écrivent ensuite."
      formError={formError}
      submitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <Field label="Titre" error={errors.title?.message}>
        <input
          autoFocus
          placeholder="Plateformes métier sur mesure"
          className={input}
          {...form.register("title")}
        />
      </Field>

      <SlugField
        id="service-slug"
        prefix="/expertises/"
        title={title ?? ""}
        slug={slug ?? ""}
        example="plateformes-metier"
        error={errors.slug?.message}
        register={form.register("slug")}
      />

      <Field
        label="Famille"
        hint="Le groupe du hub, et l'entrée de menu sous laquelle on trouvera ce service."
        error={errors.familyId?.message}
      >
        <Select
          value={familyId}
          onChange={(value) => form.setValue("familyId", value)}
          options={families.map(
            (family) => [family.id, family.label] as [string, string]
          )}
        />
      </Field>
    </CreateDialog>
  )
}

export { ExpertiseCreate }
