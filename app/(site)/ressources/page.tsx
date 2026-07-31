import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/primitives/container"
import { JsonLd } from "@/components/seo/json-ld"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { ArticleCover } from "@/components/ressources/article-cover"
import { ArticleFeed } from "@/components/ressources/article-feed"
import { NewsletterForm } from "@/components/ressources/newsletter-form"
import { articleHref, categoryTone } from "@/lib/content/articles"
import {
  listPublicArticles,
  publicArticleCategories,
} from "@/lib/db/public-articles"
import { cn } from "@/lib/utils"
import { collectionPageNode, graph } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"

/**
 * Le titre, la description et le chemin de la page, en un seul endroit.
 *
 * Hissés en constante parce que **deux consommateurs les lisent** : les métadonnées
 * et le nœud `CollectionPage` des données structurées. Les écrire deux fois, c'est
 * garantir qu'ils divergeront - et un balisage qui contredit la page est un écart
 * signalable, pas un détail.
 */
const page = {
  title: "Ressources",
  description:
    "Guides, analyses et retours d’expérience : ce que nous apprenons en construisant des produits numériques.",
  path: "/ressources",
}

export const metadata: Metadata = pageMetadata(page)

/**
 * Une minute, comme le reste du contenu lu en base. Littéral obligatoire : Next
 * analyse cet export statiquement.
 */
export const revalidate = 60

export default async function RessourcesPage() {
  const all = await listPublicArticles()

  /*
    L'article en tête et le reste du flux.

    La mise en avant est exclusive côté base - `set_article_featured` retire la
    précédente - mais le repli sur le contenu statique peut en rendre plusieurs, et
    une base amorçée à la main aussi. On prend donc le premier et l'on exclut
    **celui-là seul** : sans cette précaution, deux mises en avant feraient
    disparaître un article du flux sans que personne comprenne pourquoi.
  */
  const featured = all.find((item) => item.featured) ?? all[0]
  const feed = all.filter((item) => item.slug !== featured?.slug)
  const categories = publicArticleCategories(feed)

  if (!featured) {
    return (
      <div className="border-b border-line">
        <Container className="py-24 text-center">
          <p className="text-[0.94rem] text-label">
            Aucun article publié pour l&apos;instant.
          </p>
        </Container>
      </div>
    )
  }

  return (
    <>
      {/* Une page de section : `CollectionPage` dit à un moteur que cette adresse est un
          point d'entrée vers une collection, et non un article de plus. Le titre et la
          description viennent de `page`, la même source que les métadonnées. */}
      <JsonLd data={graph([collectionPageNode(page)])} />

      <div className="border-b border-line">
        <Container className="pt-14 pb-10 md:pt-18">
          <Reveal>
            <Eyebrow className="mb-3.5">Ressources</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="max-w-[45rem] text-[clamp(2rem,6.5vw,3.625rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
              Ce que nous apprenons en construisant
              <span className="text-brand">.</span>
            </h1>
          </Reveal>
        </Container>
      </div>

      {/* À la une : un seul article, en pleine largeur. */}
      <Section space="sm" aria-label="À la une">
        <Container>
          <Reveal>
            <Link
              href={articleHref(featured.slug)}
              className="group grid overflow-hidden rounded-xl border border-line bg-surface transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-[3px] hover:shadow-3 lg:grid-cols-[1.2fr_1fr]"
            >
              <div className="flex flex-col gap-3.5 p-6 md:p-11">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "rounded-xs px-2.25 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase",
                      categoryTone[featured.category]
                    )}
                  >
                    {featured.category}
                  </span>
                  <span className="text-[0.78rem] text-label">
                    {featured.readingTime} de lecture
                  </span>
                </div>
                <h2 className="font-display text-[clamp(1.5rem,5.5vw,2rem)] leading-[1.12] font-bold tracking-[-0.02em] text-ink">
                  {featured.title}
                </h2>
                <p className="max-w-[28.75rem] flex-1 text-[0.94rem] leading-relaxed text-body">
                  {featured.lead}
                </p>
                <p className="flex items-center gap-2.5 text-[0.82rem]">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-inset text-[0.69rem] font-semibold text-body"
                  >
                    {featured.authorInitials}
                  </span>
                  <span className="text-body">
                    <span className="font-semibold text-ink">
                      {featured.author}
                    </span>{" "}
                    · {featured.authorRole} · {featured.date}
                  </span>
                </p>
              </div>

              {/*
                Le visuel : l'image de tête de l'article s'il en a une, sinon le croquis.
                Voir `ArticleCardSketch`, qui porte la raison pour laquelle ce croquis est
                un repli et non une illustration - il décrit un article précis.
              */}
              <ArticleCover media={featured.heroMedia} place="card" />
            </Link>
          </Reveal>
        </Container>
      </Section>

      <Section space="sm" className="pt-0 md:pt-0 lg:pt-0">
        <Container>
          <ArticleFeed articles={feed} categories={categories} />
        </Container>
      </Section>

      {/* Capture douce : niveau tertiaire, e-mail seul. */}
      <Section tone="surface" space="sm" aria-labelledby="abonnement">
        <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <h2
              id="abonnement"
              className="mb-2 text-[clamp(1.5rem,5.5vw,2rem)] font-bold"
            >
              Un e-mail par mois. Pas un de plus.
            </h2>
            <p className="text-[0.9rem] leading-relaxed text-body">
              Nos guides et retours d’expérience, sans prospection.
              Désabonnement en un clic.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <NewsletterForm />
          </Reveal>
        </Container>
      </Section>
    </>
  )
}
