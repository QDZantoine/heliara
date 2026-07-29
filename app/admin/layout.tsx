import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s - Administration" },
  // Rien de l'administration n'a à figurer dans un index, y compris la page de
  // connexion.
  robots: { index: false, follow: false },
}

/**
 * Layout de l'administration, volontairement sans garde : il couvre aussi
 * `/admin/login`, qui doit rester atteignable sans session. La garde vit dans
 * `(protected)/layout.tsx`, ce qui évite la boucle de redirection qu'un contrôle
 * posé ici provoquerait.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
