import { getVCard, vcardFilename, vcardSlugs, vcardText } from "@/lib/vcards"

/**
 * Le fichier de contact d'une carte de visite.
 *
 * **Une route et non un fichier statique dans `public/`** : la photo et le site partent en
 * URL absolue, donc le contenu dépend de l'origine servie, et un fichier figé annoncerait
 * `heliara.fr` depuis une préproduction. C'est le même raisonnement que pour `llms.txt`.
 *
 * **`Content-Disposition: attachment` est ce qui fait fonctionner le bouton.** Sans lui,
 * iOS affiche le texte du fichier dans Safari au lieu de proposer « Ajouter aux
 * contacts », et Android l'ouvre dans un éditeur. Le type MIME seul ne suffit pas.
 *
 * **Le nom de fichier est celui que verra le destinataire** dans ses téléchargements :
 * `antoine-heliara.vcf` se retrouve, `card.vcf` non.
 *
 * Prérendue : le contenu ne dépend que du dépôt, et une carte de visite doit s'ouvrir
 * instantanément - c'est souvent le premier geste après une poignée de main, sur un
 * réseau mobile.
 */
export const dynamic = "force-static"

export async function generateStaticParams() {
  return vcardSlugs().map((slug) => ({ slug }))
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const card = getVCard(slug)

  if (!card) {
    // 404 en texte : ce que lira un navigateur qui a suivi un lien périmé.
    return new Response("Carte inconnue.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    })
  }

  return new Response(vcardText(card), {
    headers: {
      "content-type": "text/vcard; charset=utf-8",
      "content-disposition": `attachment; filename="${vcardFilename(card)}"`,
      // Une journée : le fichier ne change qu'avec un déploiement, et une carte
      // partagée peut être rouverte plusieurs fois de suite.
      "cache-control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
