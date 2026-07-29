import { z } from "zod"

import { slugSchema } from "@/lib/schemas/case"

/**
 * Schémas des expertises, partagés par les formulaires d'administration et les
 * actions serveur qui les rejouent.
 */

/** Une barre du croquis d'illustration, en pourcentage de largeur. */
const sketchLine = z.coerce
  .number()
  .int()
  .min(1, "Entre 1 et 100.")
  .max(100, "Entre 1 et 100.")

export const createFamilySchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Indiquez un libellé.")
    .max(120, "Ce libellé est trop long."),
  slug: slugSchema.optional().or(z.literal("")),
})

export const familySchema = z.object({
  slug: slugSchema,
  label: z
    .string()
    .trim()
    .min(1, "Indiquez un libellé.")
    .max(120, "Ce libellé est trop long."),
  title: z.string().trim().max(200, "Ce titre est trop long.").optional(),
  summary: z.string().trim().max(1200, "Ce résumé est trop long.").optional(),
  tag: z.string().trim().max(40, "Cette étiquette est trop longue.").optional(),
  halo: z.enum(["warm", "cool"]),
  sketch1: sketchLine,
  sketch2: sketchLine,
  sketch3: sketchLine,
  /**
   * Le service vers lequel mène l'entrée de nav.
   *
   * Vide est accepté : la procédure de lecture publique retombe alors sur le premier
   * service publié de la famille, et à défaut sur le hub. Une famille qu'on vient de
   * créer n'a encore aucun service, et elle doit pouvoir exister.
   */
  navServiceSlug: z
    .string()
    .trim()
    .max(120, "Ce slug est trop long.")
    .optional()
    .or(z.literal("")),
})

export type FamilyInput = z.infer<typeof familySchema>

export const createServiceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Indiquez un titre.")
    .max(200, "Ce titre est trop long."),
  slug: slugSchema.optional().or(z.literal("")),
  familyId: z.string().regex(/^[0-9a-f]{32}$/, "Choisissez une famille."),
})

export const serviceSchema = z.object({
  slug: slugSchema,
  familyId: z.string().regex(/^[0-9a-f]{32}$/, "Choisissez une famille."),
  title: z
    .string()
    .trim()
    .min(1, "Indiquez un titre.")
    .max(200, "Ce titre est trop long."),
  tagline: z
    .string()
    .trim()
    .max(600, "Cette accroche est trop longue.")
    .optional(),
  problem: z.string().trim().max(2000, "Ce texte est trop long.").optional(),
  relatedCase: z
    .string()
    .trim()
    .max(120, "Ce slug est trop long.")
    .optional()
    .or(z.literal("")),
  ctaTitle: z.string().trim().max(160, "Ce libellé est trop long.").optional(),
})

export type ServiceInput = z.infer<typeof serviceSchema>

/** Livrables et choix techniques partagent la même forme : un titre, un texte. */
export const pairSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Indiquez un titre.")
    .max(200, "Ce titre est trop long."),
  text: z.string().trim().max(2000, "Ce texte est trop long.").optional(),
})

export const pairsSchema = z.object({
  items: z.array(pairSchema).max(20, "Vingt entrées suffisent."),
})

export const faqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Indiquez la question.")
    .max(300, "Cette question est trop longue."),
  answer: z
    .string()
    .trim()
    .max(2000, "Cette réponse est trop longue.")
    .optional(),
})

export const faqListSchema = z.object({
  items: z.array(faqSchema).max(20, "Vingt objections suffisent."),
})

/** Réordonnancement, commun aux familles et aux services. */
export const orderSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().regex(/^[0-9a-f]{32}$/),
        position: z.number().int().min(0).max(100000),
      })
    )
    .max(200),
})
