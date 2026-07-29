/**
 * Chargement partagé du lecteur Lottie.
 *
 * `lottie_light` suffit : aucune de nos illustrations n'utilise d'expressions,
 * et la variante complète pèse près de 140 ko de plus. L'import est dynamique et
 * mémorisé, si bien que les plusieurs usages du site (transition de page,
 * sélecteur de thème) se partagent un seul chargement et un seul chunk.
 */

let loader: Promise<
  typeof import("lottie-web/build/player/lottie_light").default
> | null = null

export function loadLottie() {
  loader ??= import("lottie-web/build/player/lottie_light").then(
    (module) => module.default
  )
  return loader
}

/** Charge une illustration depuis `public/`, une seule fois par URL. */
const documents = new Map<string, Promise<unknown>>()

export function loadLottieData(url: string) {
  let data = documents.get(url)
  if (!data) {
    data = fetch(url).then((response) => response.json())
    documents.set(url, data)
  }
  return data
}

/**
 * Diffère un travail jusqu'à ce que le navigateur soit inoccupé, avec repli sur
 * un délai pour Safari, qui n'implémente pas `requestIdleCallback`.
 * Retourne la fonction d'annulation.
 */
export function whenIdle(work: () => void, timeout = 3000) {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(work, { timeout })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(work, Math.min(timeout, 1200))
  return () => window.clearTimeout(handle)
}
