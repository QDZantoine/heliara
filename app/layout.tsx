import type { Metadata } from "next"
import {
  Instrument_Sans,
  Schibsted_Grotesk,
  Spline_Sans_Mono,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

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
  title: "Heliara — Votre métier, traduit en produit",
  description:
    "Studio de conception et de développement de produits numériques : plateformes métiers, SaaS, applications et IA.",
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
      className={cn(
        fontDisplay.variable,
        fontSans.variable,
        fontMono.variable,
        "font-sans antialiased"
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
