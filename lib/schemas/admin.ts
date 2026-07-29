import { z } from "zod"

/**
 * Schémas de l'administration, partagés par le client et les actions serveur,
 * comme ceux du site public. Les messages sont rédigés pour être affichés tels
 * quels.
 */

/** Longueur minimale d'un mot de passe d'administration. */
export const PASSWORD_MIN = 12

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Indiquez votre adresse.")
    .max(180, "Cette adresse est trop longue.")
    .pipe(z.email("Cette adresse ne semble pas valide.")),
  password: z
    .string()
    .min(1, "Indiquez votre mot de passe.")
    // Bornée haut : argon2 accepte n'importe quelle taille, mais rien n'oblige à
    // hacher un mégaoctet envoyé par un plaisantin.
    .max(200, "Ce mot de passe est trop long."),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Mot de passe à la création et à la réinitialisation. Une seule règle, la
 * longueur : imposer un chiffre et une majuscule produit des mots de passe plus
 * courts et plus devinables, alors qu'une phrase longue résiste mieux. C'est aussi
 * la recommandation de l'ANSSI et du NIST.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Au moins ${PASSWORD_MIN} caractères.`)
  .max(200, "Ce mot de passe est trop long.")

export const accountSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Indiquez une adresse.")
    .max(180, "Cette adresse est trop longue.")
    .pipe(z.email("Cette adresse ne semble pas valide.")),
  displayName: z
    .string()
    .trim()
    .min(1, "Indiquez un nom.")
    .max(120, "Ce nom est trop long."),
  password: passwordSchema,
  role: z.enum(["admin", "editor"]).default("admin"),
})

export type AccountInput = z.infer<typeof accountSchema>

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Indiquez votre mot de passe actuel."),
    next: passwordSchema,
    confirm: z.string().min(1, "Confirmez le nouveau mot de passe."),
  })
  .refine((values) => values.next === values.confirm, {
    path: ["confirm"],
    message: "Les deux saisies ne correspondent pas.",
  })
  .refine((values) => values.next !== values.current, {
    path: ["next"],
    message: "Choisissez un mot de passe différent de l'actuel.",
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
