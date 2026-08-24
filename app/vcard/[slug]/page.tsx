import Image from "next/image"
import { notFound } from "next/navigation"
import {
  CalendarClock,
  Download,
  Mail,
  Phone,
  ArrowUpRight,
} from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { Halo } from "@/components/primitives/halo"
import { buttonVariants } from "@/components/ui/button"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/lib/site"
import { getVCard, VCARD_BASELINE, vcardSlugs, type VCard } from "@/lib/vcards"
import { cn } from "@/lib/utils"

import type { Metadata } from "next"

/**
 * La carte de visite numérique d'une personne.
 *
 * **Hors du groupe `(site)`, et c'est le point de conception.** Une carte s'ouvre depuis
 * un QR code au bout d'une poignée de main : elle n'a ni en-tête de site, ni menu, ni
 * voile de transition. Tout ce qui n'est pas « appeler, écrire, enregistrer » y est du
 * bruit. Le chrome du site vit dans `SiteChrome`, que ce segment n'utilise pas.
 *
 * **Elle n'est pas dans le plan du site**, volontairement : elle se donne, elle ne se
 * cherche pas. Elle reste indexable - rien n'y est privé qui ne soit sur une carte de
 * papier - mais l'annoncer dans `sitemap.xml` mettrait les numéros directs de l'équipe
 * dans la file d'exploration de tous les moteurs.
 *
 * **Le geste orange est le bouton d'enregistrement, et lui seul parmi les actions.** Les
 * quatre autres sont en habillage secondaire : sur une carte, une seule chose compte, et
 * c'est que le contact atterrisse dans le téléphone. Le rôle, le filet et le halo portent
 * aussi l'orange - ce sont les usages décoratifs que la DA prévoit pour `brand`, pas des
 * actions concurrentes.
 */

export async function generateStaticParams() {
  return vcardSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata(
  props: PageProps<"/vcard/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const card = getVCard(slug)
  if (!card) {
    return {}
  }

  return pageMetadata({
    title: `${card.fullName} - ${site.name}`,
    description: `${card.role} chez ${site.name}. Ses coordonnées directes, et sa carte de visite à enregistrer.`,
    path: `/vcard/${card.slug}`,
    absoluteTitle: true,
  })
}

export default async function VCardPage(props: PageProps<"/vcard/[slug]">) {
  const { slug } = await props.params
  const card = getVCard(slug)
  if (!card) {
    notFound()
  }

  const action = cn(
    buttonVariants({ variant: "secondary", size: "block" }),
    "justify-start gap-3.5"
  )

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-page px-5 py-8">
      <article className="w-full max-w-100 overflow-hidden rounded-xl border border-line bg-surface shadow-3">
        {/*
          L'en-tête encre, avec le lockup blanc et un unique halo. Le portrait le
          chevauche : c'est ce qui donne à la carte sa profondeur sans un seul filet,
          comme la DA le demande.
        */}
        <header className="relative overflow-hidden bg-inverse px-6 pt-6 pb-14">
          <Halo variant="inverse" />
          <div className="relative">
            <Logo tone="inverse" alt={`${site.name}, accueil`} />
          </div>
        </header>

        <div className="px-6 pb-7">
          {/*
            `relative` n'est pas décoratif : l'en-tête encre est positionné, donc il se
            peindrait **au-dessus** du portrait quel que soit l'ordre du DOM - la moitié
            haute du visage disparaissait derrière l'encre. Mesuré à l'écran.
          */}
          <div className="relative -mt-12 mb-5">
            <Portrait card={card} />
          </div>

          <h1 className="font-display text-[1.65rem] leading-tight font-bold text-ink">
            {card.fullName}
          </h1>
          <p className="mt-1 text-[0.95rem] font-medium text-brand-text">
            {card.role}
          </p>
          {/* Le filet : un geste décoratif, de la largeur d'un mot, jamais une bordure. */}
          <div
            aria-hidden="true"
            className="mt-4 h-0.5 w-10 rounded-full bg-brand"
          />
          <p className="mt-4 text-[0.9rem] leading-relaxed text-body">
            {VCARD_BASELINE}
          </p>

          <div className="mt-6 grid gap-2.5">
            {/*
              Ancre ordinaire avec `download` et non `next/link` : c'est un fichier qu'on
              enregistre, pas une page où l'on navigue. Le routeur n'a rien à préparer, et
              l'attribut est ce qui fait proposer « Ajouter aux contacts » sur les deux
              systèmes plutôt qu'afficher le texte du fichier.
            */}
            <a
              href={`/vcard/${card.slug}/card.vcf`}
              download={`${card.slug}-heliara.vcf`}
              className={cn(
                buttonVariants({ variant: "brand", size: "block" }),
                "justify-start gap-3.5"
              )}
            >
              <Download aria-hidden="true" />
              Ajouter à mes contacts
            </a>

            <a href={`tel:${card.phone}`} className={action}>
              <Phone aria-hidden="true" />
              <span>
                Appeler
                <span className="ml-1.5 text-label">{card.phoneDisplay}</span>
              </span>
            </a>

            {card.email ? (
              <a href={`mailto:${card.email}`} className={action}>
                <Mail aria-hidden="true" />
                {/* `break-all` : une adresse longue ne doit pas élargir la carte. */}
                <span className="break-all">{card.email}</span>
              </a>
            ) : null}

            {card.calUrl ? (
              <a
                href={card.calUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={action}
              >
                <CalendarClock aria-hidden="true" />
                Prendre rendez-vous
              </a>
            ) : null}

            <a href={card.website} className={action}>
              <ArrowUpRight aria-hidden="true" />
              Découvrir {site.name}
            </a>
          </div>
        </div>

        <footer className="border-t border-line px-6 py-4 text-center text-[0.78rem] text-label">
          {site.name} · heliara.fr
        </footer>
      </article>
    </main>
  )
}

/**
 * Le portrait, rond, ou les initiales en repli.
 *
 * **Les deux variantes sont rendues et le CSS en masque une**, comme pour les cartes
 * d'équipe : le thème est une classe sur `<html>` et non la seule préférence système,
 * donc échanger la source demanderait du JavaScript. Un détourage sur blanc posé sur une
 * carte encre devient un disque lumineux, et l'inverse écrase une carte claire.
 *
 * `object-top` ne change rien sur les portraits actuels - ils sont carrés, et un carré
 * dans un cercle carré n'est pas recadré - mais il garde le cadrage juste si quelqu'un
 * fournit un jour une photo en format portrait : les sujets sont pris tête et épaules,
 * et un recadrage centré leur couperait le front.
 */
function Portrait({ card }: { card: VCard }) {
  const frame =
    "size-26 rounded-full border-4 border-surface bg-inset object-cover object-top shadow-3"

  if (!card.photo) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          frame,
          "inline-flex items-center justify-center font-display text-2xl font-bold text-brand-on-solid",
          "bg-brand-solid"
        )}
      >
        {card.initials}
      </span>
    )
  }

  return (
    <>
      <Image
        src={card.photo.light}
        alt=""
        width={800}
        height={800}
        priority
        sizes="104px"
        className={cn(frame, "dark:hidden")}
      />
      <Image
        src={card.photo.dark}
        alt=""
        width={800}
        height={800}
        priority
        sizes="104px"
        className={cn(frame, "hidden dark:block")}
      />
    </>
  )
}
