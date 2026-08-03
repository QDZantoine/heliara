import type { Metadata } from "next"

import { SiteChrome } from "@/components/layout/site-chrome"
import { NotFoundView } from "@/components/sections/not-found-view"

/**
 * La page 404 des URL qui ne correspondent à aucune route.
 *
 * **Elle doit être à la racine de `app/`, et c'est une contrainte de Next**, vérifiée à
 * la mesure : une `not-found.tsx` posée dans le groupe `(site)` n'était utilisée pour
 * **aucun** des deux chemins - ni un lien mort, ni un slug inconnu - et Next continuait
 * de servir son écran par défaut, noir sur blanc et sans issue. Seule la racine attrape
 * les URL non résolues.
 *
 * **Elle pose donc son chrome elle-même.** À la racine, elle ne rend que dans
 * `app/layout.tsx` : le layout du groupe `(site)`, qui porte l'en-tête et le pied de
 * page, ne s'applique pas ici. `SiteChrome` a été extrait pour cela - sans quoi la 404 la
 * plus fréquente serait un écran sans le moindre chemin de retour.
 *
 * Next injecte déjà `noindex` sur toute page qui répond 404 ; le déclarer ici rend la
 * chose lisible et ne coûte rien. `follow` est conservé, les liens de la page menant vers
 * de vraies pages.
 */
export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundView />
    </SiteChrome>
  )
}
