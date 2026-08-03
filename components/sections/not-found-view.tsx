import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import { LottieScene } from "@/components/visuals/lottie-scene"
import { cta, mainNav } from "@/lib/site"

/**
 * L'écran de page introuvable.
 *
 * **Il n'existait pas.** Un lien mort affichait l'écran par défaut de Next : noir sur
 * blanc, hors DA, sans en-tête ni pied de page, et sans un seul lien pour revenir dans le
 * site. C'est le pire endroit pour une impasse, puisque le visiteur y arrive par accident.
 *
 * **Un composant et non une page**, parce que Next a deux points d'entrée distincts pour
 * la même situation - `app/not-found.tsx` pour les URL qui ne correspondent à aucune
 * route, et un `not-found.tsx` de segment pour les `notFound()` levés dans une collection.
 * Les deux rendent cette vue : un visiteur ne doit pas voir deux écrans différents selon
 * la façon dont il s'est perdu.
 */
function NotFoundView() {
  return (
    <Section space="lg">
      <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Reveal>
          <Eyebrow className="mb-4">Erreur 404</Eyebrow>
          <h1 className="mb-5 text-[clamp(2rem,6.5vw,3.5rem)] leading-[1.04] font-extrabold tracking-[-0.035em]">
            Cette page n&apos;existe pas
            <span className="text-brand">.</span>
          </h1>
          <p className="mb-8 max-w-[34rem] text-[1.0625rem] leading-relaxed text-pretty text-body">
            L&apos;adresse est peut-être incomplète, ou la page a changé de
            place. Voici par où reprendre.
          </p>

          {/*
            Deux niveaux de conversion, et pas trois : le primaire vers le contact, le
            secondaire vers la preuve. Le tertiaire - la capture douce - n'a rien à
            faire ici, on ne demande pas une adresse e-mail à quelqu'un qui vient de
            se perdre.
          */}
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/" size="lg">
              <CtaIcon />
              Retour à l&apos;accueil
            </ButtonLink>
            <ButtonLink href={cta.secondary.href} variant="secondary" size="lg">
              {cta.secondary.label}
            </ButtonLink>
          </div>

          {/*
            Les cinq entrées de nav, reprises telles quelles. Elles sont déjà dans
            l'en-tête, et c'est le propos : sur mobile l'en-tête les cache derrière le
            menu, et un visiteur égaré ne va pas l'ouvrir pour chercher.
          */}
          <nav
            aria-label="Sections du site"
            className="mt-10 border-t border-line pt-6"
          >
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex min-h-11 items-center gap-1.5 text-[0.9rem] font-medium text-body hover:text-ink"
                  >
                    {item.label}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-100 group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>

        {/*
          L'illustration, chargée sans attendre : elle est au-dessus de la ligne de
          flottaison, cette page n'ayant rien au-dessus d'elle. C'est le second usage
          `eager` du site, avec le hero de l'accueil - et pour la même raison.

          `holdMs` tient une pause en fin de cycle : la scène se termine sur une pose,
          et la relancer aussitôt donnerait une agitation dont une page d'erreur n'a
          pas besoin.
        */}
        <Reveal delay={80}>
          <LottieScene
            src="/animated-illustrations/error-404.json"
            load="eager"
            speed={0.9}
            holdMs={1200}
            className="mx-auto aspect-square w-full max-w-95 lg:max-w-130"
          />
        </Reveal>
      </Container>
    </Section>
  )
}

export { NotFoundView }
