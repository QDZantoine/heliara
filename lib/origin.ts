import { site } from "@/lib/site"

/**
 * L'origine que ce déploiement sert, et la seule source de vérité pour les URL absolues.
 *
 * **Le défaut que cette fonction corrige.** Les métadonnées étaient bâties sur
 * `site.url`, c'est-à-dire `https://heliara.fr` en dur. Sur un déploiement d'essai - un
 * hôte `sslip.io`, une préproduction, un aperçu - la page se servait correctement mais
 * annonçait des URL absolues vers un domaine qui ne répondait pas encore. Conséquence
 * observée : **aucun aperçu de lien**, puisque WhatsApp allait chercher
 * `https://heliara.fr/opengraph-image-…` et ne trouvait rien, alors que la même image
 * répondait 200 sur l'hôte réel. Rien ne le signalait - les balises étaient bien là et
 * bien formées, elles pointaient simplement ailleurs.
 *
 * C'est aussi ce qui rendait faux, sur un tel hôte, le `canonical`, le plan du site,
 * l'adresse du sitemap dans `robots.txt`, les `@id` des données structurées et les liens
 * de `llms.txt`.
 *
 * **`SITE_ORIGIN`, sans préfixe `NEXT_PUBLIC_`**, donc lue **à l'exécution** : une même
 * image applicative peut servir plusieurs origines sans être reconstruite.
 *
 * **Réserve à connaître** : les pages sont prérendues, donc le HTML des premières requêtes
 * porte la valeur du build. Elle est reprise au premier `revalidate` - une minute. Pour
 * que ce soit juste dès la première requête, régler la variable au build aussi.
 *
 * **`NEXT_PUBLIC_SITE_ORIGIN` n'est délibérément pas lue ici**, alors qu'elle désigne à peu
 * près la même chose. Cette variable sert les liens de l'administration vers le site
 * public, et **vaut `http://localhost:3000` en développement** : la lire ferait qu'un build
 * de production lancé sur une machine de développement - donc avec un `.env` local présent -
 * produirait des canoniques vers `localhost`. Vérifié, c'est bien ce qui arrivait. Un
 * canonique faux est un défaut que personne ne remarque, et deux variables qui se
 * ressemblent ne sont pas une raison de les confondre.
 *
 * **Le repli est le domaine de production**, jamais l'hôte courant. Deux raisons. Un oubli
 * de configuration dégrade alors vers la bonne valeur plutôt que vers `localhost` - c'est
 * le même principe que le rôle `read` par défaut de `HELIARA_ROLE`. Et une origine devinée
 * depuis l'en-tête `Host` se laisserait dicter par l'appelant : un `canonical` choisi par
 * l'appelant est une porte ouverte à l'empoisonnement d'index.
 */
export function siteOrigin(): string {
  const configured = process.env.SITE_ORIGIN
  return configured ? configured.replace(/\/+$/, "") : site.url
}
