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
 * **`SITE_ORIGIN` d'abord, et c'est le point important.** Sans préfixe `NEXT_PUBLIC_`,
 * la variable est lue **à l'exécution** : une même image applicative peut donc servir
 * plusieurs origines sans être reconstruite. `NEXT_PUBLIC_SITE_ORIGIN` est figé dans le
 * bundle au moment du build, ce qui est nécessaire pour les liens rendus côté client dans
 * l'administration, mais inutilisable pour un hôte qu'on ne connaît pas encore.
 *
 * **Réserve à connaître** : les pages sont prérendues, donc le HTML des premières requêtes
 * porte la valeur du build. Elle est reprise au premier `revalidate` - une minute. Pour
 * que ce soit juste dès la première requête, régler la variable au build aussi.
 *
 * **Le repli est le domaine de production**, jamais l'hôte courant. Une origine devinée
 * depuis l'en-tête `Host` se laisserait dicter par l'appelant, et un `canonical` que
 * l'appelant choisit est une porte ouverte à l'empoisonnement d'index.
 */
export function siteOrigin(): string {
  const configured =
    process.env.SITE_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_ORIGIN
  return configured ? configured.replace(/\/+$/, "") : site.url
}
