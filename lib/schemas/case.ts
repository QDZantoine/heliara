import { z } from "zod"

/**
 * Schémas des réalisations, partagés par le formulaire d'administration et les
 * actions serveur qui les rejouent.
 *
 * Les messages sont rédigés pour être affichés tels quels, sous le champ concerné.
 * Les longueurs maximales reprennent exactement celles des colonnes : une saisie
 * refusée par le navigateur vaut mieux qu'une troncature silencieuse par MariaDB.
 */

/** Minuscules, chiffres, tirets simples, ni début ni fin en tiret. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Indiquez un identifiant d'URL.")
  .max(120, "Cet identifiant est trop long.")
  .regex(
    SLUG,
    "Minuscules, chiffres et tirets simples uniquement, sans accent."
  )

/**
 * Création : le strict nécessaire pour ouvrir une fiche.
 *
 * Volontairement court. Exiger la fiche complète d'un coup obligerait à tout
 * préparer hors de l'outil ; un brouillon se remplit par étapes, et la publication
 * est le moment où la complétude est exigée.
 */
export const createCaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Indiquez un titre.")
    .max(200, "Ce titre est trop long."),
  slug: slugSchema.optional().or(z.literal("")),
  sector: z
    .string()
    .trim()
    .min(1, "Indiquez un secteur.")
    .max(80, "Ce secteur est trop long."),
  year: z
    .string()
    .trim()
    .min(1, "Indiquez une année.")
    .max(9, "Cette année est trop longue."),
})

export type CreateCaseInput = z.infer<typeof createCaseSchema>

export const chapterSchema = z.object({
  num: z.string().trim().max(4, "Deux chiffres suffisent.").optional(),
  title: z
    .string()
    .trim()
    .min(1, "Un chapitre a besoin d'un titre.")
    .max(200, "Ce titre est trop long."),
  text: z.string().trim().min(1, "Un chapitre a besoin d'un corps."),
  /** Encadré de décision structurante, filet orange à gauche. Facultatif. */
  callout: z.string().trim().max(2000, "Cet encadré est trop long.").optional(),
})

export const resultSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Indiquez la valeur.")
    .max(40, "Cette valeur est trop longue."),
  label: z
    .string()
    .trim()
    .min(1, "Indiquez ce que la valeur mesure.")
    .max(200, "Ce libellé est trop long."),
})

export const metaSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Indiquez le libellé.")
    .max(120, "Ce libellé est trop long."),
  value: z
    .string()
    .trim()
    .min(1, "Indiquez la valeur.")
    .max(300, "Cette valeur est trop longue."),
})

export const lessonSchema = z.object({
  text: z.string().trim().min(1, "Un enseignement ne peut pas être vide."),
})

export const gallerySchema = z.object({
  mediaId: z.string().regex(/^[0-9a-f]{32}$/, "Média inconnu."),
  caption: z
    .string()
    .trim()
    .max(300, "Cette légende est trop longue.")
    .optional(),
})

/**
 * Fiche complète.
 *
 * Le témoignage est facultatif **en bloc** : soit les quatre champs sont remplis,
 * soit aucun. Un verbatim sans nom ne s'afficherait pas correctement, et un nom
 * sans verbatim n'a rien à dire.
 */
export const caseSchema = z
  .object({
    slug: slugSchema,
    title: z
      .string()
      .trim()
      .min(1, "Indiquez un titre.")
      .max(200, "Ce titre est trop long."),
    heroTitle: z.string().trim().max(300, "Ce titre est trop long.").optional(),
    sector: z
      .string()
      .trim()
      .min(1, "Indiquez un secteur.")
      .max(80, "Ce secteur est trop long."),
    year: z
      .string()
      .trim()
      .min(1, "Indiquez une année.")
      .max(9, "Cette année est trop longue."),
    badge: z
      .string()
      .trim()
      .max(160, "Cette étiquette est trop longue.")
      .optional(),
    teaser: z.string().trim().max(1200, "Ce résumé est trop long.").optional(),
    summary: z.string().trim().max(600, "Ce résumé est trop long.").optional(),
    figure: z.string().trim().max(40, "Ce chiffre est trop long.").optional(),
    measure: z
      .string()
      .trim()
      .max(160, "Cette mesure est trop longue.")
      .optional(),
    halo: z.enum(["warm", "cool"]),
    accent: z.enum(["brand", "info"]),
    featured: z.boolean(),
    wide: z.boolean(),
    resultsLabel: z
      .string()
      .trim()
      .max(160, "Ce libellé est trop long.")
      .optional(),
    testimonialQuote: z
      .string()
      .trim()
      .max(1200, "Ce verbatim est trop long.")
      .optional(),
    testimonialName: z
      .string()
      .trim()
      .max(120, "Ce nom est trop long.")
      .optional(),
    testimonialRole: z
      .string()
      .trim()
      .max(160, "Ce rôle est trop long.")
      .optional(),
    testimonialInitials: z
      .string()
      .trim()
      .max(4, "Deux lettres suffisent.")
      .optional(),
    heroMediaId: z
      .string()
      .regex(/^[0-9a-f]{32}$/, "Média inconnu.")
      .nullable()
      .optional(),
  })
  .refine(
    (values) => {
      const parts = [
        values.testimonialQuote,
        values.testimonialName,
        values.testimonialRole,
      ].map((value) => Boolean(value?.trim()))
      // Tout ou rien : aucun rempli, ou les trois.
      return parts.every(Boolean) || parts.every((filled) => !filled)
    },
    {
      path: ["testimonialName"],
      message:
        "Un témoignage a besoin de son verbatim, de son auteur et de son rôle.",
    }
  )

export type CaseInput = z.infer<typeof caseSchema>

export const chaptersSchema = z.object({
  items: z.array(chapterSchema).max(30, "Trente chapitres suffisent."),
})
export const resultsSchema = z.object({
  items: z.array(resultSchema).max(12, "Douze résultats suffisent."),
})
export const metaListSchema = z.object({
  items: z.array(metaSchema).max(20, "Vingt lignes suffisent."),
})
export const lessonsSchema = z.object({
  items: z.array(lessonSchema).max(20, "Vingt enseignements suffisent."),
})
export const galleryListSchema = z.object({
  items: z.array(gallerySchema).max(24, "Vingt-quatre images suffisent."),
})

/** Réordonnancement de la grille. */
export const reorderSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().regex(/^[0-9a-f]{32}$/),
        position: z.number().int().min(0).max(100000),
      })
    )
    .max(500),
})

/**
 * Signature d'un téléversement. Les mêmes bornes que `lib/s3.ts`, exprimées ici
 * pour que le navigateur refuse tôt ce que le serveur refuserait de toute façon.
 */
export const uploadSchema = z.object({
  mimeType: z.enum([
    "image/webp",
    "image/avif",
    "image/png",
    "image/jpeg",
    "image/svg+xml",
  ]),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024, "Ce fichier dépasse 8 Mo."),
  originalName: z.string().trim().min(1).max(300),
  checksum: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional(),
  alt: z.string().trim().max(300).optional(),
})

export type UploadInput = z.infer<typeof uploadSchema>
