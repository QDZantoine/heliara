"use client"

import * as React from "react"

/**
 * Signale une lecture d'article.
 *
 * **Rien ne s'affiche** : le composant n'existe que pour son effet. Il est monté par
 * la page d'article et disparaît du rendu.
 *
 * Quatre précautions, chacune pour une raison précise :
 *
 * - **Un délai de deux secondes.** Un passage immédiat n'est pas une lecture. Le
 *   délai écarte les rebonds, et surtout les préchargements de lien, qui montent le
 *   composant sans que personne regarde.
 * - **Une fois par article et par session**, mémorisé dans `sessionStorage`. Sans
 *   cela, un rafraîchissement ou un retour arrière compterait à nouveau.
 * - **Rien si l'onglet est caché.** Un lien ouvert en arrière-plan n'est pas lu.
 * - **Rien sous automatisation** (`navigator.webdriver`) : cela n'écarte pas les
 *   robots sérieux, mais évite de compter nos propres tests.
 *
 * Le chiffre reste **approximatif et gonflable**, comme tout compteur public. Il est
 * présenté dans l'administration comme une indication de lecture, jamais comme une
 * mesure d'audience.
 */
function ViewCounter({ slug }: { slug: string }) {
  React.useEffect(() => {
    if (navigator.webdriver) {
      return
    }

    const key = `heliara.vue.${slug}`
    try {
      if (sessionStorage.getItem(key)) {
        return
      }
    } catch {
      // `sessionStorage` peut être refusé - navigation privée stricte, réglage
      // d'entreprise. On compte alors sans mémoire, ce qui est préférable à ne
      // rien compter du tout.
    }

    const timer = setTimeout(() => {
      if (document.visibilityState !== "visible") {
        return
      }

      try {
        sessionStorage.setItem(key, "1")
      } catch {
        // Voir plus haut.
      }

      // `keepalive` : la requête aboutit même si la page est quittée dans
      // l'intervalle, ce qui est fréquent sur un article long.
      fetch("/api/vues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => {
        // Un compteur qui échoue ne doit rien casser, et n'a rien à dire.
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [slug])

  return null
}

export { ViewCounter }
