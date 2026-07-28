"use client"

import * as React from "react"

type RevealProps = React.ComponentProps<"div"> & {
  /** Décalage d'entrée en ms, pour égrener une grille de cartes. */
  delay?: number
}

/**
 * Apparition au scroll : fondu + translation 14 px, 600 ms expo-out.
 *
 * L'état de repos est porté par le CSS
 * (`[data-reveal-ready] [data-reveal="pending"]`) et le drapeau
 * `data-reveal-ready` est posé par un script inline dans le layout. Sans
 * JavaScript, l'attribut n'existe pas et le contenu reste visible.
 * `prefers-reduced-motion` neutralise l'effet côté CSS et côté observer.
 *
 * L'attribut est basculé directement sur le nœud plutôt que via un état React :
 * l'observer est un système externe, et cela évite un rendu par bloc révélé.
 */
function Reveal({ delay = 0, style, ...props }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    const reveal = () => el.setAttribute("data-reveal", "in")

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal()
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal="pending"
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...props}
    />
  )
}

export { Reveal }
