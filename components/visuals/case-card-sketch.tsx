import { Halo } from "@/components/primitives/halo"
import { cn } from "@/lib/utils"

type CaseCardSketchProps = {
  halo: "warm" | "cool"
  accent: "brand" | "info"
  /** Les cartes larges du hub ont un visuel plus haut. */
  tall?: boolean
}

/** Vignette d’interface pour les cartes du hub Réalisations. */
function CaseCardSketch({ halo, accent, tall = false }: CaseCardSketchProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-inset",
        tall ? "h-60" : "h-45"
      )}
    >
      <Halo variant={halo} />
      <div className="absolute top-7 right-7 -bottom-4 left-7 rounded-t-md border border-line bg-raised p-4 shadow-2">
        <div className="grid gap-[7px]">
          <span className="h-2.75 w-[34%] rounded-[4px] bg-inset" />
          <span className="h-5.5 w-[56%] rounded-xs bg-inset" />
          <div className="mt-1 flex gap-[7px]">
            <span className="h-11.5 flex-1 rounded-xs bg-inset" />
            <span
              className={cn(
                "h-11.5 flex-1 rounded-xs",
                accent === "brand" ? "bg-brand-subtle" : "bg-info-subtle"
              )}
            />
            <span className="h-11.5 flex-1 rounded-xs bg-inset" />
          </div>
          <span className="h-2.75 w-[72%] rounded-[4px] bg-inset" />
        </div>
      </div>
    </div>
  )
}

export { CaseCardSketch }
