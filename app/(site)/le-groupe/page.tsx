import type { Metadata } from "next"
import Image from "next/image"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  GraduationCap,
  Repeat,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { Container } from "@/components/primitives/container"
import { JsonLd } from "@/components/seo/json-ld"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { FinalCta } from "@/components/sections/final-cta"
import { LottieScene } from "@/components/visuals/lottie-scene"
import {
  brandAccent,
  brands,
  complianceBadges,
  groupBenefits,
  groupFigures,
  groupManifesto,
  groupProofs,
  valueChain,
  valueChainClosing,
} from "@/lib/content/group"
import { cn } from "@/lib/utils"
import { brandNode, graph, organizationId, webPageNode } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"

/** Lu deux fois : par les métadonnées et par le nœud `AboutPage`. */
const page = {
  title: "Le groupe - formation, développement web & cybersécurité",
  description:
    "Heliara fait partie d'un groupe de trois marques sœurs : LessonSharing (formation IT), Heliara (développement web) et Hexceos (cybersécurité, infogérance, hébergement souverain). Tout le cycle du numérique, en France.",
  path: "/le-groupe",
}

export const metadata: Metadata = pageMetadata(page)

const benefitIcons = {
  "user-round": UserRound,
  "shield-check": ShieldCheck,
  repeat: Repeat,
  "graduation-cap": GraduationCap,
}

export default function LeGroupePage() {
  return (
    <>
      {/*
        La page, et les trois marques qu'elle montre.

        **`mentions` et non `parentOrganization`.** Il n'y a pas de maison mère à
        déclarer - le nom du holding ne figure nulle part sur le site public - et la
        page décrit une complémentarité entre marques sœurs, pas une hiérarchie.
        Balisée autrement, elle mettrait dans le graphe le seul nom que le site ne
        prononce pas.

        L'intérêt est ailleurs : les deux autres marques sont des entités réelles avec
        leur propre domaine, et les citer par leur `@id` canonique relie trois sites
        qui parlent les uns des autres. C'est ce qu'un moteur cherche pour comprendre
        « le groupe » plutôt que trois noms sans lien.
      */}
      <JsonLd
        data={graph([
          {
            ...webPageNode({ ...page, type: "AboutPage" }),
            mentions: brands.map((brand) =>
              brand.current
                ? { "@id": organizationId() }
                : { "@id": `${brand.href.replace(/\/+$/, "")}/#organization` }
            ),
          },
          ...brands
            .filter((brand) => !brand.current)
            .map((brand) =>
              brandNode({
                name: brand.name,
                url: brand.href,
                description: brand.text,
              })
            ),
        ])}
      />
      {/* S1 - Hero. Un seul halo, un seul geste orange : le volume Heliara. */}
      <section className="relative overflow-hidden">
        <Halo variant="hero" />
        <Container className="relative grid items-center gap-10 pt-14 pb-14 md:gap-14 md:pt-20 lg:min-h-[70vh] lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <Eyebrow className="mb-4">Le groupe</Eyebrow>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="mb-5 text-[clamp(2.125rem,7vw,4rem)] leading-[1.0] font-extrabold tracking-[-0.035em]">
                Trois expertises. Un même groupe
                <span className="text-brand">.</span>
              </h1>
            </Reveal>
            <Reveal
              delay={120}
              className="mb-7 max-w-[31.25rem] text-[1.0625rem] leading-relaxed text-body"
            >
              Heliara avance rarement seule. Elle fait partie d’un groupe de{" "}
              <strong className="font-semibold text-ink">
                trois marques sœurs
              </strong>
              , LessonSharing, Hexceos et Heliara, qui couvrent ensemble tout le
              cycle du numérique : former, concevoir, opérer.
            </Reveal>
            <Reveal delay={180}>
              <ul className="grid gap-2">
                {groupProofs.map((proof) => (
                  <li
                    key={proof}
                    className="flex items-start gap-2.5 text-[0.9rem] text-body"
                  >
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand-text"
                      strokeWidth={2}
                    />
                    {proof}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Illustration undraw (Katerina Limpitsouni), recolorée sur la
              palette : le seul carré hors palette, un rose, est passé au bleu
              LessonSharing pour que les trois teintes de la page se retrouvent
              dans le visuel. Décorative, donc hors arbre d'accessibilité. */}
          <Reveal>
            <Image
              src="/illustrations/three-process.svg"
              width={744}
              height={800}
              alt=""
              unoptimized
              priority
              className="mx-auto h-auto w-full max-w-[22rem] md:max-w-[26rem] lg:max-w-[30rem]"
            />
          </Reveal>
        </Container>
      </section>

      {/* S2 - Manifeste, section respirante. */}
      <Section space="sm" aria-label="Manifeste du groupe">
        <Container width="reading">
          <Reveal className="text-center text-[clamp(1.125rem,4.5vw,1.5rem)] leading-[1.6] font-medium text-ink">
            {groupManifesto}
          </Reveal>
        </Container>
      </Section>

      {/* S3 - Les trois marques, coeur de la page. */}
      <Section tone="surface" space="md" aria-labelledby="marques">
        <Container>
          <Reveal className="mb-8 md:mb-10">
            <Eyebrow className="mb-3">Les trois marques</Eyebrow>
            <h2
              id="marques"
              className="max-w-[35rem] text-[clamp(1.625rem,6vw,2.375rem)] font-bold"
            >
              Chacune experte de son domaine.
            </h2>
          </Reveal>

          <ul className="grid gap-4.5 lg:grid-cols-3">
            {brands.map((brand, index) => (
              <li key={brand.slug} className="flex">
                <Reveal delay={index * 70} className="flex w-full">
                  <div
                    className={cn(
                      "relative flex w-full flex-col overflow-hidden rounded-lg border bg-page p-6",
                      brand.current ? "border-brand shadow-2" : "border-line"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-0 top-0 h-1",
                        brandAccent[brand.accent].rule
                      )}
                    />
                    <Image
                      src={brand.logo.src}
                      width={brand.logo.width}
                      height={brand.logo.height}
                      alt=""
                      unoptimized={brand.logo.vector}
                      // Filet discret : la tuile encre de Hexceos se détacherait mal du fond
                      // sombre sans lui.
                      className="mt-1.5 mb-4 size-12 rounded-md border border-line object-contain"
                    />
                    <h3 className="font-display text-[1.375rem] font-bold tracking-[-0.02em] text-ink">
                      {brand.name}
                      {brand.current ? (
                        <span className="text-brand">.</span>
                      ) : null}
                    </h3>
                    <p
                      className={cn(
                        "mt-0.5 mb-3 text-[0.9rem] font-medium italic",
                        brandAccent[brand.accent].text
                      )}
                    >
                      {brand.role}
                    </p>
                    <p className="mb-4 text-[0.9rem] leading-relaxed text-body">
                      {brand.text}
                    </p>
                    <ul className="mb-5 grid flex-1 content-start gap-1.5">
                      {brand.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-2 text-[0.82rem] leading-relaxed text-label"
                        >
                          <span aria-hidden="true" className="flex-none">
                            -
                          </span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    {brand.current ? (
                      <p className="text-[0.82rem] font-medium text-label">
                        Vous êtes ici
                      </p>
                    ) : (
                      <a
                        href={brand.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-1.5 text-[0.9rem] font-medium text-ink transition-colors duration-100 hover:text-brand-text"
                      >
                        {brand.domain}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.5}
                        />
                      </a>
                    )}
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* S4 - La chaîne de valeur. Reliée par un filet sur desktop. */}
      <Section space="md" aria-labelledby="chaine">
        <Container>
          <Reveal className="mb-9 max-w-[40rem]">
            <Eyebrow className="mb-3">La chaîne de valeur</Eyebrow>
            <h2
              id="chaine"
              className="text-[clamp(1.625rem,6vw,2.375rem)] font-bold"
            >
              De la compétence humaine à l’exploitation technique, sans rupture.
            </h2>
          </Reveal>

          <ol className="relative grid gap-6 lg:grid-cols-3 lg:gap-5">
            {/* Filet de liaison : uniquement au-delà de 1024 px. */}
            <span
              aria-hidden="true"
              className="absolute top-6 right-[8%] left-[8%] hidden h-px bg-line-strong lg:block"
            />
            {valueChain.map((link) => (
              <li key={link.num} className="relative">
                <Reveal>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative z-1 mb-4 inline-flex size-12 items-center justify-center rounded-full border-[1.5px] bg-page font-mono text-xs",
                      link.accent === "orange"
                        ? "border-brand text-brand-text"
                        : link.accent === "blue"
                          ? "border-[#1E40AF] text-[#1E40AF]"
                          : "border-ink text-ink"
                    )}
                  >
                    {link.num}
                  </span>
                  <h3 className="font-display text-[1.25rem] font-bold tracking-[-0.015em] text-ink">
                    {link.step}
                  </h3>
                  <p
                    className={cn(
                      "mb-2 text-[0.845rem] font-medium",
                      brandAccent[link.accent].text
                    )}
                  >
                    {link.brand}
                  </p>
                  <p className="max-w-[22rem] text-[0.9rem] leading-relaxed text-body">
                    {link.text}
                  </p>
                  {/* Illustration du temps, sous le texte. Chargée à l'approche
                      du champ : les trois fichiers pèsent lourd. */}
                  <LottieScene
                    src={link.scene.src}
                    speed={link.scene.speed}
                    className={cn("mt-5 aspect-4/3 w-full", link.scene.scale)}
                  />
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal className="mt-9 max-w-[45rem] border-t border-line pt-6 text-[0.97rem] leading-relaxed text-body">
            {valueChainClosing}
          </Reveal>
        </Container>
      </Section>

      {/* S5 - Ce que ça change pour vous. */}
      <Section tone="surface" space="md" aria-labelledby="benefices">
        <Container>
          <Reveal className="mb-8 md:mb-10">
            <Eyebrow className="mb-3">Ce que ça change pour vous</Eyebrow>
            <h2
              id="benefices"
              className="max-w-[35rem] text-[clamp(1.625rem,6vw,2.375rem)] font-bold"
            >
              Une seule chaîne, aucune zone grise.
            </h2>
          </Reveal>

          <ul className="grid gap-4.5 sm:grid-cols-2">
            {groupBenefits.map((benefit, index) => {
              const Icon = benefitIcons[benefit.icon]
              return (
                <li key={benefit.title} className="flex">
                  <Reveal delay={index * 60} className="flex w-full">
                    <div className="w-full rounded-lg border border-line bg-page p-6">
                      <Icon
                        aria-hidden="true"
                        className="mb-3.5 size-5 text-brand-text"
                        strokeWidth={1.5}
                      />
                      <h3 className="mb-2 font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
                        {benefit.title}
                      </h3>
                      <p className="text-[0.9rem] leading-relaxed text-body">
                        {benefit.text}
                      </p>
                    </div>
                  </Reveal>
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      {/* S6 - Chiffres et garanties, section respirante. */}
      <Section space="sm" aria-label="Chiffres et garanties du groupe">
        <Container>
          <dl className="grid grid-cols-2 gap-6 md:gap-8 lg:grid-cols-4">
            {groupFigures.map((figure, index) => (
              <Reveal
                key={figure.value}
                delay={index * 60}
                className="border-l-2 border-brand pl-4 md:pl-5"
              >
                <dt className="sr-only">{figure.label}</dt>
                <dd>
                  <span className="block font-display text-[clamp(1.5rem,5.5vw,2.375rem)] leading-none font-extrabold tracking-[-0.03em] text-ink">
                    {figure.value}
                  </span>
                  <span className="mt-2 block text-[0.845rem] leading-relaxed text-body">
                    {figure.label}
                  </span>
                </dd>
              </Reveal>
            ))}
          </dl>

          <Reveal className="mt-10 border-t border-line pt-6">
            <p className="mb-3 text-[0.66rem] font-semibold tracking-[0.1em] text-label uppercase">
              Conformité
            </p>
            <ul className="flex flex-wrap gap-2">
              {complianceBadges.map((badge) => (
                <li
                  key={badge}
                  className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.82rem] font-medium text-body"
                >
                  {badge}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>

      {/* S7 - CTA final : rupture encre, plus deux liens sortants. */}
      <FinalCta
        title="Un besoin numérique, quel qu’il soit"
        intro="Formation, conception et développement, cybersécurité ou hébergement : parlons-en, on vous oriente vers la bonne équipe."
      >
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {brands
            .filter((brand) => !brand.current)
            .map((brand) => (
              <a
                key={brand.slug}
                href={brand.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-[0.9rem] font-medium text-inverse-fg-muted transition-colors duration-100 hover:text-inverse-fg"
              >
                Découvrir {brand.name}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.5}
                />
              </a>
            ))}
        </div>
      </FinalCta>
    </>
  )
}
