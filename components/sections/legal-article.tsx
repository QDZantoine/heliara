import { Container } from "@/components/primitives/container"
import { Reveal } from "@/components/primitives/reveal"
import type { LegalSection } from "@/lib/content/legal"

type LegalArticleProps = {
  eyebrow: string
  title: string
  updatedAt: string
  sections: LegalSection[]
}

/**
 * Gabarit des pages légales : sobriété et exactitude. Colonne de lecture, une
 * seule idée par section, et des tableaux libellé / valeur pour les blocs
 * d'identification, qui se lisent mieux ainsi qu'en paragraphes.
 */
function LegalArticle({
  eyebrow,
  title,
  updatedAt,
  sections,
}: LegalArticleProps) {
  return (
    <Container width="reading" className="pt-14 pb-16 md:pt-18 md:pb-20">
      <Reveal>
        <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-label uppercase">
          {eyebrow}
        </p>
        <h1 className="mb-3 text-[clamp(1.875rem,6vw,3rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
          {title}
        </h1>
        <p className="mb-10 border-b border-line pb-8 text-[0.845rem] text-label">
          Dernière mise à jour : {updatedAt}
        </p>
      </Reveal>

      {sections.map((section) => (
        <Reveal key={section.title} className="mb-10">
          <h2 className="mb-4 text-[clamp(1.25rem,5vw,1.5rem)] font-bold">
            {section.title}
          </h2>

          {section.paragraphs?.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="mb-3.5 text-[0.97rem] leading-[1.75] text-body"
            >
              {paragraph}
            </p>
          ))}

          {section.rows ? (
            <dl className="border-t border-line">
              {section.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-1 border-b border-line py-3.5 md:grid-cols-[13rem_1fr] md:gap-6"
                >
                  <dt className="text-[0.9rem] font-semibold text-ink">
                    {row.label}
                  </dt>
                  <dd className="text-[0.9rem] leading-relaxed text-body">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </Reveal>
      ))}
    </Container>
  )
}

export { LegalArticle }
