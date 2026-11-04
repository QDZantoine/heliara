import { Container } from "@/components/primitives/container"
import { DisplayTitle } from "@/components/primitives/display-title"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { HeroMark } from "@/components/visuals/hero-mark"
import { PointerField } from "@/components/visuals/pointer-field"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  eyebrow: string
  /** Le point orange final est ajouté automatiquement. */
  title: string
  lead?: string
  /**
   * Conservé pour les pages qui le passent encore. L'en-tête est désormais toujours
   * éditorial, aligné à gauche : un titre centré sur fond uni, répété à l'identique
   * de page en page, était ce qui donnait au site l'air d'un gabarit.
   */
  align?: "center" | "start"
  children?: React.ReactNode
}

/**
 * Hero des pages internes : affirmation seule, la preuve vient ensuite.
 *
 * **Un en-tête éditorial, le même geste que l'accueil en plus sobre.** Le surtitre
 * en monospace, sans numéro (retiré à la demande), puis le titre en très grand corps, qui entre mot à mot, et l'introduction dans une
 * colonne à part. Un filet se trace sous le bloc. Derrière, la trame de points et la
 * lueur qui suit le pointeur : la même matière que le hero d'accueil, un seul halo.
 *
 * **Les mots entrent par translation seule, sans fondu** : le titre est le LCP de ces
 * pages, et Chrome n'élit pas un élément peint à opacité nulle (voir `hel-reveal-in`).
 *
 * Au défilement, le bloc remonte et s'efface (`hel-page-hero-away`, sur la vue de la
 * section). Sous `prefers-reduced-motion` et sans timelines, il reste en place.
 */
function PageHero({ eyebrow, title, lead, children }: PageHeroProps) {
  return (
    <section className="hel-page-hero relative overflow-hidden">
      <PointerField className="relative">
        <Halo variant="hero" className="hel-halo-follow" />
        <div
          aria-hidden="true"
          className="hel-dots pointer-events-none absolute inset-0"
        />
        {/* Le symbole du kit, rogné par le bord droit : le même geste que la carte de
            l'accueil, et ce qui occupe le haut de la colonne d'introduction. C'est
            le geste orange de l'écran. */}
        <HeroMark className="pointer-events-none absolute top-6 -right-10 w-28 fill-brand md:top-14 md:-right-16 md:w-52 lg:top-14 lg:-right-12 lg:w-40 xl:-right-20 xl:w-[17rem]" />
        <Container className="hel-page-hero-copy relative z-10 pt-12 pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
          <Reveal
            immediate
            className="mb-8 flex items-center gap-3 font-mono text-[0.75rem] text-label md:mb-10"
          >
            <span className="tracking-[0.08em] uppercase">{eyebrow}</span>
          </Reveal>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end lg:gap-16">
            <Reveal immediate delay={40}>
              <DisplayTitle
                text={title}
                className="max-w-[18ch] text-[clamp(2.375rem,6vw,5.25rem)] leading-[0.95] font-extrabold tracking-[-0.045em]"
              />
            </Reveal>
            {lead ? (
              <Reveal
                immediate
                delay={160}
                className="text-[1.0625rem] leading-relaxed text-body lg:pb-3"
              >
                {lead}
              </Reveal>
            ) : null}
          </div>

          {children}

          <div
            aria-hidden="true"
            className={cn(
              "relative mt-12 h-px bg-line md:mt-16",
              children ? "lg:mt-14" : null
            )}
          >
            <span className="hel-draw absolute inset-0 bg-ink" />
          </div>
        </Container>
      </PointerField>
    </section>
  )
}

export { PageHero }
