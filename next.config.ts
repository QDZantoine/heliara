import type { NextConfig } from "next"

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
     * demande pas de toucher à ce fichier. À défaut, MinIO en local.
     */
    remotePatterns: [
      new URL(process.env.S3_PUBLIC_URL ?? "http://127.0.0.1:9000/heliara"),
    ],
  },
}

export default nextConfig
