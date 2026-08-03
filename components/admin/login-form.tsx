"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"

import { login } from "@/app/admin/login/actions"
import { Button } from "@/components/ui/button"
import { loginSchema } from "@/lib/schemas/admin"
import { cn } from "@/lib/utils"

const fieldClass =
  "border-line-strong bg-surface text-ink placeholder:text-label h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"

/**
 * Connexion à l'administration.
 *
 * Même mécanique que les formulaires du site public : schéma zod partagé avec
 * l'action serveur, qui le rejoue. En cas de succès, l'action redirige, donc le
 * composant n'a pas d'état de réussite à gérer.
 */
function LoginForm() {
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    const result = await login(values)

    if (result?.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as "email" | "password", { message })
      }
    }
    if (result?.error) {
      setError(result.error)
    }
  })

  const errors = form.formState.errors

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-[0.82rem] font-medium text-ink">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoFocus
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldClass}
          {...form.register("email")}
        />
        {errors.email ? (
          <p id="email-error" className="text-[0.78rem] text-danger-text">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor="password"
          className="text-[0.82rem] font-medium text-ink"
        >
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          className={fieldClass}
          {...form.register("password")}
        />
        {errors.password ? (
          <p id="password-error" className="text-[0.78rem] text-danger-text">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className={cn("mt-1")}
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  )
}

export { LoginForm }
