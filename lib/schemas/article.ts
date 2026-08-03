import { z } from "zod"

import { requiredRichTextSchema } from "@/lib/rich-text"
import { slugSchema } from "@/lib/schemas/case"

/**
 * Schémas des articles, partagés par le formulaire d'administration et les actions
 * serveur qui les rejouent.
 *
 * Le corps reste en **blocs typés** et non en HTML : c'est ce qui permet à un
 * `callout` de porter un chapô distinct de son texte, et à un `numbered` d'afficher
 * une grille numérotée. Un unique champ de texte riche ne saurait exprimer ni l'un
 * ni l'autre, et le rendu perdrait ces deux formes.
 */

export const articleCategories = [
  "Guide",
  "Analyse",
  "Retour d'expérience",
  "Veille",
] as const

export const categorySchema = z.enum(articleCategories)

/**
 * Un bloc de corps.
 *
 * Le schéma est une union discriminée sur `kind`, ce qui fait qu'un `callout` sans
 * chapô ou un `numbered` sans entrée est refusé **par son type** plutôt que par une
 * vérification ajoutée après coup.
 */
export const blockSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("paragraph"),
    // Saisi dans l'éditeur riche, donc du HTML - validé contre la liste de ce que
    // l'éditeur sait produire. Voir `lib/rich-text.ts`.
    text: requiredRichTextSchema,
  }),
  z.object({
    kind: z.literal("heading"),
    text: z
      .string()
      .trim()
      .min(1, "Cet intertitre est vide.")
      .max(200, "Cet intertitre est trop long."),
  }),
  z.object({
    kind: z.literal("callout"),
    lead: z
      .string()
      .trim()
      .min(1, "Un encadré a besoin de sa phrase mise en exergue.")
      .max(300, "Cette phrase est trop longue."),
    // L'explication passe par l'éditeur riche, le chapô ci-dessus est un champ simple.
    text: requiredRichTextSchema,
  }),
  z.object({
    kind: z.literal("numbered"),
    items: z
      .array(
        z.object({
          num: z.string().trim().max(4, "Deux chiffres suffisent.").optional(),
          title: z
            .string()
            .trim()
            .min(1, "Chaque entrée a besoin d'un titre.")
            .max(200, "Ce titre est trop long."),
          text: z.string().trim().min(1, "Chaque entrée a besoin d'un texte."),
        })
      )
      .min(1, "Une liste numérotée a besoin d'au moins une entrée.")
      .max(20, "Vingt entrées suffisent."),
  }),
])

export type BlockInput = z.infer<typeof blockSchema>
export type BlockKind = BlockInput["kind"]

/** Création : le strict nécessaire pour ouvrir un brouillon. */
export const createArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Indiquez un titre.")
    .max(300, "Ce titre est trop long."),
  slug: slugSchema.optional().or(z.literal("")),
  category: categorySchema,
})

export type CreateArticleInput = z.infer<typeof createArticleSchema>

/**
 * Une date en ISO, telle que la base la stocke.
 *
 * `Date.parse` ne suffit pas : il accepte 2026-02-30 en le reportant au 2 mars. Le
 * contrôle porte donc sur l'aller-retour - une date qui ne se réécrit pas à
 * l'identique n'existe pas. C'est ce qui empêche une date absurde d'atteindre la
 * base, où la conversion lèverait.
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

export const articleSchema = z.object({
  slug: slugSchema,
  category: categorySchema,
  title: z
    .string()
    .trim()
    .min(1, "Indiquez un titre.")
    .max(300, "Ce titre est trop long."),
  lead: z.string().trim().max(1200, "Ce chapô est trop long.").optional(),
  author: z.string().trim().max(120, "Ce nom est trop long.").optional(),
  authorRole: z.string().trim().max(160, "Ce rôle est trop long.").optional(),
  authorInitials: z
    .string()
    .trim()
    .max(4, "Deux lettres suffisent.")
    .optional(),
  publishedOn: isoDate,
  /**
   * Le libellé affiché, en français. Séparé de la date ISO à dessein : le formater
   * en SQL dépendrait de la locale du serveur, et la formulation appartient à la
   * personne qui écrit.
   */
  dateLabel: z.string().trim().max(60, "Ce libellé est trop long.").optional(),
  readingTime: z.string().trim().max(20, "Trop long.").optional(),
  relatedCase: z
    .string()
    .trim()
    .max(120, "Ce slug est trop long.")
    .optional()
    .or(z.literal("")),
  heroMediaId: z
    .string()
    .regex(/^[0-9a-f]{32}$/, "Média inconnu.")
    .nullable()
    .optional(),
})

export type ArticleInput = z.infer<typeof articleSchema>

export const blocksSchema = z.object({
  items: z.array(blockSchema).max(80, "Quatre-vingts blocs suffisent."),
})

/**
 * Un bloc vierge, par type. Sert au bouton d'ajout du formulaire.
 * Les valeurs sont vides et non des exemples : un texte d'exemple finit publié.
 */
export function emptyBlock(kind: BlockKind): BlockInput {
  switch (kind) {
    case "heading":
      return { kind: "heading", text: "" }
    case "callout":
      return { kind: "callout", lead: "", text: "" }
    case "numbered":
      return { kind: "numbered", items: [{ num: "", title: "", text: "" }] }
    default:
      return { kind: "paragraph", text: "" }
  }
}

/** Libellés des types de bloc, pour le menu d'ajout. */
export const blockLabels: Record<BlockKind, string> = {
  paragraph: "Paragraphe",
  heading: "Intertitre",
  callout: "Encadré",
  numbered: "Liste numérotée",
}

/**
 * Le libellé français d'une date ISO, tel qu'il s'affichera.
 *
 * Calculé côté application et non en SQL : MariaDB formaterait selon la locale du
 * serveur, ce qui rendrait le résultat dépendant de sa configuration. La valeur
 * reste modifiable à la main - certaines dates méritent « été 2026 ».
 */
export function frenchDateLabel(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}
