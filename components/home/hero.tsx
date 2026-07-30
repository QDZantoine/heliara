import { Container } from "@/components/primitives/container"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { ButtonLink } from "@/components/ui/button"
import { HeroLottie } from "@/components/visuals/hero-lottie"
import { cta } from "@/lib/site"

/**
 * S2 - positionner en cinq secondes. Le double CTA segmente immédiatement :
 * les convaincus contactent, les prudents vont vers la preuve.
 * Le texte est en premier dans le DOM : c’est lui le LCP, la scène produit
 * passe sous le pli sur mobile.
 */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Halo variant="hero" />
      <Container className="relative grid items-center gap-8 pt-14 pb-16 md:gap-12 md:pt-24 md:pb-15 lg:min-h-[82svh] lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Reveal className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.78rem] font-medium text-body shadow-1">
            <span className="size-1.5 rounded-full bg-brand" />
            Studio de conception de plateformes numériques
          </Reveal>

          <Reveal delay={60}>
            <h1 className="mb-7 text-[clamp(2.125rem,9.5vw,5.5rem)] leading-[0.98] font-extrabold tracking-[-0.035em]">
              Votre métier, traduit en produit
              <span className="text-brand">.</span>
            </h1>
          </Reveal>

          <Reveal
            delay={120}
            className="mb-9 max-w-[28.75rem] text-[1.0625rem] leading-relaxed text-body md:text-lg"
          >
            Nous concevons des plateformes numériques sur mesure qui deviennent
            de véritables outils de travail. Pensées pour durer, évoluer et
            accompagner la croissance de votre entreprise.
          </Reveal>

          <Reveal
            delay={180}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <ButtonLink
              href={cta.primary.href}
              size="lg"
              className="max-sm:w-full"
            >
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink
              href={cta.secondary.href}
              variant="secondary"
              size="lg"
              className="max-sm:w-full"
            >
              {cta.secondary.label}
            </ButtonLink>
          </Reveal>
        </div>

        <HeroLottie />
      </Container>
    </section>
  )
}

export { Hero }
