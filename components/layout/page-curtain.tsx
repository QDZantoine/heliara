"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import type { AnimationItem } from "lottie-web"

import { loadLottie, loadLottieData, whenIdle } from "@/lib/lottie"

/** Fondu d'apparition du voile. */
const COVER_MS = 300
/**
 * Temps minimum écran couvert avant de lever le voile. Il sert deux fins :
 * laisser le navigateur peindre et hydrater la page entrante — sinon ce travail
 * tomberait sur les premières images du lever — et laisser l'illustration se
 * dérouler assez pour être lisible. C'est le réglage à toucher pour rendre la
 * transition plus vive ou plus posée.
 */
const COVERED_MS = 520
/**
 * `REVEAL_MS` doit couvrir la plus longue des deux animations de la phase — la
 * montée de `main`, 560 ms, et non le lever du voile — sinon elle serait
 * retirée en plein vol.
 */
const REVEAL_MS = 580
/** L'illustration fait 1,9 s par cycle : accélérée, on en voit environ la moitié. */
const LOTTIE_SPEED = 1.6
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
 * Transition de page : un voile encre apparaît en fondu avec l'illustration de
 * chargement en son centre, la navigation a lieu écran couvert, puis le voile
 * se lève pendant que la page entrante monte se mettre en place.
 *
 * Le voile est piloté par un attribut sur le nœud plutôt que par un état
 * React : aucun rendu pendant l'animation, et la règle
 * `react-hooks/set-state-in-effect` reste satisfaite. La phase est aussi portée
 * par `<html data-curtain>`, ce qui permet au CSS d'animer `main` sans qu'aucun
 * composant de page ait à le savoir.
 *
 * Le lecteur Lottie (~168 ko) est chargé à la demande, quand le navigateur est
 * inoccupé et jamais avant : il ne pèse pas sur le premier rendu. S'il n'est pas
 * encore prêt, la transition se joue sans illustration.
 *
 * Dégradations assumées : sans JavaScript, ou avec `prefers-reduced-motion`,
 * les liens naviguent normalement, le voile ne se déclenche jamais et le lecteur
 * n'est même pas téléchargé.
 */
function PageCurtain() {
  const router = useRouter()
  const pathname = usePathname()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const markRef = React.useRef<HTMLDivElement>(null)
  const animationRef = React.useRef<AnimationItem | null>(null)
  const coveringRef = React.useRef(false)
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([])

  const setPhase = React.useCallback((phase: Phase) => {
    rootRef.current?.setAttribute("data-phase", phase)

    const root = document.documentElement
    if (phase === "idle") {
      root.removeAttribute("data-curtain")
      animationRef.current?.pause()
    } else {
      root.setAttribute("data-curtain", phase)
    }

    if (phase === "cover") {
      animationRef.current?.goToAndPlay(0, true)
    }
  }, [])

  const after = React.useCallback((ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms))
  }, [])

  React.useEffect(
    () => () => timersRef.current.forEach((timer) => clearTimeout(timer)),
    []
  )

  // Préchargement du lecteur Lottie hors du chemin critique.
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let cancelled = false

    const cancelIdle = whenIdle(async () => {
      try {
        const [lottie, animationData] = await Promise.all([
          loadLottie(),
          loadLottieData("/loading-animation-white.json"),
        ])
        if (cancelled || !markRef.current) {
          return
        }
        const animation = lottie.loadAnimation({
          container: markRef.current,
          renderer: "svg",
          loop: true,
          autoplay: false,
          animationData,
        })
        animation.setSpeed(LOTTIE_SPEED)
        animationRef.current = animation
      } catch {
        // Le lecteur ou l'illustration n'a pas pu être chargé : la transition
        // se joue sans, ce qui est un défaut acceptable.
      }
    })

    return () => {
      cancelled = true
      cancelIdle()
      animationRef.current?.destroy()
      animationRef.current = null
    }
  }, [])

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

  // Nouvelle page affichée : on lève le voile, après le temps couvert minimum.
  // Une navigation qui ne vient pas d’un clic intercepté (retour arrière, lien
  // externe) n’anime rien.
  React.useEffect(() => {
    if (!coveringRef.current) {
      return
    }
    coveringRef.current = false

    let frame = 0
    let done: ReturnType<typeof setTimeout> | undefined
    const covered = setTimeout(() => {
      frame = requestAnimationFrame(() => {
        setPhase("reveal")
        done = setTimeout(() => setPhase("idle"), REVEAL_MS)
      })
    }, COVERED_MS)

    return () => {
      clearTimeout(covered)
      clearTimeout(done)
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [pathname, setPhase])

  return (
    <div ref={rootRef} data-phase="idle" aria-hidden="true">
      <div className="hel-curtain">
        <div className="hel-curtain-mark">
          <div ref={markRef} className="hel-curtain-lottie" />
        </div>
      </div>
    </div>
  )
}

export { PageCurtain }
