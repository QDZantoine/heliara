import { PageCurtain } from "@/components/layout/page-curtain"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SkipLink } from "@/components/layout/skip-link"
import { publicExpertiseNav } from "@/lib/db/public-expertises"

/**
 * Le chrome du site public : en-tête, pied de page, lien d'évitement et voile de
 * transition.
 *
 * Il vit dans un groupe de routes plutôt que dans le layout racine parce que
 * l'administration n'en veut rien - ni la nav publique, ni le voile. Les
 * parenthèses ne changent aucune URL : `app/(site)/methode` reste `/methode`.
 *
 * **Les entrées d'expertise sont lues ici**, une fois, et passées à l'en-tête comme au
 * pied de page. Elles viennent de la base : les familles sont administrables. Le
 * layout est donc asynchrone, et la lecture porte un repli sur le contenu statique -
 * une base muette ne doit pas vider le menu de toutes les pages.
 */
export const revalidate = 60

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const expertiseNav = await publicExpertiseNav()

  return (
    <>
      <PageCurtain />
      <SkipLink />
      <SiteHeader expertiseNav={expertiseNav} />
      <main id="contenu">{children}</main>
      <SiteFooter expertiseNav={expertiseNav} />
    </>
  )
}
