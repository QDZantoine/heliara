import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { CtaBand } from "@/components/sections/cta-band"
import { PageHero } from "@/components/sections/page-hero"
import {
  convictions,
  manifesto,
  pastilleAccent,
  team,
  teamSection,
} from "@/lib/content/team"
import { pageMetadata } from "@/lib/seo"
import { group } from "@/lib/site"
import { cn } from "@/lib/utils"

export const metadata: Metadata = pageMetadata({
  title: "À propos",
  description:
    "Un studio à taille humaine, une exigence de niveau international : qui nous sommes et ce que nous pensons de la conception de produits.",
  path: "/a-propos",
})

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
          <Reveal className="mb-8 max-w-reading md:mb-10">
            <Eyebrow className="mb-3">{teamSection.eyebrow}</Eyebrow>
            {/* `h2` et non `h1` : la page en a déjà un dans son hero, et deux titres
                de niveau 1 cassent la structure que lisent les lecteurs d'écran. */}
            <h2
              id="equipe"
              className="mb-5 text-[clamp(1.625rem,6vw,2.375rem)] font-bold"
            >
              {teamSection.title}
            </h2>
            <p className="text-[1.0625rem] leading-relaxed text-body">
              {teamSection.lead}
            </p>
          </Reveal>

          <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((person, index) => (
              <li key={person.name} className="flex">
                <Reveal delay={index * 60} className="flex w-full">
                  {/* `flex-col` pousse les spécialités en bas de carte : les trois
                      bios n'ont pas la même longueur, et sans cela les listes de puces
                      flotteraient à des hauteurs différentes d'une carte à l'autre. */}
                  <div className="flex w-full flex-col rounded-lg border border-line bg-page p-6">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mb-4 inline-flex size-12 items-center justify-center rounded-full text-[0.94rem] font-semibold",
                        pastilleAccent[person.accent]
                      )}
                    >
                      {person.initials}
                    </span>

                    <h3 className="font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
                      {person.name}
                    </h3>
                    {/*
                      Deux lignes réservées au rôle, même quand il n'en occupe qu'une.

                      « Fondateur du groupe - stratégie, sécurité & infrastructure »
                      passe sur deux lignes là où les deux autres tiennent sur une :
                      sans réserve, la bio de cette carte démarrait vingt pixels plus
                      bas que ses voisines, et l'œil lit ce décalage comme un défaut
                      d'alignement de toute la rangée.

                      L'unité `lh` vaut une hauteur de ligne du bloc : la réserve suit
                      la taille du texte au lieu d'être un nombre de pixels à corriger
                      si l'échelle typographique bouge. Un rôle qui atteindrait trois
                      lignes décalerait à nouveau - deux est ce que la plus longue
                      formulation demande aujourd'hui.
                    */}
                    <p className="mb-2.5 min-h-[2lh] text-[0.82rem] font-medium text-brand-text">
                      {person.role}
                    </p>
                    <p className="mb-5 flex-1 text-[0.845rem] leading-relaxed text-body">
                      {person.bio}
                    </p>

                    <ul className="flex flex-wrap gap-1.5">
                      {person.skills.map((skill) => (
                        <li
                          key={skill}
                          // `text-body` et non `text-label` : sur `bg-inset` en thème
                          // sombre, `label` ne donne que 3,98:1 pour du 12 px, sous le
                          // seuil AA. Le jeton est vérifié contre `page`, pas contre
                          // `inset`, qui est plus clair - le piège ne se voit qu'en
                          // mesurant.
                          className="rounded-xs bg-inset px-2 py-1 text-[0.72rem] font-medium text-body"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>

          {/* La profondeur de banc, dite sans la surjouer : le studio est petit, et
              c'est le groupe qui répond aux projets d'ampleur. */}
          <Reveal className="mt-6 max-w-reading text-[0.9rem] leading-relaxed text-label">
            {teamSection.reach}
          </Reveal>
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

      {/* Les deux niveaux de conversion : la demande, et le rebond vers la preuve
          pour qui n'est pas encore prêt à écrire. */}
      <CtaBand
        title="Envie de savoir si nous sommes le bon studio pour vous ?"
        secondary
      />
    </>
  )
}
