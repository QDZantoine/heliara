"use server"

import { redirect } from "next/navigation"

import { burnVerifyTime, verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { write } from "@/lib/db/call"
import { loginSchema } from "@/lib/schemas/admin"

export type LoginResult = {
  /** Un seul message, volontairement identique pour toutes les causes de refus. */
  error?: string
  fieldErrors?: { email?: string; password?: string }
}

type LoginRow = {
  id: Buffer
  password_hash: string
  suspended_at: number | null
}

/**
 * Le refus est toujours formulé de la même façon, quelle que soit sa cause :
 * adresse inconnue, mot de passe faux, compte suspendu. Distinguer les cas
 * transformerait le formulaire en outil d'énumération de comptes.
 */
const REFUSED = "Adresse ou mot de passe incorrect."

/**
 * Connexion à l'administration.
 *
 * Trois précautions qui comptent, dans cet ordre :
 *
 * 1. **Le schéma est rejoué ici.** Une action serveur est une route publique.
 * 2. **Le temps de réponse ne dit rien.** Sur une adresse inconnue, on dépense
 *    quand même le temps d'une vérification argon2 contre une empreinte leurre.
 *    Sans cela, la durée de la réponse révélerait quels comptes existent.
 * 3. **La suspension est examinée après le mot de passe.** L'inverse permettrait
 *    de découvrir un compte suspendu sans en connaître le mot de passe.
 */
export async function login(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors: LoginResult["fieldErrors"] = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (field === "email" || field === "password") {
        fieldErrors[field] ??= issue.message
      }
    }
    return { fieldErrors }
  }

  const { email, password } = parsed.data
  const user = await write.row<LoginRow>("get_user_for_login", [email])

  if (!user) {
    await burnVerifyTime(password)
    return { error: REFUSED }
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    return { error: REFUSED }
  }

  if (user.suspended_at !== null) {
    return { error: REFUSED }
  }

  await createSession(user.id)
  // `redirect` lève : rien ne s'exécute après, et le type de retour est respecté.
  redirect("/admin")
}
