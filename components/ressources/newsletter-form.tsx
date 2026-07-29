"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"

import { subscribe, type NewsletterResult } from "@/app/ressources/actions"
import { Button } from "@/components/ui/button"
import { newsletterSchema } from "@/lib/schemas/newsletter"

/**
 * Capture douce de niveau tertiaire : e-mail seul, pas de prospection.
 * Même mécanique que le formulaire de contact, en plus court.
 */
function NewsletterForm() {
  const [result, setResult] = React.useState<NewsletterResult | null>(null)

  const form = useForm({
    resolver: standardSchemaResolver(newsletterSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await subscribe(values)
    if (response.fieldErrors?.email) {
      form.setError("email", { message: response.fieldErrors.email })
    }
    setResult(response)
    if (response.status === "sent") {
      form.reset()
    }
  })

  if (result?.status === "sent") {
    return (
      <p
        role="status"
        className="rounded-sm border border-line bg-page px-4 py-3.5 text-[0.9rem] text-body"
      >
        C’est noté. Vous recevrez le prochain envoi, et rien d’autre.
      </p>
    )
  }

  const error = form.formState.errors.email?.message ?? result?.formError

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-2">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="votre@email.fr"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className="h-12 flex-1 rounded-sm border border-line-strong bg-page px-4 text-[0.94rem] text-ink placeholder:text-label aria-invalid:border-danger"
          {...form.register("email")}
        />
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Envoi..." : "S’abonner"}
        </Button>
      </div>
      {error ? (
        <p id="newsletter-error" className="text-[0.78rem] text-danger-text">
          {error}
        </p>
      ) : null}
    </form>
  )
}

export { NewsletterForm }
