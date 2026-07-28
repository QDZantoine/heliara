"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { Logo } from "@/components/layout/logo"

/** Durées miroir de celles déclarées dans globals.css : 700 ms de course par
    trait, plus 60 ms de décalage entre nappes et 50 ms entre traits. */
const COVER_MS = 860
const REVEAL_MS = 880
/** Nombre de traits par nappe. Trois suffisent et coûtent moins de texture. */
const STROKES = [0, 1, 2]
/** Au-delà, on considère que le pointerdown n'a pas mené à une navigation. */
const DISARM_MS = 600
/** Filet de sécurité : si la navigation n’aboutit pas, on rouvre quand même. */
const STUCK_MS = 2500

type Phase = "idle" | "armed" | "cover" | "reveal"

/** Le lien est-il une navigation interne que nous devons animer ? */
function internalTarget(event: MouseEvent | PointerEvent) {
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
 * Transition de page en traits de crayon : trois traits en lentille balaient
 * l’écran en diagonale et grossissent jusqu’à se rejoindre. La nappe orange est
 * décalée d’un demi-trait et part la première, si bien que l’orange n’apparaît
 * que dans les interstices que l’encre n’a pas encore refermés. La navigation a
 * lieu écran couvert, puis l’encre se retire et les traits orange ferment la
 * marche.
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

  const phaseIs = React.useCallback(
    (phase: Phase) => rootRef.current?.getAttribute("data-phase") === phase,
    []
  )

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

    // Pré-armement : la promotion des couches de composition a lieu ici, avant
    // le clic, et non au premier frame de l'animation où elle se voit.
    const onPointerDown = (event: PointerEvent) => {
      if (!phaseIs("idle") || !internalTarget(event)) {
        return
      }
      setPhase("armed")
      after(DISARM_MS, () => {
        if (phaseIs("armed")) {
          setPhase("idle")
        }
      })
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
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("click", onClick, true)
    }
  }, [after, phaseIs, router, setPhase])

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
        {(["trace", "ink"] as const).map((nappe) => (
          <div
            key={nappe}
            className={`hel-curtain-field hel-curtain-field--${nappe}`}
          >
            {STROKES.map((index) => (
              <div
                key={index}
                className="hel-curtain-stroke"
                style={
                  {
                    top: `${index * 33}%`,
                    // Ordre inversé : le geste part du bas vers le haut.
                    "--stroke": STROKES.length - 1 - index,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}
        <div className="hel-curtain-mark">
          <Logo tone="inverse" alt="" className="h-8" />
        </div>
      </div>
    </div>
  )
}

export { PageCurtain }
