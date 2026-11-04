import "server-only"

import { publicSiteOrigin } from "@/lib/public-url"
import { site } from "@/lib/site"

/**
 * IndexNow : signaler aux moteurs qui l'écoutent - Bing, Yandex, Naver, Seznam ; pas
 * Google - qu'une adresse vient de changer.
 *
 * Bing alimente ChatGPT Search et Copilot : une page qu'il n'a pas encore explorée n'y
 * existe pas. Sans signal, il revient sur un petit site à son rythme, en semaines.
 *
 * Le protocole tient en un appel : une clé, prouvée par un fichier à la racine du site
 * nommé d'après elle (`/<clé>.txt`, que `proxy.ts` réécrit vers `/indexnow-key.txt`), et
 * la liste des adresses. La clé vient de `INDEXNOW_KEY` ; sans elle, rien ne part.
 *
 * **Les deux processus en ont besoin** : `read` sert la preuve, `write` envoie le signal
 * depuis les actions de l'administration.
 */
export function indexNowKey() {
  return (process.env.INDEXNOW_KEY ?? "").trim() || null
}

/**
 * Le signal part de l'administration, mais les adresses sont celles du **site public**.
 *
 * Il ne part que vers le domaine de production : un poste de développement ou une
 * préproduction qui signaleraient leurs adresses à Bing les feraient explorer, ou
 * feraient rejeter le lot pour un hôte qui ne sert pas la clé.
 */
export function indexNowBase(): string | null {
  const base = publicSiteOrigin()
  try {
    return new URL(base).host === new URL(site.url).host ? base : null
  } catch {
    return null
  }
}

/**
 * Ne lève jamais : un enregistrement dans l'administration ne doit pas échouer parce
 * qu'un moteur ne répond pas. À appeler dans `after()`, pour ne pas faire attendre la
 * réponse.
 *
 * Limite connue : le site public se rafraîchit par un `revalidate` de 60 s, son cache
 * n'étant pas celui de l'administration. Un moteur très rapide pourrait donc relire la
 * version d'avant ; en pratique Bing passe bien plus tard que cela.
 */
export async function notifyIndexNow(paths: string[]): Promise<void> {
  const key = indexNowKey()
  const base = indexNowBase()
  if (!key || !base || paths.length === 0) return

  const urlList = Array.from(new Set(paths)).map((path) => `${base}${path}`)

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(base).host,
        key,
        keyLocation: `${base}/${key}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Un moteur injoignable n'est pas une erreur du site.
  }
}
