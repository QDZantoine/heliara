/**
 * Affiche - et ouvre - les cartes de partage d'un site en marche.
 *
 * ```text
 * pnpm og                              # les pages représentatives
 * pnpm og --open                       # et les ouvre dans le navigateur
 * pnpm og /methode /contact            # des chemins précis
 * pnpm og --base=https://heliara.fr /  # une autre origine, une fois déployé
 * ```
 *
 * **Pourquoi un script et pas une URL à taper.** Next suffixe la route de l'image d'une
 * empreinte - `/methode/opengraph-image-oupj1r?f76b0f56` - et ne sert **que** cette
 * adresse : `/methode/opengraph-image` répond 404. L'empreinte change à chaque
 * modification du fichier, elle n'est donc pas mémorisable. La seule source fiable est la
 * balise `og:image` de la page, ce que ce script va lire.
 *
 * **Il rapporte aussi le statut de l'image**, et c'est le plus utile des deux. Une balise
 * présente et bien formée qui pointe vers une adresse injoignable donne une page parfaite
 * et **aucun aperçu de lien** - le défaut a été constaté sur WhatsApp en préproduction, et
 * il ne se voit ni au build ni à l'écran. Un `200` ici est la vérification qui compte.
 *
 * Aucun accès à la base : le script ne fait que des requêtes HTTP sur un site déjà lancé.
 */
import { spawn } from "node:child_process"
import { stdout } from "node:process"

/**
 * Un échantillon qui couvre les quatre familles de cartes : la page fixe, les trois
 * listings, une fiche **avec** image de tête - dont la carte est la couverture elle-même
 * et non la carte générée - et une sans.
 */
const PAR_DEFAUT = [
  "/",
  "/methode",
  "/realisations",
  "/ressources",
  "/expertises",
]

const args = process.argv.slice(2)
const ouvrir = args.includes("--open")
const base = (
  args.find((one) => one.startsWith("--base="))?.slice(7) ??
  "http://localhost:3000"
).replace(/\/+$/, "")
const chemins = args.filter((one) => !one.startsWith("--"))
const cibles = chemins.length > 0 ? chemins : PAR_DEFAUT

/** L'`og:image` d'une page, telle que la lisent les réseaux sociaux. */
async function imageDe(url: string) {
  const reponse = await fetch(url)
  if (!reponse.ok) {
    return { erreur: `la page répond ${reponse.status}` }
  }
  const html = await reponse.text()
  const trouve = html.match(
    /<meta\s+property="og:image"\s+content="([^"]+)"/i
  )?.[1]
  return trouve ? { image: trouve } : { erreur: "aucune balise og:image" }
}

async function main() {
  stdout.write(`Cartes de partage sur ${base}\n\n`)
  let manques = 0
  const aOuvrir: string[] = []

  for (const chemin of cibles) {
    const page = `${base}${chemin === "/" ? "" : chemin}`
    const { image, erreur } = await imageDe(page)

    if (!image) {
      stdout.write(`  ✗ ${chemin.padEnd(28)} ${erreur}\n`)
      manques += 1
      continue
    }

    /*
      L'image est demandée séparément, et non supposée joignable parce que la balise
      existe. C'est exactement la distinction qui manquait quand l'aperçu ne
      fonctionnait pas : la balise pointait vers un domaine qui ne répondait pas.
    */
    let etat = "injoignable"
    let poids = ""
    try {
      const rendu = await fetch(image)
      etat = String(rendu.status)
      const octets = rendu.headers.get("content-length")
      poids = octets ? ` ${Math.round(Number(octets) / 1024)} ko` : ""
      if (!rendu.ok) {
        manques += 1
      }
    } catch {
      manques += 1
    }

    stdout.write(
      `  ${etat === "200" ? "✓" : "✗"} ${chemin.padEnd(28)} ${etat}${poids}\n`
    )
    stdout.write(`    ${image}\n`)
    aOuvrir.push(image)
  }

  if (ouvrir && aOuvrir.length > 0) {
    // `open` sur macOS. Ailleurs, les URL sont affichées ci-dessus, à coller.
    spawn("open", aOuvrir, { stdio: "ignore", detached: true }).unref()
  }

  stdout.write(
    manques > 0
      ? `\n${manques} carte(s) hors d'état. Une balise juste ne suffit pas : l'image doit répondre 200 depuis l'extérieur.\n`
      : "\nToutes les cartes répondent.\n"
  )
  stdout.write(
    "\nUn aperçu tel qu'un réseau social le rend se vérifie avec son propre outil :\n" +
      "  LinkedIn  https://www.linkedin.com/post-inspector/\n" +
      "  Facebook  https://developers.facebook.com/tools/debug/\n" +
      "WhatsApp reprend la carte Facebook et la met en cache par URL : pour retester un\n" +
      "lien déjà partagé, y ajouter un paramètre. Les deux exigent une URL publique.\n"
  )
}

main()
