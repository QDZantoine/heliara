"use client"

import { useEffect, useRef } from "react"

/**
 * Un bouton qui vient au-devant du pointeur, de quelques pixels.
 *
 * Le conteneur suit le pointeur quand il est dessus ou à moins de `reach` pixels :
 * déplacement proportionnel à la distance au centre, plafonné à `pull`, puis retour
 * en place au départ. Transformation seule, aucun état React, une écriture par image
 * au plus - la même discipline que `PointerField`.
 *
 * Trois gardes : pointeur fin seulement (au doigt, il n'y a rien à suivre),
 * `prefers-reduced-motion` respecté, et le conteneur ne porte que le `transform` -
 * le bouton garde ses propres survol et pression.
 */
function Magnetic({
  pull = 6,
  reach = 28,
  className,
  children,
}: {
  /** Déplacement maximal, en pixels. */
  pull?: number
  /** Distance autour du bouton, en pixels, à partir de laquelle il réagit. */
  reach?: number
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const fine = window.matchMedia("(pointer: fine)")
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!fine.matches || reduce.matches) return

    let frame = 0
    let resting = true
    const write = (x: number, y: number) => {
      const rest = x === 0 && y === 0
      if (rest && resting) return
      resting = rest
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      })
    }

    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect()
      const dx = event.clientX - (box.left + box.width / 2)
      const dy = event.clientY - (box.top + box.height / 2)
      const inside =
        Math.abs(dx) < box.width / 2 + reach &&
        Math.abs(dy) < box.height / 2 + reach
      if (!inside) {
        write(0, 0)
        return
      }
      write(
        Math.max(-pull, Math.min(pull, (dx / box.width) * pull * 2)),
        Math.max(-pull, Math.min(pull, (dy / box.height) * pull * 2))
      )
    }
    const onLeave = () => write(0, 0)

    // Écouté sur la fenêtre : la zone de réaction déborde du bouton.
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
      node.style.transform = ""
    }
  }, [pull, reach])

  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: "transform 420ms var(--hel-ease-expo)" }}
    >
      {children}
    </div>
  )
}

export { Magnetic }
