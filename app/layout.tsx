import type { Metadata } from "next"
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
