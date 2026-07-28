import { Parallax } from "@/components/visuals/parallax"
import { ProductWindow } from "@/components/visuals/product-window"

/**
 * Mise en scène produit du hero : fenêtre d'application + trois cartes
 * flottantes. Les cartes disparaissent sous 768 px, la scène se réduit à la
 * seule fenêtre (Responsive Guidelines 09, ligne « Hero »).
 */
function HeroStage() {
  return (
    <Parallax
      aria-hidden="true"
      className="relative h-[21.25rem] md:h-[28.75rem] lg:h-[32.5rem]"
    >
      <ProductWindow className="absolute top-6 right-0 left-0 md:right-9" />

      <div className="absolute -top-1.5 -right-2 hidden w-[14.5rem] animate-float rounded-md border border-line bg-raised p-3.5 shadow-4 md:block">
        <div className="flex items-start gap-2.5">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-success" />
          <div>
            <p className="text-[0.78rem] font-semibold text-ink">
              Mise en production
            </p>
            <p className="text-[0.69rem] text-label">
              Version 2.4 déployée — 0 incident
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 -left-3.5 hidden w-[14.5rem] animate-float-slow rounded-md border border-line bg-raised p-3.5 shadow-4 md:block">
        <p className="mb-2 text-[0.625rem] font-semibold tracking-[0.08em] text-label uppercase">
          API · temps de réponse
        </p>
        <p className="flex justify-between font-mono text-[0.8rem] text-ink">
          GET /commandes <span className="text-success-text">42 ms</span>
        </p>
        <p className="mt-1.5 flex justify-between font-mono text-[0.8rem] text-ink">
          POST /facture <span className="text-success-text">61 ms</span>
        </p>
      </div>

      <div className="absolute right-5 -bottom-1 hidden animate-float-mid items-center gap-2 rounded-full border border-line bg-raised px-4 py-2.5 shadow-3 md:flex">
        <span className="inline-flex size-5.5 items-center justify-center rounded-full bg-brand-solid text-[0.56rem] font-semibold text-brand-on-solid">
          IA
        </span>
        <span className="text-xs text-body">Anomalie détectée et corrigée</span>
      </div>
    </Parallax>
  )
}

export { HeroStage }
