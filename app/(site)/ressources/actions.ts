"use server"

import { Resend } from "resend"
import { z } from "zod"

import { newsletterSchema } from "@/lib/schemas/newsletter"
import { site } from "@/lib/site"

export type NewsletterResult = {
  status: "sent" | "error"
  fieldErrors?: { email?: string }
  formError?: string
}

/**
 * Abonnement aux ressources. Volontairement rudimentaire : l'adresse est
 * transmise à l'équipe par e-mail, sans outil d'emailing intermédiaire. Le jour
 * où un vrai gestionnaire de liste est choisi, seul le corps de cette fonction
 * change.
 *
 * Le schéma est rejoué ici : une action serveur est une route publique.
 */
export async function subscribe(input: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input)

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error)
    return {
      status: "error",
      fieldErrors: { email: flat.fieldErrors.email?.[0] },
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM
  const to = process.env.CONTACT_TO ?? site.email

  if (!apiKey || !from) {
    console.error(
      "Abonnement : RESEND_API_KEY ou CONTACT_FROM manquant, adresse non transmise."
    )
    return {
      status: "error",
      formError: "L'inscription est momentanément indisponible.",
    }
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "Ressources : nouvelle inscription",
      text: `Adresse à ajouter à la liste : ${parsed.data.email}`,
    })
    if (error) {
      console.error("Abonnement : Resend a refusé l'envoi.", error)
      return { status: "error", formError: "L'inscription a échoué." }
    }
  } catch (error) {
    console.error("Abonnement : erreur pendant l'envoi.", error)
    return { status: "error", formError: "L'inscription a échoué." }
  }

  return { status: "sent" }
}
