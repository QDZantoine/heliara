/**
 * Mesure d'audience Umami.
 *
 * **Rien n'est codé en dur**, et ce n'est pas une précaution de style : l'adresse de
 * l'instance et l'identifiant du site sont propres à un déploiement. Une préproduction
 * qui les hériterait du dépôt gonflerait les chiffres de la production avec du trafic
 * d'essai, sans que rien ne le signale.
 *
 * **Sans préfixe `NEXT_PUBLIC_`, donc lues à l'exécution.** Une variable préfixée est
 * remplacée par sa valeur au moment du build : elle figerait l'instance dans l'image, et
 * il faudrait reconstruire pour la changer. Ici, `SiteChrome` est un composant serveur qui
 * les lit au rendu. Les pages étant prérendues, la valeur du build reste servie jusqu'au
 * premier `revalidate` - une minute -, comme pour `SITE_ORIGIN`.
 *
 * **Absentes, la mesure n'existe pas.** Aucune erreur, aucun script : c'est le
 * comportement voulu en développement et sur tout hôte d'essai. Une mesure d'audience est
 * la dernière chose qui doit empêcher un site de démarrer.
 */

/** L'instance et le site à mesurer, ou `null` si la mesure n'est pas configurée. */
export type UmamiConfig = {
  src: string
  websiteId: string
}

/**
 * Lit la configuration dans l'environnement, ou renvoie `null`.
 *
 * **L'URL est validée, et seul HTTPS est accepté.** Un script en `http://` sur une page
 * servie en HTTPS est du contenu mixte : les navigateurs le bloquent, la plupart sans rien
 * dire dans l'interface. Le symptôme serait une mesure d'audience simplement absente, et
 * on la chercherait du côté du serveur Umami. Mieux vaut ne rien émettre du tout.
 *
 * Une seule des deux variables renseignée est traitée comme une configuration absente :
 * un script sans identifiant de site charge du JavaScript tiers sur toutes les pages sans
 * rien mesurer.
 */
export function umamiConfig(): UmamiConfig | null {
  const src = process.env.UMAMI_SCRIPT_URL?.trim()
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim()

  if (!src || !websiteId) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(src)
  } catch {
    return null
  }

  if (parsed.protocol !== "https:") {
    return null
  }

  return { src, websiteId }
}
