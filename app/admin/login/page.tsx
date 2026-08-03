import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/admin/login-form"
import { Logo } from "@/components/layout/logo"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Connexion",
  // L'administration n'a rien à faire dans un index.
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  // Déjà connecté : on ne fait pas ressaisir un mot de passe pour rien.
  if (await getSession()) {
    redirect("/admin")
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-page px-5 py-12">
      <div className="w-full max-w-90">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-[0.845rem] text-label">
            Administration des contenus
          </p>
        </div>

        <div className="rounded-xl border border-line bg-raised p-6 shadow-3 md:p-8">
          <h1 className="mb-6 font-display text-[1.375rem] font-bold tracking-[-0.015em] text-ink">
            Connexion
          </h1>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-label">
          Accès réservé. Aucun compte ne se crée depuis cette page.
        </p>
      </div>
    </main>
  )
}
