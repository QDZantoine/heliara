import { cn } from "@/lib/utils"

type HaloProps = {
  /** `hero` combine les deux lobes en une seule couche. */
  variant?: "hero" | "warm" | "cool" | "inverse"
  className?: string
}

const variants = {
  hero: "bg-[image:var(--hel-halo-hero)]",
  warm: "bg-[image:var(--hel-halo-warm)]",
  cool: "bg-[image:var(--hel-halo-cool)]",
  inverse: "bg-[image:var(--hel-halo-inverse)]",
}

/**
 * Lueur radiale d'arrière-plan. Un seul halo par écran (DA v2, 06).
 * Le parent doit être `relative` et, si le halo dépasse, `overflow-hidden`.
 */
function Halo({ variant = "warm", className }: HaloProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        variants[variant],
        className
      )}
    />
  )
}

export { Halo }
