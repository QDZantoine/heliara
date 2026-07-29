"use server"

import { Resend } from "resend"
import { z } from "zod"

import { contactSchema, type ContactInput } from "@/lib/schemas/contact"
import { site } from "@/lib/site"

export type ContactResult = {
  status: "sent" | "error"
  /** Erreurs par champ, réinjectées sous le champ concerné côté client. */
  fieldErrors?: Partial<Record<keyof ContactInput, string>>
  /** Message global, quand c'est l'envoi lui-même qui a échoué. */
  formError?: string
}

/**
 * Envoi du formulaire de contact.
 *
 * Le schéma est rejoué ici quoi qu'ait fait le navigateur : une action serveur
 * est une route publique, elle ne peut faire confiance à son appelant.
 *
 * Le message part vers `CONTACT_TO` (à défaut l'adresse publique du site) depuis
 * `CONTACT_FROM`, qui doit appartenir à un domaine vérifié chez Resend — sans
 * quoi l'API refuse l'envoi. En l'absence de clé, l'action ne prétend pas avoir
 * envoyé : elle renvoie une erreur explicite et renvoie vers l'e-mail direct.
 *
 * `replyTo` porte l'adresse du prospect : répondre au message suffit.
 */
export async function submitContact(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input)

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error)
    const fieldErrors: ContactResult["fieldErrors"] = {}
    for (const [field, messages] of Object.entries(flat.fieldErrors)) {
      if (messages?.[0]) {
        fieldErrors[field as keyof ContactInput] = messages[0]
      }
    }
    return { status: "error", fieldErrors }
  }

  const values = parsed.data

  // Leurre rempli : on ne signale rien et on n'envoie rien.
  if (values.website) {
    return { status: "sent" }
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM
  const to = process.env.CONTACT_TO ?? site.email

  if (!apiKey || !from) {
    console.error(
      "Contact : RESEND_API_KEY ou CONTACT_FROM manquant, message non envoyé."
    )
    return {
      status: "error",
      formError: `L'envoi est momentanément indisponible. Écrivez-nous directement à ${site.email}.`,
    }
  }

  const body = [
    `Nom : ${values.name}`,
    `Société : ${values.company}`,
    `E-mail : ${values.email}`,
    `Enveloppe : ${values.budget ?? "non précisée"}`,
    "",
    values.project,
  ].join("\n")

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: values.email,
      subject: `Contact site — ${values.company} (${values.name})`,
      text: body,
    })

    if (error) {
      console.error("Contact : Resend a refusé l'envoi.", error)
      return {
        status: "error",
        formError: `L'envoi a échoué. Écrivez-nous directement à ${site.email}.`,
      }
    }
  } catch (error) {
    console.error("Contact : erreur pendant l'envoi.", error)
    return {
      status: "error",
      formError: `L'envoi a échoué. Écrivez-nous directement à ${site.email}.`,
    }
  }

  return { status: "sent" }
}
