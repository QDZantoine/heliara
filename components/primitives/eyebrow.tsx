import { cn } from "@/lib/utils"

type EyebrowProps = React.ComponentProps<"p"> & {
  /** `brand` sur fond clair, `muted` en surtitre neutre, `inverse` sur encre. */
  tone?: "brand" | "muted" | "inverse"
}

const tones = {
  brand: "text-brand-text",
  muted: "text-label",
  inverse: "text-inverse-brand",
}

/** Surtitre de section : capitales, interlettrage large, jamais un titre. */
function Eyebrow({ tone = "brand", className, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.12em] uppercase",
        tones[tone],
        className
      )}
      {...props}
    />
  )
}

export { Eyebrow }
