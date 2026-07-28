"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

/**
 * Sélecteur de thème discret, placé dans la ligne basse du footer :
 * le dark mode est un citoyen de première classe sans peser sur le header,
 * où le seul point d'attention doit rester le CTA.
 *
 * L'état affiché vient de la classe `.dark` via le variant Tailwind, pas d'un
 * état React : pas de garde `mounted`, donc pas de rendu vide à l'hydratation.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex min-h-11 items-center gap-2 text-inverse-fg-faint transition-colors duration-100 hover:text-inverse-fg-muted"
    >
      <Sun className="hidden size-3.5 dark:block" strokeWidth={1.5} />
      <Moon className="size-3.5 dark:hidden" strokeWidth={1.5} />
      <span className="hidden dark:inline">Thème clair</span>
      <span className="dark:hidden">Thème sombre</span>
    </button>
  )
}

export { ThemeToggle }
