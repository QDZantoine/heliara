import { PageCurtain } from "@/components/layout/page-curtain"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SkipLink } from "@/components/layout/skip-link"
import { JsonLd } from "@/components/seo/json-ld"
import { publicExpertiseNav } from "@/lib/db/public-expertises"
import { graph, organizationNode, websiteNode } from "@/lib/schema"

/**
 * Le chrome du site public : données structurées, voile de transition, lien
 * d'évitement, en-tête et pied de page.
 *
 * **Extrait du layout parce que deux endroits en ont besoin.** Le layout du groupe
 * `(site)` l'entoure de toutes les pages publiques ; `app/not-found.tsx` en a besoin
 * aussi, et il vit **hors** du groupe - c'est une contrainte de Next, pas un choix :
 * seule une page `not-found` posée à la racine de `app/` attrape les URL qui ne
 * correspondent à aucune route. Sans cette extraction, la page 404 la plus fréquente,
 * celle d'un lien mort, se serait affichée sans en-tête ni pied de page - donc sans
 * aucun chemin de retour, ce que la règle « aucune impasse » interdit.
 *
 * **Les entrées d'expertise sont lues ici**, une fois, et passées à l'en-tête comme au
 * pied de page. Elles viennent de la base, les familles étant administrables, et la
 * lecture porte un repli sur le contenu statique - une base muette ne doit pas vider le
 * menu de toutes les pages.
 *
 * `knowsAbout` de l'organisation est alimenté par les familles réellement publiées,
 * déjà lues pour la navigation : le signal suit le contenu au lieu d'être une liste de
 * mots-clés figée.
 */
export async function SiteChrome({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const expertiseNav = await publicExpertiseNav()

  return (
    <>
      {/*
        L'organisation et le site, sur **toutes** les pages publiques et sur aucune page
        d'administration. Les nœuds des pages les référencent par leur `@id` au lieu de
        les recopier, ce qui suppose qu'ils soient présents partout.
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
