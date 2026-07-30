import type { Metadata } from "next"

import { ContactForm } from "@/components/contact/contact-form"
import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { contactSteps, partners, pastilleAccent } from "@/lib/content/team"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Décrivez votre besoin avec vos mots. Un associé vous répond personnellement sous 48 heures ouvrées.",
  path: "/contact",
})

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden">
      <Halo variant="warm" />
      <Container className="relative grid items-start gap-12 pt-14 pb-16 md:pt-20 md:pb-24 lg:grid-cols-[1fr_1.05fr] lg:gap-18">
        {/* Réassurance à gauche. Sur mobile, le formulaire passe en premier
            (Responsive Guidelines 09, ligne « Formulaire Contact »). */}
        <div className="max-lg:order-2">
          <Reveal>
            <Eyebrow className="mb-4">Contact</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mb-5 text-[clamp(2rem,6.5vw,3.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
              Parlons de votre projet
              <span className="text-brand">.</span>
            </h1>
          </Reveal>
          <Reveal
            delay={120}
            className="mb-9 max-w-[26.25rem] text-[1.0625rem] leading-relaxed text-body"
          >
            Décrivez votre besoin avec vos mots - pas besoin de cahier des
            charges. Un associé vous répond personnellement sous 48 heures
            ouvrées.
          </Reveal>

          <Reveal className="mb-9">
            <p className="mb-3.5 text-[0.72rem] font-semibold tracking-[0.1em] text-label uppercase">
              Ce qui se passe ensuite
            </p>
            <ol>
              {contactSteps.map((step) => (
                <li
                  key={step.num}
                  className="grid grid-cols-[2.25rem_1fr] gap-3.5 border-t border-line py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-7 items-center justify-center rounded-full border-[1.5px] border-brand font-mono text-[0.66rem] text-brand-text"
                  >
                    {step.num}
                  </span>
                  <div>
                    <p className="text-[0.9rem] font-semibold text-ink">
                      {step.title}
                    </p>
                    <p className="text-[0.845rem] leading-relaxed text-body">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal className="mb-5 rounded-lg border border-line bg-surface p-5.5">
            <p className="mb-4 text-[0.72rem] font-semibold tracking-[0.1em] text-label uppercase">
              Vos interlocuteurs
            </p>
            <ul className="grid gap-3.5">
              {partners.map((person) => (
                <li key={person.name} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      pastilleAccent[person.accent]
                    )}
                  >
                    {person.initials}
                  </span>
                  <span>
                    <span className="block text-[0.9rem] font-semibold text-ink">
                      {person.name}
                    </span>
                    <span className="block text-[0.78rem] text-label">
                      {person.role}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="text-[0.845rem] leading-loose text-body">
            <p>
              Vous préférez l’e-mail ?{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-info-text hover:underline"
              >
                {site.email}
              </a>
            </p>
            <p>
              Ou le téléphone :{" "}
              <a
                href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                className="text-info-text hover:underline"
              >
                {site.phone}
              </a>{" "}
              - du lundi au vendredi, 9 h - 18 h
            </p>
          </Reveal>
        </div>

        <Reveal className="max-lg:order-1 lg:sticky lg:top-25">
          <ContactForm />
        </Reveal>
      </Container>
    </section>
  )
}
