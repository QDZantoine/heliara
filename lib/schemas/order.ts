import { z } from "zod"

/**
 * Le réordonnancement d'une collection, écrit une fois.
 *
 * **Il existait en deux copies identiques**, `reorderSchema` dans les réalisations et
 * `orderSchema` dans les expertises, à la borne de longueur près. Les références
 * clientes en auraient fait une troisième. La forme n'a rien de spécifique à un
 * domaine : une liste d'identifiants et leur rang, c'est exactement ce que prend chaque
 * procédure `reorder_*`.
 *
 * Les messages ne sont pas rédigés : ce schéma ne valide jamais une saisie humaine, mais
 * une charge construite par le glisser-déposer. Un écart y est un défaut de code, pas une
 * erreur de l'utilisateur, et il se signale par « Ordre illisible ».
 */
export const orderSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().regex(/^[0-9a-f]{32}$/),
        position: z.number().int().min(0).max(100000),
      })
    )
    // Cinq cents, la plus haute des deux bornes d'origine. Aucune collection du site
    // n'en approche, et la borne n'est là que pour refuser une charge absurde.
    .max(500),
})

export type OrderInput = z.infer<typeof orderSchema>
