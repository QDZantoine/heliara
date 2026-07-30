import type { NextConfig } from "next"

/** L'origine publique du stockage objet, telle que `lib/s3.ts` la compose. */
const mediaOrigin = new URL(
  process.env.S3_PUBLIC_URL ?? "http://127.0.0.1:9000/heliara"
)

/**
 * Le stockage est-il sur une adresse de bouclage ou un réseau privé ?
 *
 * C'est le cas en développement, où MinIO répond sur `127.0.0.1:9000`, et ce ne doit
 * pas l'être en production. La distinction sert à n'ouvrir `dangerouslyAllowLocalIP`
 * que là où c'est nécessaire - voir le commentaire de `images`.
 */
const mediaEstLocal =
  /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/.test(
    mediaOrigin.hostname
  )

/**
 * L'origine publique du stockage objet, décomposée pour `images.remotePatterns`.
 *
 * Écrite en clair plutôt qu'en `new URL(...)` : la forme objet est celle que
 * `next/image` documente, et elle rend visible le `pathname` avec son joker - c'est
 * précisément la partie qui manquait.
 */
function mediaPattern() {
  const base = mediaOrigin
  return {
    protocol: base.protocol.replace(":", "") as "http" | "https",
    hostname: base.hostname,
    port: base.port,
    /*
      Le joker terminal est indispensable, et son absence était le défaut.

      `S3_PUBLIC_URL` porte le seau - `/heliara` - alors qu'une image se trouve à
      `/heliara/public/2026/…`. `next/image` compare le `pathname` du motif de façon
      exacte : sans `/**`, aucun média ne pouvait correspondre, et l'optimiseur
      répondait 400 « "url" parameter is not allowed ».

      Le message de Next envoie chercher au mauvais endroit : il annonce « hostname
      127.0.0.1 is not configured » quelle que soit la partie du motif qui a échoué,
      alors que l'hôte, lui, était juste.
    */
    pathname: `${base.pathname.replace(/\/$/, "")}/**`,
  }
}

const nextConfig: NextConfig = {
  /**
   * Répertoire de build, configurable par l'environnement.
   *
   * Nécessaire pour faire tourner les deux déploiements côte à côte en
   * développement : Next 16 pose un verrou et refuse un second serveur de dev sur
   * le même répertoire - « Another next dev server is already running ». Deux
   * répertoires distincts leur permettent de coexister, ce dont `pnpm dev:both` a
   * besoin pour qu'on puisse vérifier qu'une publication se répercute sur le site.
   *
   * En production, un seul répertoire suffit : le même build sert les deux
   * processus, qui ne diffèrent que par `HELIARA_ROLE` et par les identifiants de
   * base qu'ils reçoivent.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  images: {
    /**
     * Les médias sont servis par le stockage objet, sur une autre origine que
     * l'application : `next/image` refuse une source distante non déclarée.
     *
     * Le motif est déduit de `S3_PUBLIC_URL` pour qu'un changement d'hôte ne
     * demande pas de toucher à ce fichier. À défaut, MinIO en local. Sa construction,
     * et le joker qui y manquait, sont détaillés dans `mediaPattern`.
     */
    remotePatterns: [mediaPattern()],

    /**
     * **Un garde-fou de Next 16, qu'il faut ouvrir en développement et pas ailleurs.**
     *
     * Depuis cette version, l'optimiseur résout l'hôte de toute image distante et
     * **refuse** celles qui tombent sur une adresse de bouclage ou un réseau privé - la
     * protection est contre la falsification de requête côté serveur, un attaquant qui
     * ferait lire au serveur une ressource de son réseau interne. Le refus se manifeste
     * par un 400 « "url" parameter is not allowed », **le même message qu'un motif
     * absent** : c'est ce qui rend le défaut long à diagnostiquer, puisqu'on cherche
     * dans `remotePatterns` un problème qui n'y est pas. La cause réelle se lit dans le
     * journal du serveur, « resolved to private ip ».
     *
     * En développement, MinIO répond sur `127.0.0.1` : sans cette ouverture, aucune
     * image déposée dans l'administration n'apparaît sur le site, alors que tout le
     * reste de la chaîne fonctionne.
     *
     * **Elle est conditionnée à l'hôte, pas à `NODE_ENV`.** Un stockage réellement
     * public reste protégé, y compris si l'on lance un build de production en local.
     * Et le risque ouvert ici est borné par `remotePatterns` juste au-dessus : seul cet
     * hôte, ce port et ce préfixe de chemin sont acceptés, pas « toute IP privée ».
     */
    dangerouslyAllowLocalIP: mediaEstLocal,
  },
}

export default nextConfig
