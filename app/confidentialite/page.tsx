import type { Metadata } from "next"

import { LegalArticle } from "@/components/sections/legal-article"
import { privacyPolicy } from "@/lib/content/legal"

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Données collectées, finalités, durées de conservation, sous-traitants, vos droits et cookies.",
  robots: { index: false, follow: true },
}

export default function ConfidentialitePage() {
  return (
    <LegalArticle
      eyebrow="Données personnelles"
      title="Politique de confidentialité"
      updatedAt="juillet 2026"
      sections={privacyPolicy}
    />
  )
}
