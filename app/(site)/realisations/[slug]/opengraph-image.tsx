import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og"
import { getPublicCase } from "@/lib/db/public-cases"

/**
 * La carte de partage d'une réalisation, quand elle n'a pas d'image de tête.
 *
 * Elle **ne s'affiche que dans ce cas** : une fiche qui porte une couverture la donne en
 * carte de partage, écrite explicitement par `generateMetadata`, ce qui prend le pas sur
 * cette convention de fichier. Une capture de l'interface livrée vaut mieux qu'un titre.
 */
export const alt = "Réalisation Heliara"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image(props: PageProps<"/realisations/[slug]">) {
  const { slug } = await props.params
  const study = await getPublicCase(slug)

  return ogCard({
    eyebrow: study?.sector ?? "Réalisation",
    // Le titre court, et non le titre du hero : celui-ci porte souvent le résultat en
    // une phrase entière, trop longue pour une vignette lue en passant.
    title: study?.title ?? "Réalisation",
  })
}
