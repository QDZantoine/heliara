"use client"

import * as React from "react"
import type { AnimationItem } from "lottie-web"

import { loadLottie, loadLottieData } from "@/lib/lottie"
import { cn } from "@/lib/utils"

/** Dernière image : les trois fenêtres empilées, l'état le plus lisible. */
const POSTER_FRAME = 104

/**
 * Illustration du hero : trois fenêtres — wireframe, code, maquette haute
 * fidélité — qui s'empilent en boucle. C'est le propos du studio, montré plutôt
 * qu'écrit, et cela reste dans la règle de la DA : illustration abstraite,
 * volumes simples, jamais de photo ni de 3D gadget.
 *
 * Contrairement aux autres usages de Lottie du site, le chargement n'est pas
 * différé à l'inoccupation : l'illustration est au-dessus de la ligne de
 * flottaison. Il reste posté après le premier rendu, et le LCP est le titre,
 * rendu côté serveur — la charge ne le retarde donc pas.
 *
 * Trois précautions :
 * - la boîte est dimensionnée avant le chargement, donc aucun décalage de mise
 *   en page quand l'illustration arrive ;
 * - la lecture se met en pause dès que l'illustration quitte le champ, pour ne
 *   pas occuper le processeur pendant tout le défilement de la page ;
 * - sous `prefers-reduced-motion`, l'illustration est figée sur sa dernière
 *   image plutôt qu'absente : on garde le visuel, on retire le mouvement.
 *
 * Le build `lottie_light` n'évalue pas les expressions du fichier, qui sont deux
 * formules de rebond élastique. C'est voulu : la DA interdit le rebond, et le
 * rendu est par ailleurs identique — vérifié image par image contre le build
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
          loop: true,
          autoplay: false,
          animationData,
        })
        animationRef.current = animation
        box.dataset.ready = "true"

        if (reduced) {
          animation.goToAndStop(POSTER_FRAME, true)
          return
        }

        // Ne tourne que tant que l'illustration est à l'écran.
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              animation.play()
            } else {
              animation.pause()
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
        "mx-auto aspect-square w-full max-w-[21.25rem] scale-110 opacity-0 transition-opacity duration-500 ease-inout data-ready:opacity-100 md:max-w-[28.75rem] lg:max-w-[33rem] lg:scale-[1.2]",
        className
      )}
    />
  )
}

export { HeroLottie }
