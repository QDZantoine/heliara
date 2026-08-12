import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SESSION_COOKIE } from "@/lib/auth/cookie"

/**
 * La frontière entre les deux déploiements.
 *
 * **Le rôle est lu au chargement du module**, pas à chaque requête : un proxy
 * s'exécute sur toutes les requêtes, et relire l'environnement à chaque fois
 * n'apporterait rien. Chaque cas doit donc poser `HELIARA_ROLE` puis importer le
 * module à neuf - d'où `vi.resetModules()` et l'import dynamique.
 */
async function chargerProxy(role: string | undefined) {
  vi.resetModules()
  if (role === undefined) {
    delete process.env.HELIARA_ROLE
  } else {
    process.env.HELIARA_ROLE = role
  }
  const charge = await import("@/proxy")
  return charge.proxy
}

/** Une requête vers ce chemin, avec ou sans cookie de session. */
function requete(pathname: string, { session = false } = {}) {
  const request = new NextRequest(new URL(`https://exemple.test${pathname}`))
  if (session) {
    request.cookies.set(SESSION_COOKIE, "jeton")
  }
  return request
}

const roleInitial = process.env.HELIARA_ROLE

afterEach(() => {
  if (roleInitial === undefined) {
    delete process.env.HELIARA_ROLE
  } else {
    process.env.HELIARA_ROLE = roleInitial
  }
})

describe("proxy, rôle write", () => {
  it("mène la racine à /admin plutôt que de la refuser", async () => {
    // Sur ce deploiement, `/` est la porte que tout le monde pousse en premier :
    // on tape un domaine, pas un chemin.
    const proxy = await chargerProxy("write")
    const reponse = proxy(requete("/"))

    expect(reponse.status).toBe(307)
    expect(new URL(reponse.headers.get("location") ?? "").pathname).toBe(
      "/admin"
    )
  })

  it("refuse tout autre chemin hors administration, en 404 et non en 403", async () => {
    // Un 403 confirmerait qu'une administration existe a cette adresse.
    const proxy = await chargerProxy("write")

    for (const chemin of [
      "/realisations",
      "/contact",
      "/adminis",
      "/le-groupe",
    ]) {
      expect(proxy(requete(chemin)).status, chemin).toBe(404)
    }
  })

  it("laisse passer l'administration quand la session est présente", async () => {
    const proxy = await chargerProxy("write")
    const reponse = proxy(requete("/admin", { session: true }))

    expect(reponse.status).toBe(200)
    expect(reponse.headers.get("location")).toBeNull()
  })

  it("renvoie vers la connexion sans cookie, en gardant la destination", async () => {
    const proxy = await chargerProxy("write")
    const url = new URL(
      proxy(requete("/admin/realisations")).headers.get("location") ?? ""
    )

    expect(url.pathname).toBe("/admin/login")
    expect(url.searchParams.get("suite")).toBe("/admin/realisations")
  })

  it("laisse la page de connexion atteignable sans cookie", async () => {
    const proxy = await chargerProxy("write")
    expect(proxy(requete("/admin/login")).status).toBe(200)
  })
})

describe("proxy, rôle read", () => {
  it("sert la racine sans redirection : la redirection est propre à l'administration", async () => {
    const proxy = await chargerProxy("read")
    const reponse = proxy(requete("/"))

    expect(reponse.status).toBe(200)
    expect(reponse.headers.get("location")).toBeNull()
  })

  it("refuse l'administration", async () => {
    const proxy = await chargerProxy("read")
    expect(proxy(requete("/admin")).status).toBe(404)
    expect(proxy(requete("/admin/login")).status).toBe(404)
  })

  it("est le comportement par défaut : un oubli dégrade vers moins de droits", async () => {
    const proxy = await chargerProxy(undefined)
    expect(proxy(requete("/admin")).status).toBe(404)
    expect(proxy(requete("/")).status).toBe(200)
  })
})
