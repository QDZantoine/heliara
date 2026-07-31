import { SiteChrome } from "@/components/layout/site-chrome"

/**
 * Le chrome du site public, appliqué à toutes ses pages.
 *
 * Il vit dans un groupe de routes plutôt que dans le layout racine parce que
 * l'administration n'en veut rien - ni la nav publique, ni le voile. Les parenthèses ne
 * changent aucune URL : `app/(site)/methode` reste `/methode`.
 *
 * **Le contenu du chrome est dans `SiteChrome`** et non ici, parce que `app/not-found.tsx`
 * en a besoin aussi et qu'il vit hors de ce groupe. Voir la note de ce composant.
 */
export const revalidate = 60

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SiteChrome>{children}</SiteChrome>
}
