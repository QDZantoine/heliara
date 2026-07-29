"use server"

import { redirect } from "next/navigation"

import { destroySession } from "@/lib/auth/session"

/**
 * Déconnexion. La session est fermée en base, pas seulement oubliée du
 * navigateur : un cookie recopié ailleurs ne vaut plus rien.
 */
export async function logout() {
  await destroySession()
  redirect("/admin/login")
}
