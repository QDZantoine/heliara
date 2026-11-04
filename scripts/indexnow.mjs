// Soumet toutes les adresses du plan du site à IndexNow (Bing, Yandex,
// Seznam, Naver ; pas Google, qui ne lit pas IndexNow).
//
// À lancer UNE FOIS la nouvelle version en ligne, jamais avant : un signal
// envoyé avant la mise en ligne ferait relire aux moteurs l'ancien contenu.
//
//   pnpm indexnow                         le domaine de production
//   pnpm indexnow https://autre-domaine   un autre domaine
//
// Le plan du site est lu en ligne : il est relu en base toutes les minutes,
// il est donc à jour, articles créés dans l'administration
// compris. La clé est lue en ligne elle aussi, sur `/indexnow-key.txt`, puis
// sa preuve est vérifiée là où Bing la cherche, `/<clé>.txt` : si le site ne
// la sert pas, IndexNow refuserait la soumission, autant s'arrêter avant.
//
// Ailleurs dans le site, chaque enregistrement de l'administration signale
// déjà la page modifiée (`lib/indexnow.ts`). Ce script sert à la première
// soumission et après un déploiement qui touche plusieurs pages.

const base = (process.argv[2] ?? "https://heliara.fr").replace(/\/$/, "")
const host = new URL(base).host

const keyResponse = await fetch(`${base}/indexnow-key.txt`)
if (!keyResponse.ok) {
  console.error(
    `erreur : ${base}/indexnow-key.txt répond ${keyResponse.status}. ` +
      "Renseigner INDEXNOW_KEY en production, redémarrer, puis relancer."
  )
  process.exit(1)
}
const key = (await keyResponse.text()).trim()

const keyLocation = `${base}/${key}.txt`
const proof = await fetch(keyLocation)
if (!proof.ok || (await proof.text()).trim() !== key) {
  console.error(
    `erreur : ${keyLocation} ne sert pas la clé (HTTP ${proof.status})`
  )
  process.exit(1)
}

const sitemapResponse = await fetch(`${base}/sitemap.xml`)
if (!sitemapResponse.ok) {
  console.error(`erreur : ${base}/sitemap.xml répond ${sitemapResponse.status}`)
  process.exit(1)
}
const xml = await sitemapResponse.text()
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())

// IndexNow refuse toute la soumission si une seule adresse sort de l'hôte.
const horsHote = urls.filter((url) => new URL(url).host !== host)
if (urls.length === 0 || horsHote.length > 0) {
  console.error(
    urls.length === 0
      ? "erreur : aucune adresse dans le plan du site"
      : `erreur : adresses hors de ${host} : ${horsHote.join(", ")}`
  )
  process.exit(1)
}

const ping = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList: urls,
  }),
})

// 200 : reçu. 202 : reçu, clé en cours de vérification. Le reste est un refus.
const ok = ping.status === 200 || ping.status === 202
console.log(
  `${ok ? "ok" : "erreur :"} ${host} - ${urls.length} adresse(s) soumise(s), HTTP ${ping.status}`
)
if (!ok) {
  console.error(await ping.text())
  process.exit(1)
}
