import { Halo } from "@/components/primitives/halo"

type ExpertiseSketchProps = {
  lines: readonly [number, number, number]
  tag: string
  halo: "warm" | "cool"
}

/** Bandeau d'interface abstrait en tête de carte expertise. */
function ExpertiseSketch({ lines, tag, halo }: ExpertiseSketchProps) {
  return (
    <div className="relative h-30 overflow-hidden rounded-md bg-inset">
      <Halo variant={halo} />
      <div className="absolute inset-x-4 top-4.5 grid gap-1.5">
        {lines.map((width, index) => (
          <span
            key={index}
            style={{ width: `${width}%` }}
            className="h-2.5 rounded-[3px] border border-line bg-raised"
          />
        ))}
      </div>
      <span className="absolute right-3.5 bottom-3 font-mono text-[0.625rem] text-label">
        {tag}
      </span>
    </div>
  )
}

export { ExpertiseSketch }
