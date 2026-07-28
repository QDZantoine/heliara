"use client"

import * as React from "react"

type ParallaxProps = React.ComponentProps<"div"> & {
  /** Fraction du défilement appliquée en translation verticale. */
  factor?: number
  /** Plafond de défilement pris en compte, en px. */
  max?: number
}

/**
 * Translation verticale légère au défilement, réservée au desktop.
 * Neutralisée sous 1024 px et sous `prefers-reduced-motion`
 * (Responsive Guidelines 06). Écrit directement le transform dans une frame
 * d'animation : aucun rendu React au scroll.
 */
function Parallax({
  factor = 0.05,
  max = 600,
  children,
  ...props
}: ParallaxProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (
      !el ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(min-width: 1024px)").matches
    ) {
      return
    }

    let frame = 0
    const onScroll = () => {
      if (frame) {
        return
      }
      frame = requestAnimationFrame(() => {
        frame = 0
        const offset = Math.min(window.scrollY, max) * factor
        el.style.transform = `translate3d(0, ${offset}px, 0)`
      })
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) {
        cancelAnimationFrame(frame)
      }
      el.style.transform = ""
    }
  }, [factor, max])

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
}

export { Parallax }
