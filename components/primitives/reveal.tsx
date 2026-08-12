"use client"

import * as React from "react"

type RevealProps = React.ComponentProps<"div"> & {
  /** Décalage d'entrée en ms, pour égrener une grille de cartes. */
  delay?: number
  /**
   * Pour un bloc **déjà dans le champ au chargement**, le hero au premier chef.
   *
   * Il entre alors par une animation CSS qui part au premier rendu, sans attendre
   * l'hydratation ni l'observer - lesquels n'apprendraient de toute façon rien : le
   * bloc est visible avant que le JavaScript n'existe.
   *
   * **Ce n'est pas un réglage d'esthétique, c'est le LCP.** Mesuré sur `pnpm build`
   * en 1440 x 900 : le titre de l'accueil, plus grand élément de la page à 147 525 px²,
   * n'était peint qu'à 808 ms, le temps que React hydrate et que l'observer se
   * déclenche. Chrome retenait entre-temps un logo client de 4 320 px² - d'où
   * l'avertissement de Next réclamant `loading="eager"` sur une image qui n'est pas le
   * sujet. En animation CSS, le titre est peint à 96 ms.
   */
  immediate?: boolean
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
 *
 * **`immediate` remplace tout cela par une animation CSS** pour les blocs déjà dans le
 * champ au chargement : même geste à l'œil, mais peint sans attendre l'hydratation.
 */
function Reveal({
  delay = 0,
  immediate = false,
  style,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    /*
      Rien à observer pour un bloc qui entre au premier rendu. Le `return` est ici et
      non avant l'effet : la règle des Hooks interdit d'appeler `useEffect` sous
      condition, et le tester dans son corps revient au même à l'exécution.
    */
    if (immediate) {
      return
    }

    const el = ref.current
    if (!el) {
      return
    }

    const reveal = () => {
      // Révélé pendant une transition de page : pas de fondu, le rideau suffit.
      // Décidé ici et non au montage, pour que les blocs sous la ligne de
      // flottaison gardent leur apparition au scroll.
      if (document.documentElement.hasAttribute("data-curtain")) {
        el.setAttribute("data-reveal-now", "")
      }
      el.setAttribute("data-reveal", "in")
    }

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
  }, [immediate])

  return (
    <div
      ref={ref}
      data-reveal={immediate ? "entering" : "pending"}
      /*
        Le décalage porte sur l'animation d'un côté, sur la transition de l'autre : ce
        sont deux mécaniques, et une `transitionDelay` sur un bloc animé par keyframes
        n'aurait aucun effet.
      */
      style={
        delay
          ? {
              ...style,
              ...(immediate
                ? { animationDelay: `${delay}ms` }
                : { transitionDelay: `${delay}ms` }),
            }
          : style
      }
      {...props}
    />
  )
}

export { Reveal }
