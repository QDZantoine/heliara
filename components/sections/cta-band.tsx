import { Container } from "@/components/primitives/container"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { ButtonLink } from "@/components/ui/button"
import { cta } from "@/lib/site"

type CtaBandProps = {
  title: string
  action?: string
  href?: string
}

/**
 * Bandeau de conversion en fin de page interne : un seul bouton primaire,
 * jamais deux. Plus discret que la bande encre de l’accueil, qui reste réservée
 * à la fin du parcours principal.
 */
function CtaBand({
  title,
  action = cta.primary.label,
  href = cta.primary.href,
}: CtaBandProps) {
  return (
    <Section tone="surface" space="sm">
      <Container className="flex flex-wrap items-center justify-between gap-6 md:gap-8">
        <Reveal>
          <h2 className="max-w-[35rem] text-[clamp(1.5rem,5.5vw,2rem)] leading-tight font-bold">
            {title}
          </h2>
        </Reveal>
        <Reveal delay={60} className="max-sm:w-full">
          <ButtonLink href={href} size="lg" className="max-sm:w-full">
            {action}
          </ButtonLink>
        </Reveal>
      </Container>
    </Section>
  )
}

export { CtaBand }
