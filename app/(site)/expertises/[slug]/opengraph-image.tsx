import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og"
import { getPublicService } from "@/lib/db/public-expertises"

/**
 * La carte de partage d'une page d'expertise.
 *
 * Ces pages n'ont pas d'image de tête - c'est une décision, pas un manque : une page
 * d'expertise vend la conception et non un projet, et y poser la capture d'un site client
 * réintroduirait le registre dont on les a sorties. La carte générée est donc la seule.
 */
export const alt = "Expertise Heliara"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image(props: PageProps<"/expertises/[slug]">) {
  const { slug } = await props.params
  const service = await getPublicService(slug)

  return ogCard({
    eyebrow: service?.familyLabel ?? "Expertise",
    title: service?.title ?? "Expertise",
  })
}
