import { Halo } from "@/components/primitives/halo"
import { cn } from "@/lib/utils"

type CaseSketchProps = {
  halo: "warm" | "cool"
  /** Teinte du bloc mis en avant : suit la couleur de secteur de la carte. */
  accent: "brand" | "info"
}

/**
 * Vue produit schématique d'une étude de cas : carte débordant du cadre pour
 * suggérer la profondeur. À remplacer par les captures réelles des produits.
 */
function CaseSketch({ halo, accent }: CaseSketchProps) {
  return (
    <div className="relative min-h-70 overflow-hidden bg-inset">
      <Halo variant={halo} />
      <div className="absolute top-9 -right-10 -bottom-6 left-8 rounded-tl-md border border-line bg-raised p-4.5 shadow-3">
        <div className="mb-3.5 flex gap-1.5">
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </div>
        <div className="grid gap-2">
          <span className="h-3 w-[38%] rounded-[4px] bg-inset" />
          <span className="h-6.5 w-[62%] rounded-xs bg-inset" />
          <div className="mt-1.5 flex gap-2">
            <span className="h-16 flex-1 rounded-xs bg-inset" />
            <span className="h-16 flex-1 rounded-xs bg-inset" />
            <span
              className={cn(
                "h-16 flex-1 rounded-xs",
                accent === "brand" ? "bg-brand-subtle" : "bg-info-subtle"
              )}
            />
          </div>
          <span className="h-3 w-[80%] rounded-[4px] bg-inset" />
          <span className="h-3 w-[54%] rounded-[4px] bg-inset" />
        </div>
      </div>
    </div>
  )
}

export { CaseSketch }
