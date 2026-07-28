import type { Metadata } from "next"
import {
  Instrument_Sans,
  Schibsted_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google"

import "./globals.css"
import { PageCurtain } from "@/components/layout/page-curtain"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SkipLink } from "@/components/layout/skip-link"
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
    default: `${site.name} — ${site.baseline.replace(/\.$/, "")}`,
    template: `%s — ${site.name}`,
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
        <ThemeProvider>
          <PageCurtain />
          <SkipLink />
          <SiteHeader />
          <main id="contenu">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
