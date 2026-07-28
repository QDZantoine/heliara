import { Container } from "@/components/primitives/container"
import { Section } from "@/components/primitives/section"
import { clients } from "@/lib/content/clients"

/**
 * S3 — la caution arrive avant le premier scroll d'effort. Section respirante.
 *
 * Le défilement est une animation CSS : la liste est doublée pour boucler, la
 * copie est retirée de l'arbre d'accessibilité, et le ticker se met en pause au
 * survol comme au focus clavier. Ralenti sous 900 px
 * (Responsive Guidelines 09, ligne « Preuve sociale »).
 */
function SocialProof() {
  return (
    <Section tone="surface" space="none" aria-labelledby="preuve-sociale">
      <Container className="flex flex-col gap-4 py-6 menu:flex-row menu:items-center menu:gap-9">
        <p
          id="preuve-sociale"
          className="flex-none text-[0.72rem] font-semibold tracking-[0.12em] text-label uppercase"
        >
          Ils nous font confiance
        </p>
        <div className="group flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-14 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] max-menu:[animation-duration:55s]">
            {[clients, clients].map((list, copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1 ? "true" : undefined}
                className="flex gap-14"
              >
                {list.map((client) => (
                  <li
                    key={client}
                    className="font-display text-[1.0625rem] font-bold tracking-[-0.01em] whitespace-nowrap text-label"
                  >
                    {client}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}

export { SocialProof }
