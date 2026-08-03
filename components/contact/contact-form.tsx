"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Check } from "lucide-react"

import { submitContact, type ContactResult } from "@/app/(site)/contact/actions"
import { Button } from "@/components/ui/button"
import { budgetRanges } from "@/lib/content/team"
import { contactDefaults, contactSchema } from "@/lib/schemas/contact"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

const fieldClass =
  "border-line-strong bg-surface text-ink placeholder:text-label w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"

/** Libellé au-dessus du champ, message d'erreur en dessous, en clair. */
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
        <p id={`${id}-error`} className="text-[0.78rem] text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Formulaire de contact, seul composant client de la page.
 *
 * `react-hook-form` valide à la soumission contre le schéma zod partagé avec
 * l'action serveur, qui le rejoue de son côté. Les erreurs que seul le serveur
 * peut connaître sont réinjectées dans le formulaire par `setError`, si bien
 * qu'elles s'affichent au même endroit que les autres.
 *
 * Le résolveur utilisé est `standardSchemaResolver` : zod 4 implémente Standard
 * Schema, et c'est la voie recommandée depuis `@hookform/resolvers` v5.
 *
 * Limite assumée : ce formulaire exige JavaScript. La page affiche l'adresse
 * e-mail et le téléphone en alternative, et le reste du site fonctionne sans.
 */
function ContactForm() {
  const [result, setResult] = React.useState<ContactResult | null>(null)

  const form = useForm({
    resolver: standardSchemaResolver(contactSchema),
    defaultValues: contactDefaults,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await submitContact(values)

    if (response.fieldErrors) {
      for (const [field, message] of Object.entries(response.fieldErrors)) {
        form.setError(field as keyof typeof contactDefaults, { message })
      }
    }

    setResult(response)

    if (response.status === "sent") {
      form.reset()
    }
  })

  if (result?.status === "sent") {
    return (
      <div className="rounded-xl border border-line bg-raised p-8 text-center shadow-3 md:p-10">
        <span
          aria-hidden="true"
          className="mb-4.5 inline-flex size-13 items-center justify-center rounded-full bg-success-subtle text-success-text"
        >
          <Check className="size-5" strokeWidth={1.75} />
        </span>
        <h2 className="mb-2 font-display text-[1.375rem] font-bold tracking-[-0.015em] text-ink">
          Message bien reçu.
        </h2>
        <p className="mx-auto max-w-[20rem] text-[0.9rem] leading-relaxed text-body">
          Léa ou Marc vous répond sous 48 heures ouvrées.
        </p>
      </div>
    )
  }

  const errors = form.formState.errors

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-5 rounded-xl border border-line bg-raised p-6 shadow-3 md:p-10"
    >
      {result?.formError ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {result.formError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Votre nom" error={errors.name?.message}>
          <input
            id="name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn(fieldClass, "h-11")}
            {...form.register("name")}
          />
        </Field>
        <Field id="company" label="Société" error={errors.company?.message}>
          <input
            id="company"
            autoComplete="organization"
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? "company-error" : undefined}
            className={cn(fieldClass, "h-11")}
            {...form.register("company")}
          />
        </Field>
      </div>

      <Field
        id="email"
        label="E-mail professionnel"
        error={errors.email?.message}
      >
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={cn(fieldClass, "h-11")}
          {...form.register("email")}
        />
      </Field>

      <Field
        id="project"
        label="Votre projet, avec vos mots"
        error={errors.project?.message}
      >
        <textarea
          id="project"
          rows={5}
          placeholder="Le contexte, le problème, ce que vous aimeriez voir exister…"
          aria-invalid={errors.project ? true : undefined}
          aria-describedby={errors.project ? "project-error" : undefined}
          className={cn(fieldClass, "resize-y py-3 leading-relaxed")}
          {...form.register("project")}
        />
      </Field>

      <Field
        id="budget"
        label="Enveloppe envisagée"
        hint="(optionnel - aide à cadrer la réponse)"
      >
        <select
          id="budget"
          className={cn(fieldClass, "h-11 cursor-pointer appearance-none")}
          {...form.register("budget")}
        >
          {budgetRanges.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </Field>

      {/* Leurre anti-robot : hors flux visuel, mais atteignable par un robot. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="website">Site web</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>

      <Button type="submit" size="xl" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Envoi…" : "Envoyer - réponse sous 48 h"}
      </Button>

      <p className="text-center text-xs text-label">
        Aucune newsletter, aucune relance commerciale automatique. Vos données
        servent uniquement à vous répondre, et l’adresse {site.email} reste
        ouverte si vous préférez l’e-mail.
      </p>
    </form>
  )
}

export { ContactForm }
