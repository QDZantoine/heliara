import Image from "next/image"

import type { MediaRef } from "@/lib/media"
import { cn } from "@/lib/utils"

export type HeroScreen = { media: MediaRef; name: string; sector: string }

/**
 * Des produits livrés, posés comme des écrans allumés, et vivants.
 *
 * **« Montrer le produit, pas la matière »** : c'est la phrase de la DA, prise au mot. Le
 * hero montre des interfaces réellement en production, ce qu'un prospect ne peut pas
 * soupçonner d'être un décor.
 *
 * **Quatre mouvements, tous sur `opacity` et `transform`** :
 *
 * 1. l'allumage, une fois : chaque fenêtre monte pendant qu'un voile encre se retire ;
 * 2. une flottaison lente, à trois rythmes, pour que la composition respire ;
 * 3. un reflet qui balaie les vitres de temps à autre - la « lumière d'écran » ;
 * 4. une relève : chaque fenêtre passe à un autre projet puis revient, en décalé. Les
 *    trois fenêtres montrent toujours trois projets distincts.
 *
 * La profondeur au pointeur est portée par `PointerField`, qui pose `--px` et `--py`
 * sur le hero : chaque fenêtre s'y décale selon sa `--depth`, de quelques pixels.
 *
 * Sous `prefers-reduced-motion`, tout est figé sur la composition de départ. Sans
 * JavaScript, seule la profondeur au pointeur manque.
 *
 * Décoratif (`aria-hidden`) : les mêmes projets sont nommés et liés plus bas.
 */
function HeroScreens({ screens }: { screens: HeroScreen[] }) {
  const count = screens.length
  // La relève de la fenêtre `k` : trois projets plus loin quand il y en a assez, sinon
  // le suivant. Dans les deux cas, les trois fenêtres restent distinctes entre elles.
  const relief = (k: number) => screens[(k + (count > 3 ? 3 : 1)) % count]

  const places = [
    { box: "top-0 left-0 w-[68%]", depth: 8, float: "animate-float-slow" },
    { box: "top-[16%] right-0 w-[64%]", depth: 14, float: "animate-float-mid" },
    {
      box: "bottom-[2%] left-[14%] w-[72%]",
      depth: 22,
      float: "animate-float",
    },
  ]
  const shadows = ["shadow-2", "shadow-3", "shadow-4"]
  // L'écart au défilement (`hel-spread`) : les deux du fond s'éloignent vers leur
  // coin, celle de devant vient vers soi.
  const spreads = [
    { "--sx": "-56px", "--sy": "-40px", "--ss": "0.94" },
    { "--sx": "64px", "--sy": "-24px", "--ss": "0.94" },
    { "--sx": "0px", "--sy": "40px", "--ss": "1.14" },
  ]

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[6/5] w-full max-w-[36rem] lg:max-w-[44rem]"
    >
      {places.map((place, k) => (
        <div
          key={k}
          className={cn("hel-depth absolute", place.box)}
          style={{ "--depth": `${place.depth}px` } as React.CSSProperties}
        >
          <div className="hel-spread" style={spreads[k] as React.CSSProperties}>
            <div className={place.float}>
              <Screen
                first={screens[k]}
                second={relief(k)}
                order={k}
                shadow={shadows[k]}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Screen({
  first,
  second,
  order,
  shadow,
}: {
  first: HeroScreen
  second: HeroScreen
  order: number
  shadow: string
}) {
  const swapDelay = { animationDelay: `${3200 + order * 1800}ms` }

  return (
    <figure
      className={cn(
        "hel-screen relative overflow-hidden rounded-md border border-line bg-raised",
        shadow
      )}
      style={{ animationDelay: `${120 + order * 140}ms` }}
    >
      {/* La barre de fenêtre : trois pastilles neutres et le nom du projet. Aucune
          couleur de marque, l'orange de cet écran est déjà pris par le titre et le CTA. */}
      <figcaption className="relative flex h-7 items-center gap-1.5 border-b border-line bg-surface px-3">
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <Caption screen={first} className="hel-caption-out" style={swapDelay} />
        <Caption screen={second} className="hel-caption-in" style={swapDelay} />
      </figcaption>
      <div className="relative aspect-[16/10] overflow-hidden bg-inset">
        <Capture screen={first} />
        <Capture
          screen={second}
          className="hel-screen-swap"
          style={swapDelay}
        />
        <span
          className="hel-screen-sweep pointer-events-none absolute inset-0"
          style={{ animationDelay: `${1400 + order * 2600}ms` }}
        />
        <span
          className="hel-screen-veil pointer-events-none absolute inset-0 bg-inverse"
          style={{ animationDelay: `${180 + order * 140}ms` }}
        />
      </div>
    </figure>
  )
}

function Caption({
  screen,
  className,
  style,
}: {
  screen: HeroScreen
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={cn(
        "absolute inset-y-0 right-3 left-12 flex items-center truncate font-mono text-[0.62rem] text-label",
        className
      )}
      style={style}
    >
      {screen.name}
      <span className="max-sm:hidden">&nbsp;· {screen.sector}</span>
    </span>
  )
}

function Capture({
  screen,
  className,
  style,
}: {
  screen: HeroScreen
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <Image
      src={screen.media.url}
      alt=""
      fill
      sizes="(min-width: 1024px) 26rem, 70vw"
      // Une capture de site commence par son hero : c'est lui qu'on montre.
      className={cn("object-cover object-top", className)}
      style={style}
      loading="eager"
    />
  )
}

export { HeroScreens }
