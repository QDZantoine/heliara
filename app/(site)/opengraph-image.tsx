import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og"
import { site } from "@/lib/site"

/**
 * La carte de partage par défaut, pour toute page qui n'en déclare pas d'autre.
 *
 * Posée à la racine et non dans `(site)` : les groupes de routes ne changent pas les URL,
 * mais la convention de fichier remonte l'arbre des segments, et la racine est le seul
 * endroit qui couvre **toute** page. L'administration l'hérite aussi, sans conséquence -
 * ses routes répondent 404 sur le déploiement public et ne se partagent pas.
 *
 * Elle porte la baseline plutôt qu'un titre de page, puisqu'elle sert justement là où l'on
 * ne sait pas de quelle page il s'agit.
 */
export const alt = `${site.name} - ${site.baseline}`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogCard({ title: "Votre métier, traduit en produit" })
}
