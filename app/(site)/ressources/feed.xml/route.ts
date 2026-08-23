import { articleHref } from "@/lib/content/articles"
import { listPublicArticles } from "@/lib/db/public-articles"
import { siteOrigin } from "@/lib/origin"
import { site } from "@/lib/site"

/**
 * Le flux RSS des ressources.
 *
 * **Ce qu'il apporte, et que le reste du référencement ne donne pas.** Tout ce qui
 * précède attend qu'on vienne : un flux, lui, part. Il est repris par les lecteurs de
 * flux, par les agrégateurs de veille, par les automatisations d'équipes qui suivent un
 * sujet, et par plusieurs explorateurs qui s'en servent pour repérer une publication
 * sans reparcourir le site. C'est le seul canal du site qui notifie au lieu d'attendre.
 *
 * **Il est généré, avec le même repli que le reste.** Les articles sont lus en base et
 * retombent sur le contenu statique si elle ne répond pas : un flux vide dit à un
 * lecteur qu'il n'y a plus rien à lire, et certains clients cessent alors de le
 * consulter.
 *
 * **RSS 2.0 et non Atom**, sans hésitation : c'est le format que tous les clients lisent,
 * y compris les plus anciens, et il n'y a rien ici qu'Atom rendrait mieux.
 *
 * Le lien vers ce flux est déclaré par `pageMetadata({ feed })` sur `/ressources`, ce qui
 * pose le `<link rel="alternate">` que les navigateurs et les lecteurs cherchent. Un flux
 * qu'aucune page n'annonce ne se découvre pas.
 */

/** Une minute, comme le reste du contenu lu en base. Littéral obligatoire. */
export const revalidate = 60

/**
 * Les cinq caractères que XML n'accepte pas dans du texte.
 *
 * Un seul `&` non échappé rend le flux illisible **en entier** - un lecteur strict le
 * rejette au parseur, sans afficher les articles valides qui le précèdent.
 */
function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const origin = siteOrigin()
  const articles = await listPublicArticles()

  const items = articles
    .map((article) => {
      const url = `${origin}${articleHref(article.slug)}`
      return [
        "    <item>",
        `      <title>${xml(article.title)}</title>`,
        `      <link>${url}</link>`,
        // `isPermaLink` explicite : sans lui, un lecteur peut prendre le guid pour une
        // URL à visiter, et il se trouve que c'en est une - autant le dire.
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${xml(article.lead)}</description>`,
        `      <category>${xml(article.category)}</category>`,
        `      <dc:creator>${xml(article.author)}</dc:creator>`,
        `      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`,
        "    </item>",
      ].join("\n")
    })
    .join("\n")

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${xml(`Ressources - ${site.name}`)}</title>`,
    `    <link>${origin}/ressources</link>`,
    `    <description>${xml("Guides, analyses et retours d’expérience du studio Heliara.")}</description>`,
    "    <language>fr-FR</language>",
    // L'auto-référence que la spécification demande : c'est ce qui permet à un client
    // de retrouver l'adresse du flux quand il n'a que son contenu.
    `    <atom:link href="${origin}/ressources/feed.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n")

  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      // Une heure, comme `llms.txt` : lu par des machines à un rythme qu'on ne
      // maîtrise pas, et une version vieille d'une heure ne cause aucun tort.
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
