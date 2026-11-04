import Image from "next/image"

import type { MediaRef } from "@/lib/media"
import { cn } from "@/lib/utils"

export type HeroScreen = { media: MediaRef; name: string; sector: string }

/**
 * Le mur de produits du hero : des sites réellement livrés, posés en éventail sur un
 * plan incliné qui s'enfonce dans l'écran.
 *
 * **« Montrer le produit, pas la matière »**, la phrase de la DA, prise au mot : ce
 * sont des captures de projets en production, pas un décor. L'effet tient à trois
 * choses, toutes sur `transform` :
 *
 * 1. **le plan est incliné** (`rotateX`, `--tilt`) et chaque fenêtre est reculée
 *    selon son rang (`translateZ`) - le centre devant, les bords au fond ;
 * 2. **il s'oriente au pointeur** (`hel-wall-tilt`, lit `--px` et `--py` posés par
 *    `PointerField`) ;
 * 3. **il se redresse au défilement** et vient remplir l'écran (`hel-wall-plane`,
 *    voir `globals.css`) pendant que le hero reste épinglé.
 *
 * Les fenêtres s'allument une fois (`hel-screen`, fondu depuis une opacité nulle) :
 * **c'est aussi ce qui garde le titre au LCP**, Chrome n'élisant pas un élément peint
 * à opacité nulle. La capture du centre est plus grande que le titre ; peinte
 * d'emblée, elle lui prendrait la place.
 *
 * Cinq emplacements, remplis dans l'ordre centre, gauche, droite, puis les deux bords.
 * Avec trois projets, les bords restent vides et l'éventail reste lisible.
 *
 * Décoratif (`aria-hidden`) : les mêmes projets sont nommés et liés plus bas.
 */
const slots = [
  // Centre, devant.
  { box: "left-[32%] top-0 w-[36%]", z: "0px", shadow: "shadow-4" },
  // Gauche et droite, un cran derrière.
  { box: "left-[4%] top-[9%] w-[30%]", z: "-140px", shadow: "shadow-3" },
  { box: "left-[66%] top-[9%] w-[30%]", z: "-140px", shadow: "shadow-3" },
  // Les bords, au fond, à moitié hors champ.
  { box: "-left-[22%] top-[20%] w-[26%]", z: "-300px", shadow: "shadow-2" },
  { box: "left-[96%] top-[20%] w-[26%]", z: "-300px", shadow: "shadow-2" },
]

function HeroWall({ screens }: { screens: HeroScreen[] }) {
  return (
    /*
      Trois enveloppes pour trois mouvements, chacune sur son propre `transform` :
      le centrage (flex, le plan est plus large que l'écran et déborde des deux côtés
      à parts égales), l'orientation au pointeur, l'inclinaison et le redressement.
    */
    <div aria-hidden="true" className="flex justify-center">
      <div className="hel-wall-tilt shrink-0">
        <div className="hel-wall-plane relative aspect-[16/6] w-[230vw] sm:w-[160vw] lg:w-[min(96rem,112vw)]">
          {slots.slice(0, screens.length).map((slot, index) => (
            <div
              key={index}
              className={cn("absolute", slot.box)}
              style={{ transform: `translateZ(${slot.z})` }}
            >
              <Screen
                screen={screens[index]}
                order={index}
                shadow={slot.shadow}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Screen({
  screen,
  order,
  shadow,
}: {
  screen: HeroScreen
  order: number
  shadow: string
}) {
  return (
    <figure
      className={cn(
        "hel-screen relative overflow-hidden rounded-lg border border-line bg-raised",
        shadow
      )}
      style={{ animationDelay: `${260 + order * 120}ms` }}
    >
      {/* La barre de fenêtre : trois pastilles neutres et le nom du projet. Aucune
          couleur de marque, l'orange de cet écran est déjà pris par le titre et le CTA. */}
      <figcaption className="flex h-7 items-center gap-1.5 border-b border-line bg-surface px-3">
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="ml-3 truncate font-mono text-[0.62rem] text-label">
          {screen.name}
          <span className="max-sm:hidden">&nbsp;· {screen.sector}</span>
        </span>
      </figcaption>
      <div className="relative aspect-[16/10] overflow-hidden bg-inset">
        <Image
          src={screen.media.url}
          alt=""
          fill
          // Le centre occupe un gros tiers du plan, les autres moins.
          sizes={
            order === 0
              ? "(min-width: 1024px) 36vw, 80vw"
              : "(min-width: 1024px) 30vw, 60vw"
          }
          // Une capture de site commence par son hero : c'est lui qu'on montre.
          className="object-cover object-top"
          loading="eager"
        />
        <span
          className="hel-screen-sweep pointer-events-none absolute inset-0"
          style={{ animationDelay: `${1600 + order * 2200}ms` }}
        />
        <span
          className="hel-screen-veil pointer-events-none absolute inset-0 bg-inverse"
          style={{ animationDelay: `${320 + order * 120}ms` }}
        />
      </div>
    </figure>
  )
}

export { HeroWall }
