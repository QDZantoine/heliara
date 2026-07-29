import type { Metadata } from "next"

import { LegalArticle } from "@/components/sections/legal-article"
import { legalNotice } from "@/lib/content/legal"

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Éditeur, rattachement au groupe, hébergement, propriété intellectuelle et accessibilité.",
  robots: { index: false, follow: true },
}

export default function MentionsLegalesPage() {
  return (
    <LegalArticle
      eyebrow="Informations légales"
      title="Mentions légales"
      updatedAt="juillet 2026"
      sections={legalNotice}
    />
  )
}
