import { siteOrigin } from "@/lib/origin"

/**
 * URL absolue vers le **site public**, depuis l'administration.
 *
 * Indispensable, et pas un détail de confort : les deux déploiements ne sont pas
 * sur la même origine. Un lien relatif écrit dans l'administration reste sur le
 * port d'écriture, où tout ce qui n'est pas `/admin` répond 404 - c'est
 * précisément la garantie qu'on cherche, et c'est aussi ce qui rend un lien
 * relatif inutilisable ici.
 *
 * `NEXT_PUBLIC_` est nécessaire : ces liens sont rendus par des composants
 * clients comme l'éditeur de fiche, qui n'ont pas accès à l'environnement
 * serveur. Il n'y a rien de secret dans l'adresse publique du site.
 *
 * À défaut de configuration : le port de lecture en développement, et le domaine
 * de production ailleurs. Le repli sur `site.url` est le bon défaut - se tromper
 * en pointant vers le vrai site est sans conséquence, se tromper en pointant vers
 * l'administration donne un 404.
 */
export function publicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_ORIGIN
  if (configured) {
    return configured.replace(/\/$/, "")
  }
  // En développement, le port de lecture ; ailleurs, l'origine servie par ce
  // déploiement - la même que celle des URL canoniques, voir `lib/origin.ts`.
  return process.env.NODE_ENV === "production"
    ? siteOrigin()
    : "http://localhost:3000"
}

/** Une adresse du site public, absolue. `path` commence par une barre. */
export function publicSiteUrl(path = "/"): string {
  return `${publicSiteOrigin()}${path}`
}
