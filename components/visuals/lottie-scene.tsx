"use client"

import * as React from "react"
import type { AnimationItem } from "lottie-web"

import { loadLottie, loadLottieData, whenIdle } from "@/lib/lottie"
import { cn } from "@/lib/utils"

type LottieSceneProps = {
  /** Chemin dans `public/`. */
  src: string
  /**
   * Quand télécharger le lecteur et l'illustration.
   * - `eager` : dès le montage. Pour ce qui est au-dessus de la ligne de flottaison.
   * - `idle` : quand le navigateur est inoccupé.
   * - `visible` : quand la boîte approche du champ. C'est le défaut, et le bon
   *   choix pour tout ce qui est plus bas dans la page : un visiteur qui ne
   *   descend pas ne télécharge rien.
   */
  load?: "eager" | "idle" | "visible"
  speed?: number
  /**
   * Temps d'arrêt sur la dernière image avant de relancer le cycle. À zéro, la
   * boucle est celle de Lottie ; au-delà, elle est pilotée à la main, Lottie ne
   * sachant pas tenir une pause entre deux cycles.
   */
  holdMs?: number
  /** Image affichée sous `prefers-reduced-motion`. Par défaut, la dernière. */
  posterFrame?: number
  className?: string
}

/** Marge d'anticipation : on charge avant que la boîte n'entre dans le champ. */
const PRELOAD_MARGIN = "300px"

/**
 * Lecteur Lottie du site. Quatre usages, une seule implémentation.
 *
 * Précautions communes, à ne pas dupliquer ailleurs :
 * - la boîte est dimensionnée par l'appelant avant tout chargement, donc aucun
 *   décalage de mise en page à l'arrivée de l'illustration ;
 * - la lecture s'arrête hors du champ et ne se relance pas hors du champ ;
 * - sous `prefers-reduced-motion`, l'illustration est figée sur une image
 *   représentative plutôt qu'absente : on garde le visuel, on retire le
 *   mouvement ;
 * - si le lecteur ou le fichier n'arrive pas, la boîte reste vide et le reste de
 *   la page ne bouge pas.
 *
 * Le lecteur (`lottie_light`) et chaque fichier sont mémorisés par `lib/lottie`,
 * donc partagés entre toutes les scènes : un seul chunk, un seul téléchargement
 * par illustration.
 */
function LottieScene({
  src,
  load = "visible",
  speed = 1,
  holdMs = 0,
  posterFrame,
  className,
}: LottieSceneProps) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const animationRef = React.useRef<AnimationItem | null>(null)

  React.useEffect(() => {
    const box = boxRef.current
    if (!box) {
      return
    }

    let cancelled = false
    let observer: IntersectionObserver | undefined
    let cancelIdle: (() => void) | undefined
    let hold: ReturnType<typeof setTimeout> | undefined
    let visible = false
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const start = async () => {
      try {
        const [lottie, animationData] = await Promise.all([
          loadLottie(),
          loadLottieData(src),
        ])
        if (cancelled) {
          return
        }

        const animation = lottie.loadAnimation({
          container: box,
          renderer: "svg",
          loop: holdMs === 0,
          autoplay: false,
          animationData,
        })
        animation.setSpeed(speed)
        animationRef.current = animation
        box.dataset.ready = "true"

        if (reduced) {
          animation.goToAndStop(
            posterFrame ?? Math.max(0, animation.totalFrames - 1),
            true
          )
          return
        }

        if (holdMs > 0) {
          animation.addEventListener("complete", () => {
            hold = setTimeout(() => {
              if (visible) {
                animation.goToAndPlay(0, true)
              }
            }, holdMs)
          })
        }

        if (visible) {
          animation.play()
        }
      } catch {
        // Le lecteur ou l'illustration n'a pas pu être chargé : la boîte reste
        // vide, et le reste de la page ne bouge pas.
      }
    }

    // Un seul observateur sert à déclencher le chargement et à piloter la
    // lecture. La marge d'anticipation vaut pour les deux, ce qui fait démarrer
    // l'animation juste avant qu'elle ne soit vue.
    const observe = () => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visible = entry.isIntersecting
            const animation = animationRef.current

            if (!animation) {
              if (visible && load === "visible") {
                start()
              }
              continue
            }

            if (!visible) {
              animation.pause()
              continue
            }
            // Le cycle s'est terminé pendant l'absence : on repart du début
            // plutôt que de reprendre sur la dernière image.
            if (animation.currentFrame >= animation.totalFrames - 1) {
              animation.goToAndPlay(0, true)
            } else {
              animation.play()
            }
          }
        },
        { rootMargin: PRELOAD_MARGIN }
      )
      observer.observe(box)
    }

    observe()

    if (load === "eager") {
      start()
    } else if (load === "idle") {
      cancelIdle = whenIdle(start)
    }

    return () => {
      cancelled = true
      clearTimeout(hold)
      cancelIdle?.()
      observer?.disconnect()
      animationRef.current?.destroy()
      animationRef.current = null
    }
  }, [src, load, speed, holdMs, posterFrame])

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className={cn(
        "opacity-0 transition-opacity duration-500 ease-inout data-ready:opacity-100",
        className
      )}
    />
  )
}

export { LottieScene }
