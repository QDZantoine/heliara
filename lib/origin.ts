import { site } from "@/lib/site"

/**
 * L'origine que ce déploiement sert, et la seule source de vérité pour les URL absolues :
 * canonique, OpenGraph, plan du site, `robots.txt`, `llms.txt`, `@id` du graphe schema.org.
 *
 * Trois choses à ne pas défaire. Le détail du défaut d'origine - des aperçus de lien vides
 * sur un hôte d'essai, parce que les balises pointaient vers `heliara.fr` - est dans
 * `CLAUDE.md`.
 *
 * - **Pas de préfixe `NEXT_PUBLIC_`**, donc lue à l'exécution : une même image applicative
 *   sert plusieurs origines sans reconstruction. Réserve : les pages étant prérendues, le
 *   HTML des premières requêtes porte la valeur du build - la régler au build aussi.
 * - **`NEXT_PUBLIC_SITE_ORIGIN` n'est pas lue ici**, bien qu'elle désigne presque la même
 *   chose : elle vaut `http://localhost:3000` en développement, et un build de production
 *   lancé sur un poste de développement produirait alors des canoniques vers `localhost`.
 *   Vérifié.
 * - **Le repli est le domaine de production, jamais l'en-tête `Host`.** Un oubli dégrade
 *   vers la bonne valeur, et une origine dictée par l'appelant ouvre la porte à
 *   l'empoisonnement d'index.
 */
export function siteOrigin(): string {
  const configured = process.env.SITE_ORIGIN
  return configured ? configured.replace(/\/+$/, "") : site.url
}
