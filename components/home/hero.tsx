import { MapPin } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import { LinkedInLink } from "@/components/ui/linkedin-link"
import { Magnetic } from "@/components/ui/magnetic"
import { HeroLottie } from "@/components/visuals/hero-lottie"
import { HeroMark } from "@/components/visuals/hero-mark"
import { HeroWall, type HeroScreen } from "@/components/visuals/hero-wall"
import { PointerField } from "@/components/visuals/pointer-field"
import { cta, serviceAreaLine } from "@/lib/site"

/**
 * S2 - positionner en cinq secondes, et donner envie de descendre.
 *
 * **La plongée dans le produit.** Le titre est centré, en très grand corps, et sous
 * lui un mur de sites réellement livrés est posé sur un plan incliné qui s'enfonce
 * dans l'écran. Au-delà de 1024 px, le hero reste épinglé le temps d'un défilement :
 * le texte s'efface vers le haut pendant que le plan se redresse, monte et vient
 * remplir l'écran. C'est le propos du studio montré en un geste - on entre dans le
 * produit - et c'est ce qui donne envie de faire défiler.
 *
 * **L'épinglage n'existe que là où l'animation existe** : grand écran, timelines de
 * défilement prises en charge, mouvement accepté. Ailleurs, le hero a sa hauteur
 * naturelle et le mur reste incliné, immobile - un hero épinglé sans animation ne
 * serait qu'un défilement mort.
 *
 * **Le texte est en premier dans le DOM et entre en `immediate`** : c'est lui le LCP.
 * Une apparition au scroll ordinaire le masquait jusqu'à l'hydratation (808 ms), et
 * les captures entrent en fondu depuis une opacité nulle pour ne pas lui prendre la
 * place.
 */
function Hero({ screens = [] }: { screens?: HeroScreen[] }) {
  return (
    /*
      `data-hero-fused` : la barre de navigation est transparente tant qu'on est en haut
      de cette page, et le hero passe dessous (`-mt-17`, la hauteur de la barre, rendue
      en `pt-17` sur la zone du pointeur). `hel-hero` porte la hauteur d'épinglage.
    */
    <section data-hero-fused="" className="hel-hero relative -mt-17">
      <div className="hel-hero-pin relative overflow-hidden lg:h-svh lg:min-h-[44rem]">
        {/* La zone suit le pointeur : la lueur du hero et l'orientation du mur s'en
            servent. C'est toujours un seul halo, il se déplace. */}
        <PointerField className="relative flex h-full flex-col pt-17">
          <Halo variant="hero" className="hel-halo-follow" />
          {/* Une trame de points, neutre, qui s'estompe vers les bords : la texture
              d'un plan de travail, sous le titre. Aucune couleur de marque. */}
          <div
            aria-hidden="true"
            className="hel-dots pointer-events-none absolute inset-0"
          />
          <Container className="hel-hero-copy relative z-10 pt-10 md:pt-14 lg:pt-[clamp(1.5rem,4.5vh,3.5rem)]">
            {/* La composition des publications LinkedIn : une carte claire qui
                flotte, et les deux pièces du symbole qui débordent de ses coins.
                Voir `HeroMark`. */}
            <div className="relative mx-auto w-full max-w-[66rem]">
              <HeroMark className="pointer-events-none absolute -bottom-10 -left-12 w-40 fill-brand sm:w-56 lg:-bottom-16 lg:-left-56 lg:w-[26rem]" />
              <HeroMark className="pointer-events-none absolute -top-6 -right-5 w-20 fill-brand sm:w-28 lg:-top-9 lg:-right-14 lg:w-36" />
              <div className="relative flex flex-col items-center rounded-[2rem] border border-line bg-surface px-5 py-10 text-center shadow-3 sm:px-10 md:px-16 md:py-12 lg:py-[clamp(2.25rem,5vh,3.5rem)]">
                <Reveal
                  immediate
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.78rem] font-medium text-body shadow-1"
                >
                  <span className="size-1.5 rounded-full bg-label" />
                  Studio de conception de plateformes numériques
                </Reveal>

                <Reveal immediate delay={60}>
                  {/*
                Deux lignes, deux montées décalées de 90 ms, sans masque : une ligne
                rognée pendant qu'elle monte sort du calcul du LCP (mesuré, il tombait
                sur le paragraphe). Sous 640 px, la seconde se replie d'elle-même.
              */}
                  <h1 className="mb-6 text-[clamp(2.375rem,6vw,6rem)] leading-[0.94] font-extrabold tracking-[-0.045em]">
                    <span
                      className="hel-line"
                      style={{ "--l": 0 } as React.CSSProperties}
                    >
                      <span>Votre métier,</span>
                    </span>
                    <span
                      className="hel-line"
                      style={{ "--l": 1 } as React.CSSProperties}
                    >
                      <span>
                        traduit en produit<span className="text-brand">.</span>
                      </span>
                    </span>
                  </h1>
                </Reveal>

                <Reveal
                  immediate
                  delay={120}
                  className="mb-7 max-w-[34rem] text-[1.0625rem] leading-relaxed text-body md:text-lg"
                >
                  Nous concevons des plateformes numériques sur mesure qui
                  deviennent de véritables outils de travail. Pensées pour
                  durer, évoluer et accompagner la croissance de votre
                  entreprise.
                </Reveal>

                <Reveal
                  immediate
                  delay={180}
                  className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
                >
                  <Magnetic className="max-sm:w-full">
                    <ButtonLink
                      href={cta.primary.href}
                      size="lg"
                      className="max-sm:w-full"
                    >
                      <CtaIcon />
                      {cta.primary.label}
                    </ButtonLink>
                  </Magnetic>
                  <ButtonLink
                    href={cta.secondary.href}
                    variant="secondary"
                    size="lg"
                    className="max-sm:w-full"
                  >
                    {cta.secondary.label}
                  </ButtonLink>
                  {/* Troisième porte, volontairement muette : elle sort du site, elle ne
                doit donc pas peser autant que les deux CTA. */}
                  <LinkedInLink className="size-12" />
                </Reveal>

                {/*
              Les villes, au-dessus de la ligne de flottaison : la section « Où nous
              intervenons » était le dix-huitième titre de la page, et personne ne la
              voyait. `serviceAreaLine`, comme le pied de page, `/contact` et
              `llms.txt` : une liste, quatre lecteurs.
            */}
                <Reveal
                  immediate
                  delay={240}
                  className="mt-5 flex items-start gap-2 text-[0.82rem] text-label"
                >
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>{serviceAreaLine}</span>
                </Reveal>
              </div>
            </div>
          </Container>

          {/* Trois produits livrés quand la base en a, l'illustration sinon : le repli
            statique n'a aucune couverture, et deux écrans ne font pas un mur. */}
          {screens.length >= 3 ? (
            <div className="hel-wall-stage relative mt-12 h-[17rem] overflow-hidden sm:h-[22rem] md:mt-14 lg:mt-[clamp(1.5rem,4vh,3rem)] lg:h-auto lg:flex-1 lg:overflow-visible">
              <HeroWall screens={screens.slice(0, 5)} />
            </div>
          ) : (
            <Container className="relative pb-16">
              <HeroLottie />
            </Container>
          )}

          {/* Le pied du hero se fond dans la page : le mur ne s'arrête pas sur un
              bord, il passe sous la suite. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-page"
          />
        </PointerField>
      </div>
    </section>
  )
}

export { Hero }
