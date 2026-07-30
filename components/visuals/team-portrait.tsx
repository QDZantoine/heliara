import Image from "next/image"

import type { Person } from "@/lib/content/team"

/**
 * Le portrait en tête de carte d'équipe.
 *
 * **Il a remplacé une pastille d'initiales.** Deux lettres dans un rond disent qu'on
 * n'a pas de photo ; sur une page dont tout l'argument est « vos interlocuteurs sont
 * ceux qui conçoivent », montrer les visages est le propos, pas la décoration.
 *
 * **Deux images, une par thème, et non une seule dont on changerait la source.** Le
 * thème du site est porté par une classe sur `<html>` et non par la seule préférence
 * système - le sélecteur permet de le forcer - donc un `<picture>` avec
 * `media="(prefers-color-scheme: dark)"` se désynchroniserait d'un choix manuel. Les
 * deux variantes sont donc rendues, et le CSS en masque une : c'est la même mécanique
 * que le sélecteur de thème, qui lit l'état en CSS plutôt qu'en React et évite ainsi la
 * garde `mounted` et le rendu vide à l'hydratation.
 *
 * Le coût assumé est un second téléchargement. Il reste modeste parce que `next/image`
 * sert du WebP dimensionné à la largeur d'affichage, là où le PNG source pèse 330 ko -
 * et il ne concerne que cette page.
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
