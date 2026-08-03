import Image from "next/image"

import { cn } from "@/lib/utils"

type LogoProps = {
  /** `inverse` pour les fonds encre (footer, CTA final) : variante blanche seule. */
  tone?: "default" | "inverse"
  /** Passer "" quand le lien parent porte déjà un aria-label. */
  alt?: string
  className?: string
}

const LOCKUP = {
  /** Lockup primaire : symbole orange + wordmark encre. */
  light: {
    src: "/logos/logo-brand-heliara-orange.png",
    width: 406,
    height: 158,
  },
  white: {
    src: "/logos/logo-brand-heliara-white.svg",
    width: 436,
    height: 158,
  },
}

/**
 * Lockup de marque (symbole + wordmark), servi depuis public/logos.
 * `unoptimized` : les fichiers sont déjà minimaux et l'optimiseur d'images
 * n'apporte rien sur un SVG.
 *
 * En thème clair comme en sombre, la bascule est faite en CSS via le variant
 * `dark:` - pas d'état React, donc pas de clignotement à l'hydratation.
 */
function Logo({ tone = "default", alt = "Heliara", className }: LogoProps) {
  const size = "h-7 w-auto"

  if (tone === "inverse") {
    return (
      <Image
        {...LOCKUP.white}
        alt={alt}
        unoptimized
        className={cn(size, className)}
      />
    )
  }

  return (
    <>
      <Image
        {...LOCKUP.light}
        alt={alt}
        priority
        unoptimized
        className={cn(size, "dark:hidden", className)}
      />
      <Image
        {...LOCKUP.white}
        alt=""
        unoptimized
        className={cn(size, "hidden dark:block", className)}
      />
    </>
  )
}

export { Logo }
