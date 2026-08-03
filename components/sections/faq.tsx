import { Plus } from "lucide-react"

type FaqProps = {
  title?: string
  /**
   * `readonly` : le composant ne fait que lire. Sans cela, un appelant qui détient
   * une liste immuable - c'est le cas des vues partagées avec l'aperçu - devrait la
   * recopier pour la passer.
   */
  items: readonly { question: string; answer: string }[]
}

/**
 * FAQ d’objections. Bâtie sur `<details>` : accessible, ouvrable au clavier et
 * dépliée par la recherche du navigateur, sans une ligne de JavaScript.
 */
function Faq({ title = "Vos questions, nos réponses", items }: FaqProps) {
  return (
    <div>
      <h2 className="mb-6 text-[clamp(1.5rem,5.5vw,1.875rem)] font-bold">
        {title}
      </h2>
      <div className="border-t border-line">
        {items.map((item) => (
          <details
            key={item.question}
            className="group border-b border-line [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.0625rem] font-semibold text-ink">
              {item.question}
              <Plus
                aria-hidden="true"
                className="size-4 shrink-0 text-brand-text transition-transform duration-[160ms] ease-expo group-open:rotate-45"
                strokeWidth={1.5}
              />
            </summary>
            <p className="max-w-[40rem] pb-5 text-[0.97rem] leading-relaxed text-body">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  )
}

export { Faq }
