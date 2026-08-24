import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og"
import { getVCard, vcardSlugs } from "@/lib/vcards"

/**
 * La carte de partage d'une carte de visite.
 *
 * Un lien de carte se colle dans une conversation - WhatsApp, LinkedIn, un e-mail de
 * suite de rendez-vous. Sans vignette, il en sort une URL nue ; avec, il en sort un nom
 * et une marque. Le sur-titre porte le rôle, qui est ce qui situe la personne avant même
 * son nom.
 *
 * **La convention de fichier n'est pas héritée** : un `opengraph-image` posé plus haut ne
 * couvrirait pas ce segment. Voir la note du skill `referencement`.
 */
export const alt = "Carte de visite Heliara"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export async function generateStaticParams() {
  return vcardSlugs().map((slug) => ({ slug }))
}

export default async function Image(props: PageProps<"/vcard/[slug]">) {
  const { slug } = await props.params
  const card = getVCard(slug)

  return ogCard({
    eyebrow: card?.role ?? "Carte de visite",
    title: card?.fullName ?? "Heliara",
  })
}
