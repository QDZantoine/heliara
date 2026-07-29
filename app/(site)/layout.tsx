import { PageCurtain } from "@/components/layout/page-curtain"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SkipLink } from "@/components/layout/skip-link"

/**
 * Le chrome du site public : en-tête, pied de page, lien d'évitement et voile de
 * transition.
 *
 * Il vit dans un groupe de routes plutôt que dans le layout racine parce que
 * l'administration n'en veut rien - ni la nav publique, ni le voile. Les
 * parenthèses ne changent aucune URL : `app/(site)/methode` reste `/methode`.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PageCurtain />
      <SkipLink />
      <SiteHeader />
      <main id="contenu">{children}</main>
      <SiteFooter />
    </>
  )
}
