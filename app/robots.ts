import type { MetadataRoute } from "next"

import { siteOrigin } from "@/lib/origin"

/**
 * `robots.txt`, et les deux décisions qu'il porte par ce qu'il **ne** dit pas.
 *
 * **1. `/admin` n'y est pas interdit, et c'est volontaire.** Le réflexe est d'y mettre un
 * `Disallow: /admin`. Ce serait une régression de sécurité : `robots.txt` est un fichier
 * public, et y nommer l'administration en annoncerait l'existence à qui ne l'aurait pas
 * devinée - exactement ce que le projet évite en répondant 404 plutôt que 403 sur ces
 * adresses. Rien n'a besoin d'être interdit ici : sur le déploiement public, tout ce qui
 * commence par `/admin` répond 404, donc il n'y a rien à explorer ni à indexer.
 *
 * **2. Les explorateurs des moteurs génératifs ne sont pas bloqués**, et ils n'ont pas
 * besoin d'être nommés pour autant. `User-agent: *` avec `Allow: /` les couvre déjà tous.
 * Écrire une douzaine de règles `Allow` nominatives - GPTBot, ClaudeBot, PerplexityBot,
 * OAI-SearchBot et les autres - n'aurait **aucun effet** : ce serait du décor donnant
 * l'impression d'un réglage là où il n'y en a pas, et qu'il faudrait tenir à jour à chaque
 * nouvel agent. Les jetons d'exclusion propres à l'IA, `Google-Extended` et
 * `Applebot-Extended`, ne servent qu'à refuser : leur absence **est** l'autorisation.
 *
 * Être cité par un moteur génératif est un objectif assumé du site. Ce qui le sert
 * réellement, c'est le contenu : les données structurées de chaque page et `/llms.txt`,
 * qui en donne un plan lisible. Pas une liste d'agents dans ce fichier.
 *
 * Si l'entraînement de modèles devait un jour être refusé - décision commerciale et non
 * technique - c'est ici que les `Disallow` nominatifs viendraient, avec la liste des
 * agents visés.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  }
}
