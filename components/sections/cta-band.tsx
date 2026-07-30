import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import { cta } from "@/lib/site"

type CtaBandProps = {
  title: string
  action?: string
  href?: string
  /**
   * Ajouter le rebond secondaire à côté du bouton.
   *
   * **Un lien texte, pas un second bouton**, et c'est ce qui permet à la règle de
   * tenir : un seul bouton primaire par page, jamais deux. Le système de conversion du
   * site compte trois niveaux - primaire, secondaire, capture douce - et celui-ci est
   * le deuxième, donc il ne doit pas peser autant que le premier. Deux boutons de même
   * poids ne proposent plus un choix, ils en imposent un.
   *
   * Éteint par défaut : les pages qui n'en veulent pas ne changent pas.
   */
  secondary?: boolean
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
  secondary = false,
}: CtaBandProps) {
  return (
    <Section tone="surface" space="sm">
      <Container className="flex flex-wrap items-center justify-between gap-6 md:gap-8">
        <Reveal>
          <h2 className="max-w-[35rem] text-[clamp(1.5rem,5.5vw,2rem)] leading-tight font-bold">
            {title}
          </h2>
        </Reveal>
        <Reveal
          delay={60}
          className="flex flex-col items-center gap-4 max-sm:w-full sm:flex-row sm:gap-5"
        >
          <ButtonLink href={href} size="lg" className="max-sm:w-full">
            <CtaIcon />
            {action}
          </ButtonLink>
          {secondary ? (
            <Link
              href={cta.secondary.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-[0.94rem] font-medium text-body transition-colors duration-100 hover:text-ink"
            >
              {cta.secondary.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.5}
              />
            </Link>
          ) : null}
        </Reveal>
      </Container>
    </Section>
  )
}

export { CtaBand }
