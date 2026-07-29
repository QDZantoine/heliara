"use client"

import * as React from "react"
import type { AnimationItem } from "lottie-web"

import { loadLottie, loadLottieData } from "@/lib/lottie"
import { cn } from "@/lib/utils"

/** Dernière image : les trois fenêtres empilées, l'état le plus lisible. */
const POSTER_FRAME = 104
/** 3,5 s d'origine, ramenées à 8 s : le geste doit être posé, pas démonstratif. */
const SPEED = 0.44
/**
 * Temps d'arrêt sur la composition terminée avant de relancer le cycle. Sans
 * lui, l'empilement se défait aussitôt qu'il est complet et l'on n'a pas le
 * temps de le lire. C'est cette respiration, plus que la lenteur, qui rend
 * l'illustration calme.
 *
 * La pause perçue est plus longue que cette valeur : la fin du fichier compte
 * environ une seconde sans changement visible, qui s'y ajoute. Mesuré sur le
 * rendu : cycle de 10 s, dont 6,7 s de mouvement et 3,3 s d'arrêt.
 */
const HOLD_MS = 2200

/**
 * Illustration du hero : trois fenêtres - wireframe, code, maquette haute
 * fidélité - qui s'empilent lentement, tiennent la pose, puis recommencent.
 * C'est le propos du studio, montré plutôt qu'écrit, et cela reste dans la règle
 * de la DA : illustration abstraite, volumes simples, jamais de photo ni de 3D
 * gadget.
 *
 * La boucle est pilotée à la main (`loop: false` plus un délai à la fin) parce
 * que Lottie ne sait pas tenir une pause entre deux cycles.
 *
 * Contrairement aux autres usages de Lottie du site, le chargement n'est pas
 * différé à l'inoccupation : l'illustration est au-dessus de la ligne de
 * flottaison. Il reste posté après le premier rendu, et le LCP est le titre,
 * rendu côté serveur - la charge ne le retarde donc pas.
 *
 * Trois précautions :
 * - la boîte est dimensionnée avant le chargement, donc aucun décalage de mise
 *   en page quand l'illustration arrive ;
 * - la lecture s'arrête dès que l'illustration quitte le champ, et le cycle ne
 *   se relance pas hors champ : rien n'occupe le processeur pendant le reste du
 *   défilement ;
 * - sous `prefers-reduced-motion`, l'illustration est figée sur sa dernière
 *   image plutôt qu'absente : on garde le visuel, on retire le mouvement.
 *
 * Le build `lottie_light` n'évalue pas les expressions du fichier, qui sont deux
 * formules de rebond élastique. C'est voulu : la DA interdit le rebond, et le
 * rendu est par ailleurs identique - vérifié image par image contre le build
 * complet.
 */
function HeroLottie({ className }: { className?: string }) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const animationRef = React.useRef<AnimationItem | null>(null)

  React.useEffect(() => {
    const box = boxRef.current
    if (!box) {
      return
    }

    let cancelled = false
    let observer: IntersectionObserver | undefined
    let hold: ReturnType<typeof setTimeout> | undefined
    let visible = false
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const start = async () => {
      try {
        const [lottie, animationData] = await Promise.all([
          loadLottie(),
          loadLottieData("/hero-product.json"),
        ])
        if (cancelled) {
          return
        }

        const animation = lottie.loadAnimation({
          container: box,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData,
        })
        animation.setSpeed(SPEED)
        animationRef.current = animation
        box.dataset.ready = "true"

        if (reduced) {
          animation.goToAndStop(POSTER_FRAME, true)
          return
        }

        // Fin de cycle : on tient la pose, puis on repart - jamais hors champ.
        const onComplete = () => {
          hold = setTimeout(() => {
            if (visible) {
              animation.goToAndPlay(0, true)
            }
          }, HOLD_MS)
        }
        animation.addEventListener("complete", onComplete)

        // Ne tourne que tant que l'illustration est à l'écran.
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            visible = entry.isIntersecting
            if (!visible) {
              animation.pause()
              continue
            }
            // Le cycle s'est terminé pendant l'absence : on le relance depuis
            // le début plutôt que de reprendre sur la dernière image.
            if (animation.currentFrame >= animation.totalFrames - 1) {
              animation.goToAndPlay(0, true)
            } else {
              animation.play()
            }
          }
        })
        observer.observe(box)
      } catch {
        // Le lecteur ou l'illustration n'a pas pu être chargé : la boîte reste
        // vide, le hero garde son titre et ses deux CTA.
      }
    }

    start()

    return () => {
      cancelled = true
      clearTimeout(hold)
      observer?.disconnect()
      animationRef.current?.destroy()
      animationRef.current = null
    }
  }, [])

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className={cn(
        // L'artboard porte de larges marges internes : la mise à l'échelle leur
        // fait rendre l'espace, sans toucher à la mise en page puisqu'un
        // transform ne l'affecte pas. Le débord n'est que du transparent.
        "mx-auto aspect-square w-full max-w-85 scale-110 opacity-0 transition-opacity duration-500 ease-inout data-ready:opacity-100 md:max-w-115 lg:max-w-132 lg:scale-[1.2]",
        className
      )}
    />
  )
}

export { HeroLottie }
