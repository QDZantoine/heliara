import { cn } from "@/lib/utils"

type SectionProps = React.ComponentProps<"section"> & {
  /** Rythme binaire : `sm` pour les sections respirantes, `lg` pour les temps forts. */
  space?: "none" | "sm" | "md" | "lg"
  /** `surface` et `inverse` produisent une rupture de fond, pas un filet. */
  tone?: "page" | "surface" | "inverse"
}

const spaces = {
  none: "",
  sm: "py-10 md:py-12 lg:py-16",
  md: "py-14 md:py-16 lg:py-24",
  lg: "py-16 md:py-20 lg:py-[7.5rem]",
}

const tones = {
  page: "",
  surface: "border-line border-y bg-surface",
  inverse: "bg-inverse",
}

function Section({
  space = "md",
  tone = "page",
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("relative", spaces[space], tones[tone], className)}
      {...props}
    />
  )
}

export { Section }
