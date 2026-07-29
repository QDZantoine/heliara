import { Container } from "@/components/primitives/container"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { ButtonLink } from "@/components/ui/button"
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
      <Halo variant="inverse" />
      <Container className="relative py-20 text-center md:py-28 lg:py-32">
        <Reveal>
          <h2
            id="cta-final-titre"
            className="mb-5 text-[clamp(2rem,8vw,4.5rem)] font-extrabold tracking-[-0.035em] text-inverse-fg"
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
          <ButtonLink
            href={cta.primary.href}
            variant="inverse"
            size="xl"
            className="max-sm:w-full"
          >
            {action}
          </ButtonLink>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex min-h-11 items-center text-[0.94rem] font-medium text-inverse-fg-muted transition-colors duration-100 hover:text-inverse-fg"
          >
            ou écrivez-nous directement
          </a>
        </Reveal>
        {children ? <Reveal delay={180}>{children}</Reveal> : null}
      </Container>
    </Section>
  )
}

export { FinalCta }
