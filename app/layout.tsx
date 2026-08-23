import type { Metadata, Viewport } from "next"
import {
  Instrument_Sans,
  Schibsted_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { siteOrigin } from "@/lib/origin"
import { homeTitle, site } from "@/lib/site"

const fontDisplay = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-schibsted",
})

const fontSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument",
})

const fontMono = Spline_Sans_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-spline",
})

export const metadata: Metadata = {
  /*
    `metadataBase` est ce contre quoi Next résout les URL relatives des images de
    partage produites par la convention `opengraph-image`. C'est donc **la** ligne dont
    dépendait l'aperçu de lien : mal réglée, les balises sont correctes et pointent
    ailleurs. Voir `lib/origin.ts`.
  */
  metadataBase: new URL(siteOrigin()),
  title: {
    // Le même titre que celui de l'accueil, pour qu'une page sans titre propre ne
    // reparte pas sur une formulation abandonnée. Voir `homeTitle`.
    default: homeTitle,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  /*
    Le nom sous l'icône quand la page est ajoutée à l'écran d'accueil iOS, rendu en
    `<meta name="apple-mobile-web-app-title">`.

    Rien d'autre à déclarer pour les icônes : `app/favicon.ico`, `app/icon0.svg`,
    `app/icon1.png`, `app/apple-icon.png` et `app/manifest.json` sont des conventions
    de fichier de l'App Router - Next pose les `<link>` correspondants tout seul, dans
    l'ordre des suffixes. Les redéclarer ici les dupliquerait.
  */
  appleWebApp: { title: site.name },
  authors: [{ name: site.name, url: siteOrigin() }],
  creator: site.name,
  publisher: site.name,
  /*
    Ce que les robots ont le droit de faire par défaut, pour tout le site.

    `max-image-preview: large` est le réglage qui compte : sans lui, Google n'affiche
    aucune vignette pour les pages de ce site dans Discover et sur mobile, et une
    fiche de réalisation sans image y perd l'essentiel de son attrait. `max-snippet`
    et `max-video-preview` à -1 lèvent les plafonds par défaut.
  */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  /*
    Les codes de vérification des consoles de moteurs, par variable
    d'environnement : ils sont propres à un compte et n'ont rien à faire dans le
    dépôt. Absents, la propriété est omise - `undefined` ne produit aucune balise.
  */
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  // Les deux numéros du site sont déjà des liens `tel:` explicites - celui du studio
  // sur `/contact`, le mobile WhatsApp dans la bulle. Laisser iOS en détecter d'autres
  // rendrait appelable n'importe quelle suite de chiffres, un montant ou une date.
  formatDetection: { telephone: false },
}

/**
 * La couleur de la barre du navigateur, **par thème**.
 *
 * Le `theme_color` du manifeste ne peut porter qu'une valeur, et le site en a deux :
 * sur Android en thème sombre, une barre `#fafaf9` au-dessus d'une page encre se voit
 * comme un bandeau clair collé en haut de l'écran. Les deux valeurs reprennent
 * `--hel-page` de `globals.css` - clair puis sombre - et doivent le suivre si elles y
 * changent.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#101012" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      // Sans cet attribut, Next anime le retour en haut de page à chaque
      // navigation : ce scroll animé entre en concurrence avec le rideau et
      // hache la transition. Le scroll fluide reste actif pour les ancres.
      data-scroll-behavior="smooth"
      className={cn(
        fontDisplay.variable,
        fontSans.variable,
        fontMono.variable,
        "font-sans antialiased"
      )}
    >
      <body>
        {/* Pose le drapeau avant le premier rendu : sans JS, les blocs
            [data-reveal] restent visibles au lieu d'être masqués. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.documentElement.setAttribute("data-reveal-ready","")',
          }}
        />
        {/* Le chrome du site public vit dans app/(site)/layout.tsx, celui de
            l'administration dans app/admin/layout.tsx : ce layout racine ne
            porte que ce qui vaut pour les deux. */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
