import type { MethodGauge } from "@/lib/content/method"
import { cn } from "@/lib/utils"

const tones = {
  brand: "bg-brand-subtle",
  info: "bg-info-subtle",
  neutral: "bg-inset",
}

/**
 * Petite carte de mesure accompagnant chaque temps de la méthode : le livrable
 * rendu visible, en CSS pur. Décorative, donc retirée de l'arbre
 * d'accessibilité - le contenu utile est dans le texte du temps.
 */
function MethodGaugeCard({
  title,
  gauges,
}: {
  title: string
  gauges: MethodGauge[]
}) {
  return (
    <div
      aria-hidden="true"
      className="rounded-lg border border-line bg-surface p-5 shadow-1 transition-[transform,box-shadow] duration-[160ms] ease-expo hover:-translate-y-[3px] hover:shadow-3"
    >
      <p className="mb-3 text-[0.625rem] font-semibold tracking-[0.1em] text-label uppercase">
        {title}
      </p>
      <div className="grid gap-[7px]">
        {gauges.map((gauge) => (
          <div key={gauge.label} className="flex items-center gap-2.5">
            <span
              style={{ width: `${gauge.width}%` }}
              className={cn("h-3 rounded-[5px]", tones[gauge.tone])}
            />
            <span className="font-mono text-[0.625rem] whitespace-nowrap text-label">
              {gauge.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { MethodGaugeCard }
