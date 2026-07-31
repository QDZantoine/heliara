import type { Metadata } from "next"

import { NotFoundView } from "@/components/sections/not-found-view"

/**
 * La page 404 des `notFound()` levés dans une page du site - un slug de réalisation,
 * d'article ou d'expertise qui n'existe pas ou n'est pas publié.
 *
 * **Elle ne pose pas de chrome, contrairement à celle de la racine.** L'URL correspond
 * ici à une route existante, donc les layouts de l'arbre s'appliquent : le layout du
 * groupe `(site)` fournit déjà en-tête et pied de page. Sans ce fichier, Next remontait
 * jusqu'à `app/not-found.tsx`, qui pose son propre chrome par-dessus celui du groupe -
 * mesuré dans le DOM : **deux en-têtes, deux pieds de page et deux `<main>`**. Le défaut
 * ne se voit pas à la lecture du code, et pas non plus au premier coup d'œil à l'écran.
 *
 * Les deux points d'entrée rendent la même vue : un visiteur ne doit pas voir deux écrans
 * différents selon la façon dont il s'est perdu.
 */
export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return <NotFoundView />
}
