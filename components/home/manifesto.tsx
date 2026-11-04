import { Container } from "@/components/primitives/container"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { kpis } from "@/lib/content/kpis"
import { manifesto } from "@/lib/content/manifesto"

/**
 * S3 bis - la conviction, entre la caution et le « quoi ». Une bande encre, un
 * texte en très grand corps qui s'allume mot à mot pendant qu'on le fait défiler,
 * puis les quatre principes en une rangée sobre.
 *
 * **C'est la rupture de ton que la page n'avait pas** : du hero au CTA final, tout
 * était clair, et la seule bande encre arrivait en dernier. Ici elle vient tôt, et
 * elle dit en une phrase ce que les sections suivantes démontrent.
 *
 * L'allumage est du CSS piloté par le défilement (`hel-word`), sur `opacity` seule,
 * et il n'existe que sous `@supports (animation-timeline: view())` et
 * `prefers-reduced-motion: no-preference` : partout ailleurs le texte est simplement
 * lisible, à pleine opacité. Chaque mot est un `span` avec son rang `--i` ; le
 * paragraphe porte la timeline nommée et le nombre de mots `--n`, d'où le CSS tire
 * la fenêtre d'allumage de chacun.
 *
 * Le découpage en mots garde l'espace **dans** le span : c'est ce qui laisse le
 * navigateur replier les lignes comme pour un texte ordinaire. Les lecteurs d'écran
 * lisent la phrase d'un trait, les `span` n'y changent rien.
 *
 * Les principes reprennent `kpis.ts` tels quels : la bande qui les portait seule a
 * été retirée, ils tiennent mieux sous l'affirmation qu'ils précisent.
 */
function Manifesto() {
  const words = [...manifesto.lead.split(" "), ...manifesto.body.split(" ")]
  const leadCount = manifesto.lead.split(" ").length

  return (
    <Section
      tone="inverse"
      space="none"
      className="overflow-hidden"
      aria-labelledby="manifeste-titre"
    >
      <Halo variant="inverse" className="hel-halo-drift" />
      <Container className="relative py-20 md:py-28 lg:py-36">
        <h2
          id="manifeste-titre"
          className="mb-10 text-xs font-semibold tracking-[0.12em] text-inverse-brand uppercase md:mb-14"
        >
          {manifesto.eyebrow}
        </h2>

        <p
          className="hel-manifesto max-w-[62rem] font-display text-[clamp(1.625rem,4.6vw,3.5rem)] leading-[1.1] font-bold tracking-[-0.03em] text-inverse-fg"
          style={{ "--n": words.length } as React.CSSProperties}
        >
          {words.map((word, index) => (
            <span
              key={index}
              className={
                index < leadCount ? "hel-word font-extrabold" : "hel-word"
              }
              style={{ "--i": index } as React.CSSProperties}
            >
              {word}
              {index === leadCount - 1 ? <br /> : " "}
            </span>
          ))}
        </p>

        <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-inverse-line pt-10 md:mt-20 md:grid-cols-4">
          {kpis.map((kpi, index) => (
            <Reveal
              key={kpi.label}
              delay={index * 70}
              className="hel-rise flex flex-col-reverse"
              style={{ "--i": index } as React.CSSProperties}
            >
              <dt className="mt-2 text-[0.9rem] leading-snug text-inverse-fg-muted">
                {kpi.label}
              </dt>
              <dd className="font-display text-[2.25rem] leading-none font-extrabold tracking-[-0.02em] text-inverse-fg md:text-[2.75rem]">
                {kpi.value}
              </dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  )
}

export { Manifesto }
