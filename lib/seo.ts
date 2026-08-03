import { siteOrigin } from "@/lib/origin"
import { site } from "@/lib/site"

import type { Metadata } from "next"

/**
 * Le socle des métadonnées, en un seul endroit.
 *
 * **Pourquoi une fabrique plutôt que des objets `metadata` écrits page par page.**
 * Chaque page en avait un, et chacun ne portait qu'un titre et une description : ni
 * canonique, ni OpenGraph, ni carte Twitter. Trois oublis identiques répétés douze
 * fois, qu'un helper rend impossibles.
 *
 * Ce que la fabrique garantit à chaque page :
 *
 * - **Une canonique absolue.** Next n'en pose aucune tout seul. Sans elle, la même
 *   page atteinte avec un paramètre de campagne, en `www`, ou par une variante de
 *   casse compte comme une page distincte, et le signal se divise entre les copies.
 * - **Un OpenGraph complet**, avec `url`, `siteName`, `locale` et le type. Un partage
 *   sans `url` fait résoudre le lien depuis la page courante, ce qui casse dans les
 *   clients qui ne suivent pas les redirections.
 * - **Une carte Twitter `summary_large_image`**, sans quoi le lien s'affiche en
 *   vignette carrée de 120 px et le titre passe à la ligne.
 *
 * `metadataBase` est posé dans le layout racine : les chemins relatifs qu'on rend ici
 * sont donc résolus en absolu par Next, y compris pour les images.
 */

/** L'URL absolue d'un chemin du site. Jamais de double barre, jamais de barre finale. */
export function absoluteUrl(path: string): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`
  return `${siteOrigin()}${clean}`
}

type PageMetaInput = {
  title: string
  description: string
  /** Le chemin de la page, depuis la racine. « /realisations/portail-patients ». */
  path: string
  /** `article` pour un contenu daté, `website` pour une page de section. */
  type?: "website" | "article"
  /** Renseigné pour un article : dates ISO, auteur, section. */
  article?: {
    publishedTime?: string
    modifiedTime?: string
    authors?: string[]
    section?: string
  }
  /**
   * Une image de partage explicite. Omise, c'est la convention de fichier qui joue -
   * `opengraph-image.tsx` du segment - et Next pose les balises lui-même.
   */
  image?: { url: string; alt: string; width?: number; height?: number }
  /** Une page qui ne doit pas être indexée, tout en restant atteignable. */
  noIndex?: boolean
  /**
   * Ignorer le `template` de titre du layout racine.
   *
   * Le layout pose `%s - Heliara`, ce qui est exactement ce qu'on veut de « Méthode »
   * ou « Contact ». L'accueil, lui, porte déjà le nom du studio dans son titre : sans
   * ce drapeau il s'afficherait « Heliara - Votre métier, traduit en produit -
   * Heliara ». C'est le genre de défaut qu'on ne voit pas en lisant le code, seulement
   * dans l'onglet.
   */
  absoluteTitle?: boolean
}

export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  article,
  image,
  noIndex,
  absoluteTitle,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path)

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      // Le titre est repris tel quel plutôt que passé par le `template` du layout :
      // « Réalisations - Heliara » est bon dans un onglet, redondant dans une carte
      // de partage qui affiche déjà le nom du site en dessous.
      title,
      description,
      siteName: site.name,
      locale: "fr_FR",
      ...(image ? { images: [image] } : {}),
      ...(article ?? {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
    ...(noIndex
      ? {
          // `follow` est conservé : la page sort de l'index mais ses liens continuent
          // de transmettre leur signal, ce qui compte pour des pages légales qui
          // renvoient vers le reste du site.
          robots: { index: false, follow: true },
        }
      : {}),
  }
}
