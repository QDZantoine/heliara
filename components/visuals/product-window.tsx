import { cn } from "@/lib/utils"

const BARS = [34, 48, 42, 60, 55, 72, 64, 80, 74, 90, 84, 96]

const KPIS = [
  { label: "Commandes", value: "1 248", delta: "+12 % ce mois", good: true },
  { label: "Délai moyen", value: "3,2 j", delta: "−0,8 j", good: true },
  {
    label: "Disponibilité",
    value: "99,98 %",
    delta: "30 derniers jours",
    good: false,
  },
]

const NAV = ["Vue d’ensemble", "Commandes", "Production", "Clients"]

/**
 * Illustration : le produit est l’image (DA v2, 06). Fenêtre d’application
 * abstraite en CSS pur — aucune capture, aucune photo, aucun asset à charger.
 * Purement décoratif, donc retiré de l’arbre d’accessibilité par le parent.
 */
function ProductWindow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-raised shadow-3",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="ml-2.5 font-mono text-[0.72rem] text-label">
          plateforme.votre-métier.fr
        </span>
      </div>

      {/* Le rail de navigation disparaît sous 768 px : la scène mobile se
          réduit à la seule fenêtre produit, qui doit rester lisible. */}
      <div className="grid min-h-[20.5rem] md:grid-cols-[9.375rem_1fr]">
        <div className="hidden border-r border-line bg-page px-2.5 py-3.5 md:block">
          <p className="px-2 pb-2 text-[0.625rem] font-semibold tracking-[0.1em] text-label uppercase">
            Pilotage
          </p>
          {NAV.map((item, index) => (
            <p
              key={item}
              className={cn(
                "rounded-xs px-2.5 py-1.5 text-xs",
                index === 0
                  ? "bg-inset font-medium text-ink shadow-[inset_2px_0_0_var(--hel-brand)]"
                  : "text-body"
              )}
            >
              {item}
            </p>
          ))}
        </div>

        <div className="p-4.5">
          <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="font-display text-[0.94rem] font-bold tracking-[-0.01em] text-ink">
              Vue d’ensemble
            </span>
            <span className="font-mono text-[0.6875rem] whitespace-nowrap text-label">
              mise à jour il y a 2 min
            </span>
          </div>

          <div className="mb-3.5 grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-2.5">
            {KPIS.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xs border border-line p-3"
              >
                <p className="text-[0.625rem] font-semibold tracking-[0.08em] text-label uppercase">
                  {kpi.label}
                </p>
                <p className="font-display text-[1.375rem] font-bold text-ink">
                  {kpi.value}
                </p>
                <p
                  className={cn(
                    "text-[0.66rem]",
                    kpi.good ? "text-success-text" : "text-label"
                  )}
                >
                  {kpi.delta}
                </p>
              </div>
            ))}
          </div>

          <div className="flex h-21 items-end gap-1.5 rounded-xs border border-line p-3">
            {BARS.map((height, index) => (
              <span
                key={index}
                style={{ height: `${height}%` }}
                className="flex-1 rounded-t-[3px] bg-brand opacity-85"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { ProductWindow }
