import { cn } from "@/lib/utils"

type CaseHeroSketchProps = {
  accent: "brand" | "info"
}

/**
 * Vue produit en tête d’étude de cas : la fenêtre déborde vers le bas pour
 * amorcer la lecture. À remplacer par les captures réelles du produit.
 */
function CaseHeroSketch({ accent }: CaseHeroSketchProps) {
  const highlight = accent === "brand" ? "bg-brand-subtle" : "bg-info-subtle"

  return (
    <div aria-hidden="true" className="relative h-56 md:h-80">
      <div className="absolute inset-x-0 top-0 -bottom-10 overflow-hidden rounded-t-lg border border-line bg-raised p-5 shadow-3">
        <div className="mb-4 flex gap-1.5">
          <span className="size-2.25 rounded-full bg-line-strong" />
          <span className="size-2.25 rounded-full bg-line-strong" />
          <span className="size-2.25 rounded-full bg-line-strong" />
        </div>
        <div className="grid gap-3 md:grid-cols-[11.25rem_1fr]">
          <div className="hidden gap-2 md:grid md:content-start">
            <span className={cn("h-7.5 rounded-xs", highlight)} />
            <span className="h-7.5 rounded-xs bg-inset" />
            <span className="h-7.5 rounded-xs bg-inset" />
            <span className="h-7.5 rounded-xs bg-inset" />
            <span className="h-7.5 rounded-xs bg-inset" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <span className="h-14 rounded-sm bg-inset md:h-19" />
            <span className="h-14 rounded-sm bg-inset md:h-19" />
            <span className={cn("h-14 rounded-sm md:h-19", highlight)} />
            <span className="col-span-3 h-12 rounded-sm bg-inset md:h-16" />
            <span className="col-span-2 h-10 rounded-sm bg-inset md:h-14" />
            <span className="h-10 rounded-sm bg-inset md:h-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { CaseHeroSketch }
