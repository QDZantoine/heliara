import { z } from "zod"

/**
 * Schémas de l'équipe, partagés par l'écran et les actions serveur.
 *
 * **Aucun champ de teinte.** La couleur de la pastille est déduite de la position à la
 * lecture : la DA n'autorise qu'un geste orange par écran, donc sur une grille de cartes
 * une seule répartition est correcte. Un champ dont une seule valeur est juste n'est pas
 * un réglage, c'est une occasion de se tromper.
 */

const mediaId = z.string().regex(/^[0-9a-f]{32}$/, "Média inconnu.")

/** Création : le nom et le rôle, le reste se remplit ensuite. */
export const createMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indiquez le nom de la personne.")
    .max(120, "Ce nom est trop long."),
  role: z
    .string()
    .trim()
    .min(1, "Indiquez la fonction.")
    .max(160, "Cette fonction est trop longue."),
})

export type CreateMemberInput = z.infer<typeof createMemberSchema>

export const memberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indiquez le nom de la personne.")
    .max(120, "Ce nom est trop long."),
  role: z
    .string()
    .trim()
    .min(1, "Indiquez la fonction.")
    .max(160, "Cette fonction est trop longue."),
  initials: z
    .string()
    .trim()
    .max(4, "Deux lettres suffisent.")
    .optional()
    .or(z.literal("")),
  /**
   * Le parcours. Pas de longueur maximale imposée par le schéma : la colonne est un
   * `TEXT`, et une bio trop longue se voit à l'écran bien avant de gêner la base.
   */
  bio: z.string().trim().optional().or(z.literal("")),
  /**
   * Associé, c'est-à-dire présenté sur `/contact` sous « Vos interlocuteurs ».
   *
   * **Ce n'est pas un rang honorifique.** La page promet une réponse d'un associé sous
   * 48 heures : lever ce drapeau pour quelqu'un qui ne répond pas aux messages rendrait
   * la promesse fausse.
   */
  isPartner: z.boolean(),
  /** Les deux portraits, nullables pour permettre un brouillon. */
  photoLightMediaId: mediaId.nullable().optional(),
  photoDarkMediaId: mediaId.nullable().optional(),
})

export type MemberInput = z.infer<typeof memberSchema>

/**
 * Les spécialités, en puces sur la carte.
 *
 * **Quatre au plus se lisent**, et la borne est ici plutôt qu'en base : au-delà elles
 * cessent d'être des repères pour devenir une liste, ce qui est un problème d'affichage
 * et non d'intégrité. Une ligne laissée vide est acceptée par le schéma et écartée par la
 * procédure : c'est une hésitation, pas une erreur.
 */
export const skillsSchema = z.object({
  items: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .max(120, "Cette spécialité est trop longue.")
          .optional()
          .or(z.literal("")),
      })
    )
    .max(8, "Quatre spécialités se lisent, huit sont la limite."),
})

export type SkillsInput = z.infer<typeof skillsSchema>
