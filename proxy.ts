import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth/cookie"

/**
 * Proxy - c'est le nouveau nom du middleware depuis Next 16.
 *
 * Il porte deux choses, et rien de plus.
 *
 * **1. La frontière entre les deux déploiements.**
 *
 * Le même code sert deux processus, distingués par `HELIARA_ROLE` :
 *
 *   `read`  sur le port 3000, exposé publiquement. `/admin` y répond 404, pas 403 :
 *           un 403 confirmerait qu'une administration existe à cette adresse.
 *   `write` sur le port 3001, joignable par VPN seulement. Il ne sert que
 *           `/admin` ; tout le reste y répond 404, pour qu'une URL publique
 *           divulguée ne serve pas de porte d'entrée. Seule `/` y fait exception
 *           et redirige vers `/admin` - voir le détail plus bas.
 *
 * Ce n'est que la première des trois barrières, et la plus faible. Les deux autres
 * sont dans `lib/db/pool.ts` : le pool d'écriture refuse de s'ouvrir hors du rôle
 * `write`, et le déploiement de lecture ne reçoit pas `DB_WRITE_PASSWORD`. Un
 * défaut dans ce fichier ne suffit donc pas à rendre une écriture possible.
 *
 * **2. Un contrôle optimiste de session, et pas davantage.**
 *
 * La documentation de Next est explicite : le proxy ne doit pas porter la gestion
 * de session ni l'autorisation. Il ne regarde que la présence du cookie, pour
 * éviter un aller-retour inutile vers une page qui redirigerait de toute façon.
 * **L'autorisation réelle vit dans `app/admin/(protected)/layout.tsx`**, qui
 * interroge la base, et dans chaque action serveur, qui la revérifie - une action
 * serveur est une route publique, atteignable sans passer par la moindre page.
 */

const isWriteRole = process.env.HELIARA_ROLE === "write"

/** Renvoie 404 sans révéler qu'une route existe ailleurs. */
function notFound() {
  return new NextResponse(null, { status: 404 })
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/")

  if (isWriteRole) {
    /*
      La racine mène à l'administration, et c'est la seule exception au 404.

      Sur ce déploiement, `/` est la porte que tout le monde pousse en premier - on
      tape un domaine, pas un chemin - et il n'y a rien d'autre à y servir. Un 404 y
      était juste au sens strict et impraticable au quotidien.

      **Une redirection et non une réécriture** : l'adresse affichée devient celle où
      l'on est, donc l'onglet se met en favori correctement et la page de connexion
      reçoit sa `suite` au tour suivant.

      Rien n'est divulgué par là : l'existence d'une administration sur un domaine qui
      s'appelle `admin.` n'est pas un secret, et **tout autre chemin continue de
      répondre 404** - c'est ce qui compte, puisque le risque visé est l'URL publique
      recopiée par erreur sur ce déploiement.
    */
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    // Le déploiement d'administration ne sert que l'administration.
    if (!isAdminPath) {
      return notFound()
    }
  } else if (isAdminPath) {
    // Le déploiement public ne sert jamais l'administration.
    return notFound()
  }

  // Contrôle optimiste : cookie absent sur une page protégée, on redirige tout de
  // suite. La page de connexion et les fichiers statiques en sont exclus.
  if (isAdminPath && pathname !== "/admin/login") {
    if (!request.cookies.has(SESSION_COOKIE)) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      // On garde la destination pour y revenir après connexion.
      url.searchParams.set("suite", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  /**
   * Tout sauf les ressources statiques et l'optimiseur d'images. Le proxy doit
   * voir `/admin` comme le reste : c'est lui qui décide de son existence.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico)$).*)",
  ],
}
