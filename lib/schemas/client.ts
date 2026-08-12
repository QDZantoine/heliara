import { z } from "zod"

/**
 * Schémas des références clientes, partagés par l'écran et les actions serveur.
 *
 * Les messages sont rédigés pour être affichés tels quels, sous le champ concerné.
 * Les longueurs reprennent exactement celles des colonnes.
 */

/** Un identifiant de média, tel que la couche d'accès le rend : 32 caractères hexa. */
const mediaId = z.string().regex(/^[0-9a-f]{32}$/, "Média inconnu.")

/**
 * Création : le nom et le logo, et rien de plus.
 *
 * Une référence sans logo n'a rien à montrer dans une bande d'images - c'est le seul
 * champ dont l'absence rend l'entrée inutile. La forme et le site s'ajustent ensuite.
 */
export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indiquez le nom du client.")
    .max(120, "Ce nom est trop long."),
  logoMediaId: mediaId,
})

export type CreateClientInput = z.infer<typeof createClientSchema>

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indiquez le nom du client.")
    .max(120, "Ce nom est trop long."),
  logoMediaId: mediaId,
  /**
   * La seconde variante, pour une marque monochrome.
   *
   * `null` est la valeur courante : un logo en couleur se lit sur les deux fonds. Ne
   * jamais la fabriquer en inversant la première - `invert` produit une couleur que la
   * marque n'a pas.
   */
  logoDarkMediaId: mediaId.nullable().optional(),
  shape: z.enum(["wide", "square"]),
  /**
   * Le site du client, vers lequel son logo fait lien dans la bande. Il garde aussi la
   * provenance de chaque référence traçable, ce qui compte le jour où il faut redemander
   * une autorisation.
   *
   * **Le laisser vide est admis et n'a rien d'un défaut** : la bande rend alors le logo
   * sans ancre. C'est ce qui permet d'afficher une référence dont on n'a pas l'adresse
   * plutôt que de fabriquer un lien mort.
   *
   * Une URL et non du texte libre : c'est ce qui rend le champ vérifiable, et la
   * saisie d'un nom de domaine sans schéma est l'erreur la plus courante.
   */
  site: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .max(300, "Cette adresse est trop longue.")
        .refine(
          (value) => /^https?:\/\/\S+\.\S+/.test(value),
          "Indiquez une adresse complète, avec https://"
        ),
    ])
    .optional(),
})

export type ClientInput = z.infer<typeof clientSchema>
