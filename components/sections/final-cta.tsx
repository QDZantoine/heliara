import { Container } from "@/components/primitives/container"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import { Magnetic } from "@/components/ui/magnetic"
import { PointerField } from "@/components/visuals/pointer-field"
import { methodPreview } from "@/lib/content/method"
import { cta, site } from "@/lib/site"

type FinalCtaProps = {
  /** Le titre porte la promesse : il change selon la page. */
  title?: string
  intro?: string
  /** Libellé du bouton unique. */
  action?: string
  /** Liens secondaires ajoutés sous le bouton, sur fond encre. */
  children?: React.ReactNode
}

/**
 * S9 - toutes les objections sont levées, la demande peut être franche.
 * La rupture de fond encre signale la fin du parcours et concentre l'attention
 * sur une action unique. Réutilisée en bas des pages internes.
 */
function FinalCta({
  title = cta.primary.label,
  intro = `Un échange de trente minutes, sans engagement. ${site.responseCommitment}`,
  action = "Prendre contact",
  children,
}: FinalCtaProps) {
  return (
    <Section
      id="contact"
      tone="inverse"
      space="none"
      className="overflow-hidden"
      aria-labelledby="cta-final-titre"
    >
      <Halo variant="inverse" className="hel-halo-drift" />
      {/*
        Le bandeau de la méthode : les quatre temps en lettres contourées géantes, qui
        glissent **au défilement** et non d'eux-mêmes. C'est ce qui le dispense de
        commande de pause : WCAG 2.2.2 vise le mouvement automatique, pas celui que
        la personne pilote. Décoratif, hors arbre d'accessibilité ; les quatre temps
        sont nommés et liés ailleurs.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative overflow-hidden pt-14 md:pt-20"
      >
        <p className="hel-ticker font-display text-[clamp(3.5rem,11vw,10rem)] leading-none font-extrabold tracking-[-0.04em] whitespace-nowrap">
          {[...methodPreview, ...methodPreview].map((step, index) => (
            <span key={index}>
              {step.title}
              <span className="hel-ticker-dot">·</span>
            </span>
          ))}
        </p>
      </div>
      <PointerField>
        <Container className="relative pt-12 pb-20 text-center md:pt-16 md:pb-28 lg:pb-32">
          <Reveal className="hel-grow">
            <h2
              id="cta-final-titre"
              className="mb-5 text-[clamp(2.25rem,8.5vw,6.5rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-inverse-fg"
            >
              {title}
              <span className="text-inverse-brand">.</span>
            </h2>
          </Reveal>
          <Reveal
            delay={60}
            className="mx-auto mb-10 max-w-[27.5rem] text-[1.0625rem] leading-relaxed text-inverse-fg-muted"
          >
            {intro}
          </Reveal>
          <Reveal
            delay={120}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-3.5"
          >
            <Magnetic className="max-sm:w-full">
              <ButtonLink
                href={cta.primary.href}
                variant="inverse"
                size="xl"
                className="max-sm:w-full"
              >
                <CtaIcon />
                {action}
              </ButtonLink>
            </Magnetic>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex min-h-11 items-center text-[0.94rem] font-medium text-inverse-fg-muted transition-colors duration-100 hover:text-inverse-fg"
            >
              ou écrivez-nous directement
            </a>
          </Reveal>
          {children ? <Reveal delay={180}>{children}</Reveal> : null}
        </Container>
      </PointerField>
    </Section>
  )
}

export { FinalCta }
