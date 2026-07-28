"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

/** Durées miroir de celles déclarées dans globals.css (animation + décalage). */
const COVER_MS = 560
const REVEAL_MS = 610
/** Filet de sécurité : si la navigation n’aboutit pas, on rouvre quand même. */
const STUCK_MS = 2500

type Phase = "idle" | "cover" | "reveal"

/**
 * Transition de page en rideau : deux arcs balaient l’écran de bas en haut
 * (gris devant, orange derrière), la navigation a lieu écran couvert, puis les
 * arcs sortent par le haut sur la nouvelle page.
 *
 * Le rideau est piloté par un attribut sur le nœud plutôt que par un état
 * React : aucun rendu pendant l’animation, et la règle
 * `react-hooks/set-state-in-effect` reste satisfaite.
 *
 * Dégradations assumées : sans JavaScript, ou avec `prefers-reduced-motion`,
 * les liens naviguent normalement et le rideau ne se déclenche jamais. Le
 * rideau est `aria-hidden` et ne capte jamais le pointeur.
 */
function PageCurtain() {
  const router = useRouter()
  const pathname = usePathname()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const coveringRef = React.useRef(false)
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([])

  const setPhase = React.useCallback((phase: Phase) => {
    rootRef.current?.setAttribute("data-phase", phase)
  }, [])

  const after = React.useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms))
  }, [])

  React.useEffect(
    () => () => timersRef.current.forEach((timer) => clearTimeout(timer)),
    []
  )

  // Interception des clics sur les liens internes : couvrir, puis naviguer.
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const anchor = (event.target as Element | null)?.closest("a")
      const href = anchor?.getAttribute("href")
      if (
        !anchor ||
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      ) {
        return
      }

      const url = new URL(href, window.location.href)
      // Liens externes, ancres et navigations vers la page courante : on laisse faire.
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
      ) {
        return
      }

      event.preventDefault()
      coveringRef.current = true
      setPhase("cover")
      after(COVER_MS, () => router.push(url.pathname + url.search + url.hash))
      after(STUCK_MS, () => {
        if (coveringRef.current) {
          coveringRef.current = false
          setPhase("reveal")
          after(REVEAL_MS, () => setPhase("idle"))
        }
      })
    }

    // Phase de capture obligatoire : `next/link` navigue dans son propre
    // onClick et abandonne si l'évènement est déjà préempté. En bulle, il aurait
    // déjà navigué. Les `onClick` portés par les liens (fermeture du menu
    // mobile) continuent de s'exécuter, la propagation n'étant pas coupée.
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [after, router, setPhase])

  // Nouvelle page affichée : on ouvre le rideau. Une navigation qui ne vient
  // pas d’un clic intercepté (retour arrière, lien externe) n’anime rien.
  React.useEffect(() => {
    if (!coveringRef.current) {
      return
    }
    coveringRef.current = false
    setPhase("reveal")
    const timer = setTimeout(() => setPhase("idle"), REVEAL_MS)
    return () => clearTimeout(timer)
  }, [pathname, setPhase])

  return (
    <div ref={rootRef} data-phase="idle" aria-hidden="true">
      <div className="hel-curtain">
        <div className="hel-curtain-layer hel-curtain-back" />
        <div className="hel-curtain-layer hel-curtain-front" />
      </div>
    </div>
  )
}

export { PageCurtain }
