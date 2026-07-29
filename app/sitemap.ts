import type { MetadataRoute } from "next"

import { listPublicArticleSlugs } from "@/lib/db/public-articles"
import { listPublicCaseSlugs } from "@/lib/db/public-cases"
import { expertiseServices } from "@/lib/content/expertises"
import { site } from "@/lib/site"

/**
 * Plan du site. Les pages légales en sont absentes : elles portent
 * `robots: { index: false }`, il serait contradictoire de les déclarer ici.
 *
 * Les priorités suivent l'architecture UX : l'accueil et la preuve d'abord, le
 * contact ensuite, l'éditorial en dernier.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${site.url}${path}`

  const staticPages = [
    { path: "/", priority: 1 },
    { path: "/realisations", priority: 0.9 },
    { path: "/expertises", priority: 0.9 },
    { path: "/methode", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/a-propos", priority: 0.7 },
    { path: "/ressources", priority: 0.7 },
    { path: "/le-groupe", priority: 0.5 },
  ]

  return [
    ...staticPages.map(({ path, priority }) => ({
      url: url(path),
      changeFrequency: "monthly" as const,
      priority,
    })),
    // Les réalisations viennent de la base, avec repli sur le contenu statique :
    // le plan du site ne doit pas se vider parce que la base n'a pas répondu.
    ...(await listPublicCaseSlugs()).map((slug) => ({
      url: url(`/realisations/${slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    ...expertiseServices.map((service) => ({
      url: url(`/expertises/${service.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Les articles aussi, même repli. `lastModified` vient de la date de
    // publication, que la procédure des slugs rend déjà : rien à charger de plus.
    ...(await listPublicArticleSlugs()).map((item) => ({
      url: url(`/ressources/${item.slug}`),
      lastModified: new Date(item.publishedOn),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ]
}
