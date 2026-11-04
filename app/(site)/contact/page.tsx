import type { Metadata } from "next"

import { BookingLink } from "@/components/contact/booking-link"
import { ContactForm } from "@/components/contact/contact-form"
import { Faq } from "@/components/sections/faq"
import { Container } from "@/components/primitives/container"
import { DisplayTitle } from "@/components/primitives/display-title"
import { HeroMark } from "@/components/visuals/hero-mark"
import { JsonLd } from "@/components/seo/json-ld"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Halo } from "@/components/primitives/halo"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { contactFaq, contactFaqSection } from "@/lib/content/faq"
import { contactSteps, pastilleAccent } from "@/lib/content/team"
import { listPublicTeam } from "@/lib/db/public-team"
import { buttonVariants } from "@/components/ui/button"
import { faqNode, graph, webPageNode } from "@/lib/schema"
import { pageMetadata } from "@/lib/seo"
import { phoneTel, serviceAreaLine, site } from "@/lib/site"
import { getListedPhone as listedPhone } from "@/lib/vcards"
import { cn } from "@/lib/utils"

/** Lu deux fois : par les métadonnées et par le nœud `ContactPage`. */
const page = {
  title: "Contact",
  description:
    "Décrivez votre besoin avec vos mots. Un associé vous répond personnellement sous 48 heures ouvrées.",
  path: "/contact",
}

export const metadata: Metadata = pageMetadata(page)

export const revalidate = 60

export default async function ContactPage() {
  /*
    Les associés seuls, tirés du même appel que la liste complète de `/a-propos` : c'est
    ce qui garantit qu'une personne ne peut pas figurer ici avec un texte et là avec un
    autre. La teinte de sa pastille vient de son rang dans l'équipe entière, donc les
    deux pages s'accordent aussi sur la couleur.
  */
  const { partners } = await listPublicTeam()

  return (
    <section className="relative overflow-hidden">
      {/*
        `ContactPage` plutôt que `WebPage` : c'est le seul type que schema.org réserve à
        cette intention, et les points de contact de l'organisation - e-mail, ligne du
        studio, WhatsApp - la référencent déjà par son `@id`.
      */}
      <JsonLd
        data={graph([
          webPageNode({ ...page, type: "ContactPage" }),
          /*
            `FAQPage` **parce que la FAQ est affichée sur cette page**, et pas une ligne
            de plus que ce qu'elle montre : `contactFaq` est la source unique des deux.
            Google a retiré le résultat enrichi en 2023 ; ce qui reste, et qui justifie le
            nœud, c'est qu'une paire question-réponse explicite est ce qu'un moteur
            générateur reprend le plus volontiers - il n'a rien à reformuler.
          */
          faqNode(page.path, contactFaq),
        ])}
      />
      <Halo variant="warm" />
      <div
        aria-hidden="true"
        className="hel-dots pointer-events-none absolute inset-x-0 top-0 h-[40rem]"
      />
      <Container className="relative grid items-start gap-12 pt-14 pb-16 md:pt-20 md:pb-24 lg:grid-cols-[1fr_1.05fr] lg:gap-x-18 lg:gap-y-10">
        {/*
          Trois blocs, deux colonnes : le titre et la réassurance à gauche, le
          formulaire à droite sur toute la hauteur. Sous 1024 px, l'ordre du DOM fait
          foi - titre, formulaire, réassurance : le formulaire reste au plus tôt
          (Responsive Guidelines 09), mais plus avant le `h1`, ce qui ouvrait la page
          sur des champs sans dire où l'on était.
        */}
        <div className="lg:col-start-1 lg:row-start-1">
          <Reveal>
            <Eyebrow className="mb-4">Contact</Eyebrow>
          </Reveal>
          <Reveal immediate delay={60}>
            <DisplayTitle
              text="Parlons de votre projet"
              className="mb-6 text-[clamp(2.5rem,6.8vw,5.25rem)] leading-[0.95] font-extrabold tracking-[-0.045em]"
            />
          </Reveal>
          <Reveal
            immediate
            delay={120}
            className="max-w-[26.25rem] text-[1.0625rem] leading-relaxed text-body"
          >
            Décrivez votre besoin avec vos mots, pas besoin de cahier des
            charges. Un associé vous répond personnellement sous 48 heures
            ouvrées.
          </Reveal>
        </div>

        {/* La carte flottante et le symbole qui déborde de son coin : la
            composition de l'accueil. Le symbole est le geste orange de l'écran avec
            le bouton d'envoi, les numéros d'étape restent donc neutres. */}
        <Reveal className="relative lg:sticky lg:top-25 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <HeroMark className="pointer-events-none absolute -top-8 -right-6 w-20 fill-brand sm:-top-10 sm:-right-10 sm:w-28 lg:-top-12 lg:-right-14 lg:w-32" />
          <div className="relative">
            <ContactForm />
          </div>
        </Reveal>

        <div className="lg:col-start-1 lg:row-start-2">
          {/*
            La seconde porte, et le mot compte : elle est visible et de plein droit, mais
            elle reste seconde. Le bouton est `secondary` et non `brand` - le geste orange
            de cet écran est déjà pris par le point du titre et le bouton d'envoi, et un
            troisième ferait de la page un carrefour au lieu d'un chemin.
          */}
          <Reveal delay={150} className="mb-9">
            <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <div>
                <p className="text-[0.9rem] font-semibold text-ink">
                  Vous préférez en parler de vive voix ?
                </p>
                <p className="text-[0.845rem] leading-relaxed text-body">
                  Choisissez un créneau dans notre agenda, entre 15 et 60
                  minutes, en visio ou sur place.
                </p>
              </div>
              <BookingLink
                className={cn(
                  buttonVariants({ variant: "secondary", size: "md" }),
                  "shrink-0 max-sm:w-full"
                )}
              />
            </div>
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
                    className="inline-flex size-7 items-center justify-center rounded-full border-[1.5px] border-line-strong font-mono text-[0.66rem] text-ink"
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
                    {/*
                      Le numéro direct de qui l'a **autorisé ici**, tiré de
                      `lib/vcards.ts` - la même source que `/vcard/[slug]`, pour qu'un
                      numéro ne soit jamais écrit à deux endroits. Donner son numéro
                      pour une carte qu'on tend soi-même n'est pas l'avoir donné pour
                      une page publique : le drapeau `listPhoneOnSite` porte cette
                      distinction, et `getListedPhone` la fait respecter sans que cet
                      appelant ait à y penser.

                      C'est le seul numéro **mobile** visible du site : la ligne du
                      studio, plus bas sur cette page, reste celle des mentions légales.
                      Un visiteur qui veut joindre quelqu'un et non un standard trouve
                      donc les deux, chacun attribué.
                    */}
                    {listedPhone(person.name) ? (
                      <a
                        href={listedPhone(person.name)?.tel}
                        className="mt-0.5 inline-flex min-h-11 items-center text-[0.82rem] text-info-text hover:underline md:min-h-0"
                      >
                        {listedPhone(person.name)?.display}
                      </a>
                    ) : null}
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
              <a href={phoneTel} className="text-info-text hover:underline">
                {site.phone}
              </a>{" "}
              - du lundi au vendredi, 9 h - 18 h
            </p>
            {/*
              Les villes d'intervention, ici aussi : c'est la page qu'on ouvre pour
              savoir si l'on peut nous joindre depuis chez soi. Le pied de page les
              porte sur chaque écran et `areaServed` les reprend - les trois lisent la
              même constante, deux listes divergentes feraient douter des deux.
            */}
            <p>{serviceAreaLine}.</p>
          </Reveal>
        </div>
      </Container>

      {/*
        La FAQ, après le formulaire et non avant : elle répond aux questions de celui
        qui hésite encore, pas de celui qui a déjà décidé d'écrire. Six réponses qui
        existent toutes ailleurs sur le site - les engagements, les huit temps de la
        méthode, les technologies, les zones d'intervention - rassemblées là où on les
        cherche au moment de se décider.

        Elle réutilise `Faq`, la même que les pages d'expertise : bâtie sur `<details>`,
        donc ouvrable au clavier et dépliée par la recherche du navigateur, sans une
        ligne de JavaScript.
      */}
      <Section space="md" className="relative border-t border-line">
        <Container width="reading">
          <Reveal>
            <Eyebrow className="mb-4">{contactFaqSection.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <Faq title={contactFaqSection.title} items={contactFaq} />
          </Reveal>
        </Container>
      </Section>
    </section>
  )
}
