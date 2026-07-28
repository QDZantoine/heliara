import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"

type PageHeroProps = {
  eyebrow: string
  /** Le point orange final est ajouté automatiquement. */
  title: string
  lead?: string
  align?: "center" | "start"
  children?: React.ReactNode
}

/** Hero des pages internes : affirmation seule, la preuve vient ensuite. */
function PageHero({
  eyebrow,
  title,
  lead,
  align = "center",
  children,
}: PageHeroProps) {
  const centered = align === "center"

  return (
    <section className="relative overflow-hidden">
      <Halo variant="hero" />
      <Container
        width={centered ? "reading" : "page"}
        className={`relative pt-14 pb-10 md:pt-24 md:pb-14 ${centered ? "text-center" : ""}`}
      >
        <Reveal>
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="mb-5 text-[clamp(2.125rem,7.5vw,4.5rem)] leading-[0.99] font-extrabold tracking-[-0.035em]">
            {title}
            <span className="text-brand">.</span>
          </h1>
        </Reveal>
        {lead ? (
          <Reveal
            delay={120}
            className={`text-[1.0625rem] leading-relaxed text-body ${
              centered ? "mx-auto max-w-[30rem]" : "max-w-[34rem]"
            }`}
          >
            {lead}
          </Reveal>
        ) : null}
        {children}
      </Container>
    </section>
  )
}

export { PageHero }
