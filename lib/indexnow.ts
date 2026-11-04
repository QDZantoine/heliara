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
  if (!key || paths.length === 0) return
  const base = indexNowBase()
  if (!base) {
    /*
      Clé posée mais origine hors production : normal en développement, un défaut en
      production. `NEXT_PUBLIC_SITE_ORIGIN` est figée au build, et un build lancé avec
      le `.env` local couperait IndexNow pour de bon - sans cette ligne, en silence.
    */
    console.warn(
      `IndexNow : rien envoyé, ${publicSiteOrigin()} n'est pas ${site.url}.`
    )
    return
  }

  const urlList = Array.from(new Set(paths)).map((path) => `${base}${path}`)

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
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
    // 200 reçu, 202 clé en cours de vérification. 403 : clé refusée, 422 : hôte.
    if (response.status !== 200 && response.status !== 202) {
      console.warn(`IndexNow : soumission refusée, HTTP ${response.status}.`)
    }
  } catch (error) {
    // Un moteur injoignable n'est pas une erreur du site, mais doit se voir.
    console.warn("IndexNow : moteur injoignable.", error)
  }
}
