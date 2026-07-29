import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import { convictions, manifesto, team } from "@/lib/content/team"
import { group } from "@/lib/site"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Un studio à taille humaine, une exigence de niveau international : qui nous sommes et ce que nous pensons de la conception de produits.",
}

export default function AProposPage() {
  return (
    <>
      <PageHero
        eyebrow="À propos"
        title="Un studio à taille humaine, une exigence sans concession"
        align="start"
        lead={manifesto.lead}
      />

      <Section space="sm" className="pt-0 md:pt-0 lg:pt-0">
        <Container>
          <div className="grid max-w-reading gap-5">
            {manifesto.body.map((paragraph) => (
              <Reveal
                key={paragraph.slice(0, 24)}
                className="text-[1.0625rem] leading-[1.75] text-body"
              >
                {paragraph}
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="surface" space="md" aria-labelledby="equipe">
        <Container>
          <Reveal className="mb-8 md:mb-10">
            <Eyebrow className="mb-3">L’équipe</Eyebrow>
            <h2
              id="equipe"
              className="max-w-[35rem] text-[clamp(1.625rem,6vw,2.375rem)] font-bold"
            >
              Six personnes, et l’associé qui cadre est celui qui livre.
            </h2>
          </Reveal>

          <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((person, index) => (
              <li key={person.name} className="flex">
                <Reveal delay={index * 60} className="flex w-full">
                  <div className="w-full rounded-lg border border-line bg-page p-6">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mb-4 inline-flex size-12 items-center justify-center rounded-full text-[0.94rem] font-semibold",
                        person.accent === "brand"
                          ? "bg-brand-solid text-brand-on-solid"
                          : "bg-info text-white"
                      )}
                    >
                      {person.initials}
                    </span>
                    <h3 className="font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
                      {person.name}
                    </h3>
                    <p className="mb-2.5 text-[0.82rem] font-medium text-brand-text">
                      {person.role}
                    </p>
                    <p className="text-[0.845rem] leading-relaxed text-body">
                      {person.background}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section space="md" aria-labelledby="convictions">
        <Container>
          <Reveal className="mb-8 md:mb-10">
            <Eyebrow className="mb-3">Convictions de conception</Eyebrow>
            <h2
              id="convictions"
              className="max-w-[35rem] text-[clamp(1.625rem,6vw,2.375rem)] font-bold"
            >
              Des partis pris, pas des valeurs affichées.
            </h2>
          </Reveal>

          <ul className="border-t border-line">
            {convictions.map((conviction, index) => (
              <li key={conviction.title}>
                <Reveal
                  delay={index * 60}
                  className="grid gap-2 border-b border-line py-6 md:grid-cols-[18rem_1fr] md:gap-10"
                >
                  <h3 className="font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
                    {conviction.title}
                  </h3>
                  <p className="max-w-[40rem] text-[0.94rem] leading-relaxed text-body">
                    {conviction.text}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Endossement de groupe : une ligne, un lien. Le nom du holding
          n'apparaît jamais, ici comme ailleurs sur le site public. */}
      <Section tone="surface" space="sm" aria-labelledby="ancrage">
        <Container>
          <Reveal className="max-w-reading">
            <Eyebrow className="mb-3" tone="muted">
              Ancrage
            </Eyebrow>
            <h2
              id="ancrage"
              className="mb-3 text-[clamp(1.375rem,5.5vw,1.875rem)] font-bold"
            >
              Trois marques sœurs, trois métiers.
            </h2>
            <p className="mb-5 text-[0.97rem] leading-relaxed text-body">
              Heliara avance rarement seule : LessonSharing forme les équipes,
              Hexceos opère et sécurise l’infrastructure. Nos décisions produit,
              elles, nous appartiennent.
            </p>
            <Link
              href={group.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-[0.94rem] font-medium text-brand-text"
            >
              {group.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.5}
              />
            </Link>
          </Reveal>
        </Container>
      </Section>

      <CtaBand title="Envie de savoir si nous sommes le bon studio pour vous ?" />
    </>
  )
}
