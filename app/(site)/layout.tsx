import { PageCurtain } from "@/components/layout/page-curtain"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SkipLink } from "@/components/layout/skip-link"
import { JsonLd } from "@/components/seo/json-ld"
import { publicExpertiseNav } from "@/lib/db/public-expertises"
import { graph, organizationNode, websiteNode } from "@/lib/schema"

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
      {/*
        L'organisation et le site, sur **toutes** les pages publiques et sur aucune
        page d'administration. Les nœuds des pages les référencent par leur `@id` au
        lieu de les recopier, ce qui suppose qu'ils soient présents partout.

        `knowsAbout` est alimenté par les familles d'expertise réellement publiées,
        déjà lues ici pour la navigation : le signal décrit ce que le studio fait, et
        il suit le contenu au lieu d'être une liste de mots-clés figée.
      */}
      <JsonLd
        data={graph([
          organizationNode(expertiseNav.map((entry) => entry.label)),
          websiteNode(),
        ])}
      />
      <PageCurtain />
      <SkipLink />
      <SiteHeader expertiseNav={expertiseNav} />
      <main id="contenu">{children}</main>
      <SiteFooter expertiseNav={expertiseNav} />
    </>
  )
}
