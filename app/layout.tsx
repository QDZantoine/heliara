import type { Metadata, Viewport } from "next"
import {
  Instrument_Sans,
  Schibsted_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

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
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} - ${site.baseline.replace(/\.$/, "")}`,
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
