import { cn } from "@/lib/utils"

type ContainerProps = React.ComponentProps<"div"> & {
  /** `page` = 1240 px pour les sections · `reading` = 760 px pour la lecture. */
  width?: "page" | "reading"
}

/** Marges latérales 20 / 32 / 40 px (Responsive Guidelines 01). */
function Container({ width = "page", className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 md:px-8 lg:px-10",
        width === "page" ? "max-w-page" : "max-w-reading",
        className
      )}
      {...props}
    />
  )
}

export { Container }
