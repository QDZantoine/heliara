import Script from "next/script"

import { umamiConfig } from "@/lib/analytics"

/**
 * Le script de mesure d'audience, sur les pages publiques uniquement.
 *
 * **Rendu par `SiteChrome`, et c'est le seul endroit qui convient.** Le layout racine
 * couvrirait aussi l'administration, dont le trafic n'a aucun intérêt statistique et dont
 * les URL portent des identifiants de contenu. Le layout du groupe `(site)` laisserait de
 * côté `app/not-found.tsx`, qui vit hors du groupe. `SiteChrome` est exactement l'union des
 * deux, et rien de plus.
 *
 * **`afterInteractive`**, la seule stratégie disponible ici : `beforeInteractive` n'est
 * acceptée que dans le layout racine, qui couvrirait l'administration. Une mesure
 * d'audience ne doit de toute façon jamais retarder l'affichage.
 *
 * **Le coût, mesuré dans le HTML produit :** Next pose un `<link rel="preload">` dans le
 * `<head>`, donc le script est téléchargé tôt, mais la balise n'est créée qu'après
 * l'hydratation. Une visite abandonnée avant l'hydratation n'est donc pas comptée. C'est
 * accepté : les chiffres d'Umami seront légèrement en dessous du trafic réel, et un
 * `<script defer>` posé à la main dans le corps ne se dédoublonnerait pas aussi
 * proprement en navigation client - or `PageCurtain` navigue sans rechargement de page.
 *
 * Les navigations internes sont bien comptées : le script d'Umami écoute `pushState`.
 *
 * Configuration absente, ce composant ne rend rien - voir `umamiConfig`.
 */
export function Umami() {
  const config = umamiConfig()

  if (!config) {
    return null
  }

  return (
    <Script
      src={config.src}
      data-website-id={config.websiteId}
      strategy="afterInteractive"
    />
  )
}
