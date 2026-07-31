import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { site } from "@/lib/site"

/**
 * La carte de partage, générée à la demande.
 *
 * **Pourquoi une carte générée plutôt qu'une image fixe.** Une image unique pour tout le
 * site donnerait la même vignette à quinze pages : dans un fil de discussion, trois liens
 * Heliara côte à côte seraient indiscernables. La carte porte donc le titre de la page,
 * ce qui la rend utile là où elle est vue.
 *
 * **Elle ne s'affiche que par défaut.** Une réalisation ou un article qui porte une image
 * de tête la donne en carte de partage, et `pageMetadata` l'écrit alors explicitement -
 * ce qui prend le pas sur la convention de fichier. Une capture de l'interface livrée vaut
 * mieux qu'un titre sur fond encre. Voir `lib/seo.ts`.
 *
 * **Un seul geste orange**, comme sur chaque écran du site : le point après le titre,
 * exactement celui des `h1`. Le sur-titre est donc en gris et non en orange, sans quoi la
 * carte en porterait deux.
 */

/** Le format que réclament OpenGraph et Twitter pour une grande vignette. */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

/**
 * Les polices, lues une fois pour toutes.
 *
 * **Des TTF versionnés dans `assets/fonts/` et non `next/font/google`.** Deux raisons.
 * Satori - le moteur derrière `next/og` - n'accepte ni WOFF2 ni police variable, alors que
 * c'est exactement ce que `next/font` émet ; et un fichier dans le dépôt ne dépend d'aucun
 * accès réseau au moment du rendu. Schibsted Grotesk est sous licence OFL-1.1, dont le
 * texte est joint : elle est redistribuable, à condition de garder cette licence.
 *
 * La promesse est mémorisée au niveau du module : sur un serveur qui rend plusieurs cartes,
 * les fichiers ne sont lus qu'une fois.
 */
let polices: Promise<{ regular: Buffer; bold: Buffer }> | null = null

function chargerPolices() {
  polices ??= (async () => {
    const dossier = join(process.cwd(), "assets", "fonts")
    const [regular, bold] = await Promise.all([
      readFile(join(dossier, "schibsted-grotesk-latin-400-normal.ttf")),
      readFile(join(dossier, "schibsted-grotesk-latin-700-normal.ttf")),
    ])
    return { regular, bold }
  })()
  return polices
}

/**
 * Le logo, inliné en data URI.
 *
 * Satori ne va pas chercher une image sur le réseau, et l'on ne veut pas d'un logo
 * redessiné à la main - un carré orange n'est pas la marque. Le SVG du dépôt est donc lu
 * et encodé, ce qui donne le vrai dessin sans requête.
 */
let logo: Promise<string> | null = null

function chargerLogo() {
  logo ??= (async () => {
    const fichier = await readFile(
      join(process.cwd(), "public", "logos", "logo-brand-heliara-white.svg")
    )
    return `data:image/svg+xml;base64,${fichier.toString("base64")}`
  })()
  return logo
}

/**
 * Coupe un titre trop long plutôt que de le laisser déborder de la carte.
 *
 * Satori n'a pas de `line-clamp` : un titre de 300 caractères sortirait simplement du
 * cadre, et l'on ne s'en apercevrait qu'en regardant l'image. La coupe est franche et
 * marquée par des points de suspension, ce qui se lit comme une coupe et non comme une
 * phrase inachevée.
 */
function raccourcir(texte: string, max: number) {
  const propre = texte.trim()
  if (propre.length <= max) {
    return propre
  }
  const coupe = propre.slice(0, max)
  const espace = coupe.lastIndexOf(" ")
  return `${(espace > max * 0.6 ? coupe.slice(0, espace) : coupe).trimEnd()}…`
}

export async function ogCard({
  eyebrow,
  title,
}: {
  /** Le sur-titre : la nature de la page. « Réalisation », « Article », « Expertise ». */
  eyebrow?: string
  title: string
}) {
  const [{ regular, bold }, marque] = await Promise.all([
    chargerPolices(),
    chargerLogo(),
  ])

  /*
    La taille du titre suit sa longueur.

    Trois paliers plutôt qu'un ajustement continu : satori ne mesure pas le texte avant de
    le rendre, donc il n'existe pas de moyen d'ajuster à l'exact. Les seuils ont été
    choisis pour qu'un titre reste sur trois lignes au plus dans les 1056 px utiles.
  */
  const propre = raccourcir(title, 120)
  const taille = propre.length > 78 ? 54 : propre.length > 46 ? 64 : 76

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // `--hel-inverse` : la surface encre de la DA.
        backgroundColor: "#101012",
        padding: 72,
        fontFamily: "Schibsted Grotesk",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- satori ne connaît
            que `img`, et `next/image` n'a rien à optimiser dans un rendu serveur. */}
      <img src={marque} alt="" width={152} height={55} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        {eyebrow ? (
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              // `--hel-inverse-fg-muted` : le sur-titre reste gris pour que le point
              // orange soit le seul geste de la carte.
              color: "#a3a39d",
              marginBottom: 22,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        {/*
          Le titre décomposé en mots, et pourquoi il faut en passer par là.

          Satori **aplatit les `span` imbriqués en éléments de flex**. Le point orange
          écrit à la suite du titre dans un `span` enfant devenait donc un élément frère,
          posé au bout de la première ligne contre le bord droit de la carte, à plusieurs
          centimètres du texte. Et `display: block` sur le conteneur, qui aurait rendu le
          flux en ligne, fait échouer le rendu : la route répond alors une réponse vide.

          Un mot par élément avec `flexWrap` redonne le comportement attendu : les mots
          s'enchaînent et retournent à la ligne, et le point n'est qu'un élément de plus,
          donc collé au dernier mot où qu'il tombe. L'espace est porté par une marge, un
          élément de flex n'ayant pas d'espace entre mots à hériter.

          Aucun de ces deux défauts ne se voit dans le JSX : il faut regarder l'image.
        */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: taille,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: -taille * 0.03,
            color: "#f2f2f0",
          }}
        >
          {propre.split(" ").map((mot, index) => (
            <span key={index} style={{ marginRight: taille * 0.26 }}>
              {mot}
            </span>
          ))}
          {/* Le geste : le point orange des titres du site. `--hel-inverse-brand`,
              l'orange éclairci qui reste lisible sur encre. La marge négative annule
              l'espace du mot précédent, pour que le point y soit collé. */}
          <span style={{ color: "#f0824b", marginLeft: -taille * 0.26 }}>
            .
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 26,
          color: "#a3a39d",
        }}
      >
        <span>{site.baseline}</span>
        <span>{site.url.replace(/^https?:\/\//, "")}</span>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        {
          name: "Schibsted Grotesk",
          data: regular,
          style: "normal",
          weight: 400,
        },
        { name: "Schibsted Grotesk", data: bold, style: "normal", weight: 700 },
      ],
    }
  )
}
