import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og"
import { getPublicArticle } from "@/lib/db/public-articles"

/**
 * La carte de partage d'un article, quand il n'a pas d'image de tête.
 *
 * C'est la page la plus partagée du site, et donc celle où une vignette générée compte le
 * plus : un article partagé sans carte sort en simple lien. Le sur-titre porte la
 * catégorie, qui est ce qui situe l'article avant même son titre.
 */
export const alt = "Article Heliara"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image(props: PageProps<"/ressources/[slug]">) {
  const { slug } = await props.params
  const article = await getPublicArticle(slug)

  return ogCard({
    eyebrow: article?.category ?? "Ressources",
    title: article?.title ?? "Ressources",
  })
}
