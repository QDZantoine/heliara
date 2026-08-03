import { z } from "zod"

/**
 * Capture douce : e-mail seul. Le même schéma sert au client et à l'action
 * serveur, comme pour le formulaire de contact.
 */
export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Indiquez votre e-mail.")
    .max(180, "Cet e-mail est trop long.")
    .pipe(z.email("Cet e-mail ne semble pas valide.")),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>
