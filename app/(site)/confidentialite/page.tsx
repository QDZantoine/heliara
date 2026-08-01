import type { Metadata } from "next"

import { LegalArticle } from "@/components/sections/legal-article"
import { privacyPolicy } from "@/lib/content/legal"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Confidentialité",
  description:
    "Données collectées, finalités, durées de conservation, sous-traitants, vos droits et cookies.",
  path: "/confidentialite",
  noIndex: true,
})

export default function ConfidentialitePage() {
  return (
    <LegalArticle
      eyebrow="Données personnelles"
      title="Politique de confidentialité"
      updatedAt="août 2026"
      sections={privacyPolicy}
    />
  )
}
