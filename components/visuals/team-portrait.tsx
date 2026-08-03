import Image from "next/image"

import type { Person } from "@/lib/content/team"

/**
 * Le portrait en tête de carte d'équipe.
 *
 * **Deux images, une par thème, et non une seule dont on changerait la source.** Le thème
 * est une classe sur `<html>` et non la seule préférence système - le sélecteur permet de
 * le forcer - donc un `<picture media>` se désynchroniserait d'un choix manuel. Les deux
 * sont rendues et le CSS en masque une. Le coût est un second téléchargement, borné par le
 * WebP dimensionné de `next/image` et limité à cette page.
 *
 * `object-top` : les sujets sont cadrés tête et épaules, légèrement décentrés vers la
 * droite. Un cadrage centré couperait le front sur les trois.
 */
export function TeamPortrait({ person }: { person: Person }) {
  const commun =
    "aspect-4/3 w-full object-cover object-top transition-transform duration-[260ms] ease-expo group-hover:scale-[1.03]"

  return (
    // `overflow-hidden` borne l'agrandissement au survol, et le fond `inset` occupe la
    // boîte pendant le chargement : la place est réservée par le rapport d'aspect, donc
    // rien ne se décale à l'arrivée de l'image.
    <div className="relative mb-5 overflow-hidden rounded-md bg-inset">
      <Image
        src={person.photo.white}
        alt=""
        width={800}
        height={800}
        // 33vw : trois cartes de front au-delà de 1024 px, une seule en dessous.
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className={`${commun} dark:hidden`}
      />
      <Image
        src={person.photo.orange}
        alt=""
        width={800}
        height={800}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className={`${commun} hidden dark:block`}
      />
    </div>
  )
}
