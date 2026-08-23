import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { JsonLd } from "@/components/seo/json-ld"
import { isStudioByline } from "@/lib/content/articles"
import { ArticleReadingView } from "@/components/ressources/article-reading-view"
import { ViewCounter } from "@/components/ressources/view-counter"
import {
  getPublicArticle,
  listPublicArticleSlugs,
  listPublicArticles,
  relatedPublicArticles,
} from "@/lib/db/public-articles"
import { getPublicCase } from "@/lib/db/public-cases"
import { articleNode, breadcrumbNode, graph } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"

/**
 * Une minute, comme le reste du contenu lu en base. Littéral obligatoire : Next
 * analyse cet export statiquement. Voir la note de `app/(site)/realisations/page.tsx`.
 */
export const revalidate = 60

/** Un article publié après le build est rendu à la demande, puis mis en cache. */
export const dynamicParams = true

export async function generateStaticParams() {
  const items = await listPublicArticleSlugs()
  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(
  props: PageProps<"/ressources/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const article = await getPublicArticle(slug)
  if (!article) {
    return {}
  }
  /*
    `pageMetadata` et non un objet écrit à la main, comme partout ailleurs.

    Cette page était la seule route dynamique à composer ses métadonnées elle-même, et
    elle y perdait deux choses que le socle SEO fournit : **l'URL canonique** et l'image
    de partage. Un article se partage plus que n'importe quelle autre page du site, ce
    qui en faisait l'endroit le plus coûteux pour cet oubli.
  */
  return pageMetadata({
    title: article.title,
    description: article.lead,
    path: `/ressources/${article.slug}`,
    type: "article",
    article: {
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      section: article.category,
    },
    // L'image de tête sert de carte de partage quand l'article en a une, et remplace
    // alors la carte générée. Même règle que les réalisations.
    ...(article.heroMedia
      ? {
          image: {
            url: article.heroMedia.url,
            alt: article.heroMedia.alt || article.title,
            ...(article.heroMedia.width
              ? { width: article.heroMedia.width }
              : {}),
            ...(article.heroMedia.height
              ? { height: article.heroMedia.height }
              : {}),
          },
        }
      : {}),
  })
}

export default async function ArticlePage(
  props: PageProps<"/ressources/[slug]">
) {
  const { slug } = await props.params
  const article = await getPublicArticle(slug)

  if (!article) {
    notFound()
  }

  // Les lectures suivantes et le cas lié partent en parallèle : ni l'un ni l'autre
  // ne dépend du résultat de l'autre.
  const [all, relatedCase] = await Promise.all([
    listPublicArticles(),
    article.relatedCase ? getPublicCase(article.relatedCase) : null,
  ])

  return (
    <>
      {/*
        Les données structurées de l'article.

        `Article` est le type que les moteurs savent lire, et c'est aussi ce qu'un moteur
        générateur reprend le plus volontiers : auteur nommé, date de publication, date de
        modification, durée de lecture, section. `dateModified` n'est pas du remplissage -
        c'est ce qui distingue un contenu tenu à jour d'un contenu abandonné.

        Le fil balisé **reprend exactement** celui que `ArticleReadingView` affiche, la
        catégorie en page courante : un fil balisé plus profond que celui qu'on montre est
        un écart signalable.
      */}
      <JsonLd
        data={graph([
          articleNode({
            path: `/ressources/${article.slug}`,
            title: article.title,
            description: article.lead,
            publishedAt: article.publishedAt,
            modifiedAt: article.updatedAt,
            /*
              Un article signé du studio ne passe **aucun** auteur : le nœud retombe
              alors sur l'organisation par son `@id`. Baliser un `Person` nommé
              « L'équipe Heliara » mettrait dans le graphe une personne qui n'existe
              pas, et un moteur générateur la citerait telle quelle.
            */
            ...(isStudioByline(article.author)
              ? {}
              : { author: article.author, authorRole: article.authorRole }),
            section: article.category,
            readingTime: article.readingTime,
            imageUrl: article.heroMedia?.url,
          }),
          breadcrumbNode([
            { label: "Ressources", path: "/ressources" },
            { label: article.category },
          ]),
        ])}
      />

      {/* Ne rend rien : signale une lecture, une fois par article et par session,
          après deux secondes de présence. Le comptage vient du navigateur parce que
          la page est prérendue et que son code ne s'exécute pas à chaque visite. */}
      <ViewCounter slug={article.slug} />

      <ArticleReadingView
        article={article}
        related={relatedPublicArticles(all, slug)}
        relatedCase={
          relatedCase
            ? { slug: relatedCase.slug, title: relatedCase.title }
            : undefined
        }
      />
    </>
  )
}
