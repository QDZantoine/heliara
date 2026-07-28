"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

/** Durées miroir de celles déclarées dans globals.css. */
const COVER_MS = 300
const REVEAL_MS = 360
/**
 * Répit accordé au navigateur entre l'affichage de la nouvelle page et le lever
 * du voile. Sans lui, le voile se lève pile pendant le premier rendu de la page
 * entrante — mise en page, peinture, hydratation. Ce répit se passe écran
 * couvert : invisible.
 */
const SETTLE_MS = 140
/** Filet de sécurité : si la navigation n’aboutit pas, on rouvre quand même. */
const STUCK_MS = 2500

type Phase = "idle" | "cover" | "reveal"

/** Le lien est-il une navigation interne que nous devons animer ? */
function internalTarget(event: MouseEvent) {
  const anchor = (event.target as Element | null)?.closest("a")
  const href = anchor?.getAttribute("href")
  if (
    !anchor ||
    !href ||
    anchor.target === "_blank" ||
    anchor.hasAttribute("download") ||
    anchor.getAttribute("rel")?.includes("external")
  ) {
    return null
  }

  const url = new URL(href, window.location.href)
  // Liens externes, ancres et navigations vers la page courante : on laisse faire.
  if (
    url.origin !== window.location.origin ||
    url.pathname === window.location.pathname
  ) {
    return null
  }

  return url
}

/**
 * Transition de page : un voile encre apparaît en fondu, la navigation a lieu
 * écran couvert, puis le voile disparaît sur la nouvelle page.
 *
 * Volontairement minimale : un seul élément, une seule propriété animée
 * (`opacity`), composée par le GPU. Rien à synchroniser, aucune mise en page ni
 * peinture pendant l'animation — c'est ce qui la rend fluide par construction.
 *
 * Le voile est piloté par un attribut sur le nœud plutôt que par un état
 * React : aucun rendu pendant l'animation, et la règle
 * `react-hooks/set-state-in-effect` reste satisfaite.
 *
 * Dégradations assumées : sans JavaScript, ou avec `prefers-reduced-motion`,
 * les liens naviguent normalement et le voile ne se déclenche jamais. Le voile
 * est `aria-hidden` et ne capte jamais le pointeur.
 */
function PageCurtain() {
  const router = useRouter()
  const pathname = usePathname()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const coveringRef = React.useRef(false)
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([])

  const setPhase = React.useCallback((phase: Phase) => {
    rootRef.current?.setAttribute("data-phase", phase)
    // Drapeau lu par `Reveal` : pendant la transition, un bloc qui entre dans le
    // champ apparaît sans fondu. Le voile est la transition ; superposer trente
    // fondus de 600 ms par-dessus rend l'arrivée confuse.
    document.documentElement.toggleAttribute("data-curtain", phase !== "idle")
  }, [])

  const after = React.useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms))
  }, [])

  React.useEffect(
    () => () => timersRef.current.forEach((timer) => clearTimeout(timer)),
    []
  )

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const onClick = (event: MouseEvent) => {
      if (
        coveringRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const url = internalTarget(event)
      if (!url) {
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
    // onClick et abandonne si l’évènement est déjà préempté. En bulle, il aurait
    // déjà navigué. Les `onClick` portés par les liens (fermeture du menu
    // mobile) continuent de s’exécuter, la propagation n’étant pas coupée.
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [after, router, setPhase])

  // Nouvelle page affichée : on lève le voile, après avoir laissé le navigateur
  // la peindre. Une navigation qui ne vient pas d’un clic intercepté (retour
  // arrière, lien externe) n’anime rien.
  React.useEffect(() => {
    if (!coveringRef.current) {
      return
    }
    coveringRef.current = false

    let frame = 0
    let done: ReturnType<typeof setTimeout> | undefined
    const settle = setTimeout(() => {
      frame = requestAnimationFrame(() => {
        setPhase("reveal")
        done = setTimeout(() => setPhase("idle"), REVEAL_MS)
      })
    }, SETTLE_MS)

    return () => {
      clearTimeout(settle)
      clearTimeout(done)
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [pathname, setPhase])

  return (
    <div ref={rootRef} data-phase="idle" aria-hidden="true">
      <div className="hel-curtain" />
    </div>
  )
}

export { PageCurtain }
