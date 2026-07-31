import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og"

/**
 * La carte de partage de la page.
 *
 * **Un fichier par segment, et ce n'est pas de la redondance** : la convention
 * `opengraph-image` s'applique au segment où elle est posée et **n'est pas héritée** par
 * ses enfants. Mesuré - une carte unique à la racine ne couvrait que l'accueil, toutes les
 * autres pages sortaient sans vignette. Chaque page porte donc la sienne, ce qui lui vaut
 * au passage son propre titre plutôt qu'une baseline générique.
 *
 * Le titre reprend celui du hero de la page. Il y est écrit une seconde fois plutôt
 * qu'importé : les deux peuvent légitimement diverger, la carte étant lue hors contexte
 * et devant tenir sur trois lignes.
 */
export const alt = "Méthode - Heliara"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return ogCard({
    eyebrow: "Méthode",
    title:
      "Le risque projet n'est pas une fatalité. C'est un défaut de méthode",
  })
}
