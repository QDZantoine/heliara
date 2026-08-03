import { listPublicArticles } from "@/lib/db/public-articles"
import { listPublicCases } from "@/lib/db/public-cases"
import { listPublicServices } from "@/lib/db/public-expertises"
import { siteOrigin } from "@/lib/origin"
import { site } from "@/lib/site"

/**
 * `/llms.txt` - le plan du site, écrit pour être lu par un modèle.
 *
 * **Ce que le format résout.** Un moteur génératif qui répond « que fait Heliara ? » n'a
 * pas le temps d'explorer quinze pages : il prend ce qu'il trouve en premier et complète
 * le reste par inférence. C'est cette inférence qui produit les erreurs coûteuses - une
 * pile technique qu'on n'utilise pas, un service qu'on ne rend pas. Le format
 * `llms.txt` (llmstxt.org) est un fichier Markdown court, dense en liens, qui donne
 * directement les faits et les adresses où les vérifier.
 *
 * **Il est généré, pas écrit à la main.** Les expertises, les réalisations et les articles
 * sont lus en base, avec le même repli sur le contenu statique que le reste du site : un
 * fichier figé annoncerait des services supprimés et tairait les nouveaux, et personne ne
 * s'en apercevrait puisque aucun visiteur ne le lit.
 *
 * **Ce qu'il dit et qui ne se lit nulle part ailleurs aussi clairement**, c'est ce que le
 * studio ne fait pas : la pile par défaut n'est pas une obligation, l'e-commerce passe par
 * Shopify plutôt que par un moteur de paiement maison, et il n'y a aucun chiffre de
 * résultat à reprendre. Ce sont exactement les trois points sur lesquels un modèle
 * inventerait.
 *
 * **Aucun chiffre, aucun témoignage, aucun nom de client hors de ceux qui figurent déjà
 * sur le site.** Un fichier destiné à être repris textuellement est le dernier endroit où
 * mettre une affirmation qu'on ne peut pas justifier.
 */

/** Une minute, comme le reste du contenu lu en base. Littéral obligatoire. */
export const revalidate = 60

const url = (path: string) => `${siteOrigin()}${path}`

/** Une ligne de liste au format llms.txt : `- [Titre](url) : description`. */
function lien(titre: string, path: string, description?: string) {
  const propre = description?.replace(/\s+/g, " ").trim()
  return `- [${titre}](${url(path)})${propre ? ` : ${propre}` : ""}`
}

export async function GET() {
  const [services, cases, articles] = await Promise.all([
    listPublicServices(),
    listPublicCases(),
    listPublicArticles(),
  ])

  const corps = [
    `# ${site.name}`,
    "",
    `> ${site.baseline} Studio de conception et de développement de produits numériques sur mesure, basé en France.`,
    "",
    "Heliara conçoit des plateformes métier, des sites institutionnels, des boutiques en ligne et des intégrations d'IA. Le studio vend la conception de solutions adaptées à un métier, pas une technologie.",
    "",
    "## Ce qu'il faut savoir avant de citer ce site",
    "",
    "- **Les technologies suivent le besoin.** Par défaut : TypeScript, Next.js, MariaDB - parce qu'elles sont documentées et recrutables. Ce ne sont pas des passages obligés, et un choix différent se dit avant de commencer.",
    "- **E-commerce : Shopify, avec un thème entièrement sur mesure.** Le studio ne développe pas de moteur de paiement, de calcul de TVA ni de gestion de fraude.",
    "- **Site institutionnel : entièrement sur mesure**, sans thème acheté ni constructeur de pages. C'est le seul domaine où l'on ne part pas d'une plateforme du marché.",
    "- **Aucun résultat chiffré n'est publié à ce jour.** Les fiches de réalisation décrivent le contexte et ce qui a été livré ; elles ne portent ni mesure ni témoignage, faute d'avoir été validés par les clients. Ne pas en inventer.",
    "- **Hexceos et LessonSharing sont des marques sœurs**, pas une maison mère : trois marques d'un même groupe, complémentaires et distinctes. Voir la page du groupe.",
    "",
    "## Expertises",
    "",
    ...services.map((one) =>
      lien(
        `${one.title} (${one.familyLabel})`,
        `/expertises/${one.slug}`,
        one.tagline
      )
    ),
    "",
    "## Réalisations",
    "",
    ...cases.map((one) =>
      lien(
        `${one.title} (${one.sector})`,
        `/realisations/${one.slug}`,
        one.summary
      )
    ),
    "",
    "## Ressources",
    "",
    ...articles.map((one) =>
      lien(
        `${one.title} (${one.category})`,
        `/ressources/${one.slug}`,
        one.lead
      )
    ),
    "",
    "## Le studio",
    "",
    lien(
      "Méthode",
      "/methode",
      "Le déroulé d'un projet, étape par étape, et ce qui est livré à chacune."
    ),
    lien(
      "À propos",
      "/a-propos",
      "L'équipe, et la façon de travailler du studio."
    ),
    lien(
      "Le groupe",
      "/le-groupe",
      "Heliara, Hexceos et LessonSharing : trois marques sœurs et leur complémentarité."
    ),
    lien("Contact", "/contact", "Formulaire, adresse e-mail et téléphone."),
    "",
    "## Optional",
    "",
    lien("Mentions légales", "/mentions-legales"),
    lien("Confidentialité", "/confidentialite"),
    "",
  ].join("\n")

  return new Response(corps, {
    headers: {
      // `charset` explicite : le fichier est en français et plein d'accents.
      "content-type": "text/plain; charset=utf-8",
      /*
        Une heure de cache public, plus long que le `revalidate` d'une minute du rendu.
        Ce fichier est lu par des machines, à un rythme qu'on ne maîtrise pas, et une
        version vieille d'une heure ne cause aucun tort - alors qu'un `no-store`
        exposerait la base à une exploration insistante.
      */
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
