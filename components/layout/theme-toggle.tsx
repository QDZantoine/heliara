"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import type { AnimationItem } from "lottie-web"
import { Moon, Sun } from "lucide-react"

import { loadLottie, loadLottieData, whenIdle } from "@/lib/lottie"

/**
 * Repères relevés dans `public/theme-toggle.json` (60 i/s, 481 images). Le
 * fichier enchaîne les deux bascules avec de longues tenues entre elles ; on ne
 * joue que les transitions, et l'on se repose sur l'image de tenue d'où part la
 * transition suivante - les tenues étant visuellement identiques, le saut de
 * l'une à l'autre ne se voit pas.
 */
const LIGHT_REST = 40
const DARK_REST = 305
const TO_DARK: [number, number] = [40, 120]
const TO_LIGHT: [number, number] = [305, 400]
/** Deux secondes d'origine par bascule : bien trop lent pour une commande. */
const SPEED = 2.2

/**
 * Sélecteur de thème, placé dans la ligne basse du footer : le dark mode est un
 * citoyen de première classe sans peser sur le header, où le seul point
 * d'attention doit rester le CTA.
 *
 * L'interrupteur est une illustration Lottie, chargée quand le navigateur est
 * inoccupé. Avant qu'elle n'arrive - et si elle n'arrive jamais - les icônes
 * lucide tiennent le rôle : la commande est fonctionnelle dès le premier rendu.
 *
 * L'illustration suit `resolvedTheme` plutôt que le clic, ce qui la garde juste
 * quand le thème change par un autre chemin (raccourci clavier, préférence
 * système). Le libellé accessible vient des deux `<span>` permutés par le
 * variant `dark:` : pas d'état React, donc pas de rendu vide à l'hydratation.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const boxRef = React.useRef<HTMLSpanElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const animationRef = React.useRef<AnimationItem | null>(null)
  const previousRef = React.useRef<string | undefined>(undefined)

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    let cancelled = false
    const button = buttonRef.current

    const cancelIdle = whenIdle(async () => {
      try {
        const [lottie, animationData] = await Promise.all([
          loadLottie(),
          loadLottieData("/theme-toggle.json"),
        ])
        if (cancelled || !boxRef.current) {
          return
        }
        const animation = lottie.loadAnimation({
          container: boxRef.current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData,
        })
        animation.setSpeed(SPEED)
        // L'état de départ est lu sur le DOM : c'est la source de vérité du
        // thème, et elle est juste avant que next-themes ait résolu quoi que ce soit.
        const isDark = document.documentElement.classList.contains("dark")
        animation.goToAndStop(isDark ? DARK_REST : LIGHT_REST, true)
        animationRef.current = animation
        button?.setAttribute("data-lottie", "ready")
      } catch {
        // Rien à faire : les icônes lucide restent en place.
      }
    })

    return () => {
      cancelled = true
      cancelIdle()
      animationRef.current?.destroy()
      animationRef.current = null
      button?.removeAttribute("data-lottie")
    }
  }, [])

  // Suit le thème, d'où qu'il vienne. Le premier passage ne fait que se poser.
  React.useEffect(() => {
    if (!resolvedTheme) {
      return
    }

    // Le thème précédent est mémorisé même quand l'illustration n'est pas encore
    // chargée : sinon la première bascule serait prise pour un premier rendu et
    // sauterait à l'état final au lieu de s'animer.
    const previous = previousRef.current
    previousRef.current = resolvedTheme

    const animation = animationRef.current
    if (!animation) {
      return
    }

    const isDark = resolvedTheme === "dark"
    if (previous && previous !== resolvedTheme) {
      animation.playSegments([isDark ? TO_DARK : TO_LIGHT], true)
    } else {
      animation.goToAndStop(isDark ? DARK_REST : LIGHT_REST, true)
    }
  }, [resolvedTheme])

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="hel-theme-toggle inline-flex min-h-11 cursor-pointer items-center gap-2 text-inverse-fg-faint transition-colors duration-100 hover:text-inverse-fg-muted"
    >
      <Sun
        aria-hidden="true"
        className="hel-theme-icon hidden size-3.5 dark:block"
        strokeWidth={1.5}
      />
      <Moon
        aria-hidden="true"
        className="hel-theme-icon size-3.5 dark:hidden"
        strokeWidth={1.5}
      />
      <span ref={boxRef} aria-hidden="true" className="hel-theme-lottie" />
      <span className="hidden dark:inline">Thème clair</span>
      <span className="dark:hidden">Thème sombre</span>
    </button>
  )
}

export { ThemeToggle }
