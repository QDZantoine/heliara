import { cn } from "@/lib/utils"

type LogoProps = {
  tone?: "default" | "inverse"
  className?: string
}

/** Wordmark bas de casse + point orange (DA v2, 07 Synthèse). */
function Logo({ tone = "default", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-display text-[1.1875rem] font-bold tracking-[-0.02em]",
        tone === "inverse" ? "text-inverse-fg" : "text-ink",
        className
      )}
    >
      heliara
      <span
        className={tone === "inverse" ? "text-inverse-brand" : "text-brand"}
      >
        .
      </span>
    </span>
  )
}

export { Logo }
