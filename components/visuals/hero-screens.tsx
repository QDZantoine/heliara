import Image from "next/image"

import type { MediaRef } from "@/lib/media"
import { cn } from "@/lib/utils"

export type HeroScreen = { media: MediaRef; name: string; sector: string }

/**
 * Trois produits livrés, posés comme des écrans qui s'allument.
 *
 * **« Montrer le produit, pas la matière »** : c'est la phrase de la DA, prise au mot. Le
 * hero montrait une illustration de fenêtres génériques ; il montre désormais des
 * interfaces réellement en production, ce qui est la seule chose qu'un prospect ne peut
 * pas soupçonner d'être un décor.
 *
 * **Le moment orchestré, et le seul de la page** : chaque écran monte de quelques pixels
 * pendant qu'un voile encre se retire de sa surface, en décalé. C'est la « lumière
 * d'écran » rendue littérale, et cela ne porte que sur `opacity` et `transform`. Sous
 * `prefers-reduced-motion`, la règle globale ramène tout à l'état final ; sans
 * JavaScript, l'animation CSS se joue quand même, rien n'est masqué durablement.
 *
 * **Quand il n'y a pas trois couvertures, le hero rend `HeroLottie` à la place.** Sa
 * boîte est un carré à peine plus haut ; le hero ayant une hauteur minimale sur grand
 * écran, l'écart ne déplace pas le texte. Et il ne survient jamais au cours d'un même
 * chargement : la base répond ou non avant le rendu.
 *
 * Décoratif (`aria-hidden`) : les mêmes projets sont nommés et liés plus bas, dans les
 * réalisations. Les lire ici en plus ferait entendre trois noms sans contexte.
 */
function HeroScreens({ screens }: { screens: HeroScreen[] }) {
  const [back, middle, front] = screens

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[6/5] w-full max-w-[36rem]"
    >
      <Screen
        screen={back}
        order={0}
        className="top-0 left-0 w-[68%] shadow-2"
      />
      <Screen
        screen={middle}
        order={1}
        className="top-[16%] right-0 w-[64%] shadow-3"
      />
      <Screen
        screen={front}
        order={2}
        className="bottom-[2%] left-[14%] w-[72%] shadow-4"
      />
    </div>
  )
}

function Screen({
  screen,
  order,
  className,
}: {
  screen: HeroScreen
  order: number
  className: string
}) {
  return (
    <figure
      className={cn(
        "hel-screen absolute overflow-hidden rounded-md border border-line bg-raised",
        className
      )}
      style={{ animationDelay: `${120 + order * 140}ms` }}
    >
      {/* La barre de fenêtre : trois pastilles neutres et le nom du projet. Aucune
          couleur de marque, l'orange de cet écran est déjà pris par le titre et le CTA. */}
      <figcaption className="flex h-7 items-center gap-1.5 border-b border-line bg-surface px-3">
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="ml-2 truncate font-mono text-[0.62rem] text-label">
          {screen.name}
          <span className="max-sm:hidden"> · {screen.sector}</span>
        </span>
      </figcaption>
      <div className="relative aspect-[16/10] bg-inset">
        <Image
          src={screen.media.url}
          alt=""
          fill
          sizes="(min-width: 1024px) 26rem, 70vw"
          // Une capture de site commence par son hero : c'est lui qu'on montre.
          className="object-cover object-top"
          loading="eager"
        />
        <span
          className="hel-screen-veil pointer-events-none absolute inset-0 bg-inverse"
          style={{ animationDelay: `${180 + order * 140}ms` }}
        />
      </div>
    </figure>
  )
}

export { HeroScreens }
