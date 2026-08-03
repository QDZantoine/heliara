import { z } from "zod"

/**
 * Schémas des témoignages, partagés par l'écran et les actions serveur.
 *
 * **Le champ qui compte n'est pas le verbatim, c'est la trace de l'accord.** Un
 * témoignage attribué à une personne nommée chez une entreprise nommée engage les deux,
 * et le site a déjà publié trois citations inventées. Le schéma accepte pourtant un
 * accord vide, comme partout ailleurs : refuser l'enregistrement empêcherait de garder
 * une citation reçue en attendant sa validation. C'est la **publication** qui l'exige,
 * en base comme à l'écran.
 */

/**
 * Un jour de calendrier, contrôlé par aller-retour.
 *
 * `Date.parse` ne suffit pas : il accepte 2026-02-30 en le reportant au 2 mars. Une date
 * qui ne se réécrit pas à l'identique n'existe pas. Même contrôle que la date de
 * publication d'un article.
 */
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Attendu : AAAA-MM-JJ.")
  .refine(
    (value) =>
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value,
    "Cette date n'existe pas."
  )

const quote = z
  .string()
  .trim()
  .min(1, "Recopiez la citation telle que son auteur l'a validée.")
  /*
    600 caractères, la borne de la colonne. Elle est basse volontairement : au-delà de
    trois ou quatre phrases, une citation cesse d'en être une, et un paragraphe rédigé
    pour le client se reconnaît à sa longueur.
  */
  .max(600, "Cette citation est trop longue : trois ou quatre phrases au plus.")

const authorName = z
  .string()
  .trim()
  .min(1, "Indiquez le nom de la personne citée.")
  .max(120, "Ce nom est trop long.")

const authorRole = z
  .string()
  .trim()
  .min(1, "Indiquez sa fonction et son employeur.")
  .max(200, "Cette fonction est trop longue.")

/** Création : la citation et son auteur. L'accord se déclare ensuite. */
export const createTestimonialSchema = z.object({
  quote,
  authorName,
  authorRole,
})

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>

export const testimonialSchema = z.object({
  quote,
  authorName,
  authorRole,
  initials: z
    .string()
    .trim()
    .max(4, "Deux lettres suffisent.")
    .optional()
    .or(z.literal("")),
  /**
   * La date à laquelle l'auteur a validé **ce texte** par écrit. Vide est accepté ici,
   * et refusé à la publication.
   */
  consentAt: isoDate.optional().or(z.literal("")),
  /**
   * Où l'écrit se trouve : un e-mail daté, un contrat, un fil de discussion.
   *
   * Un champ libre plutôt qu'une case à cocher, parce qu'une case répond « oui » sans
   * dire quand ni où - ce qui ne vaut rien le jour où il faut retrouver l'accord.
   */
  consentNote: z
    .string()
    .trim()
    .max(300, "Cette note est trop longue.")
    .optional()
    .or(z.literal("")),
  /** La réalisation d'où vient la citation. Facultative, et non affichée. */
  caseId: z
    .string()
    .regex(/^[0-9a-f]{32}$/, "Réalisation inconnue.")
    .nullable()
    .optional()
    .or(z.literal("")),
})

export type TestimonialInput = z.infer<typeof testimonialSchema>
