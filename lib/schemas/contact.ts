import { z } from "zod"

import { budgetRanges } from "@/lib/content/team"

/**
 * Schéma unique du formulaire de contact, partagé par le client et le serveur.
 *
 * Le client s'en sert pour valider à la volée via `react-hook-form`, le serveur
 * le rejoue avant tout envoi : la validation du navigateur est un confort, celle
 * du serveur est la seule autorité. Un seul schéma, donc aucun risque de voir
 * les deux divergents.
 *
 * Les messages sont rédigés pour être affichés tels quels : explicites, en
 * français, sans jargon de validation.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indiquez votre nom.")
    .max(120, "Ce nom est trop long."),
  company: z
    .string()
    .trim()
    .min(1, "Indiquez votre société.")
    .max(120, "Ce nom est trop long."),
  email: z
    .string()
    .trim()
    .min(1, "Indiquez votre e-mail.")
    .max(180, "Cet e-mail est trop long.")
    .pipe(z.email("Cet e-mail ne semble pas valide.")),
  project: z
    .string()
    .trim()
    .min(1, "Décrivez votre projet, même en deux lignes.")
    .min(20, "Quelques mots de plus nous aideraient à vous répondre.")
    .max(4000, "Ce message est trop long : envoyez-nous l'essentiel."),
  budget: z.enum(budgetRanges).optional(),
  /**
   * Champ leurre. Hors du flux visuel, vide pour un humain, souvent rempli par
   * un robot. Le schéma l'accepte tel quel ; c'est l'action serveur qui décide
   * quoi en faire, pour ne pas afficher d'erreur à un robot.
   */
  website: z.string().max(0).optional().or(z.literal("")),
})

export type ContactInput = z.infer<typeof contactSchema>

export const contactDefaults: ContactInput = {
  name: "",
  company: "",
  email: "",
  project: "",
  budget: budgetRanges[0],
  website: "",
}
