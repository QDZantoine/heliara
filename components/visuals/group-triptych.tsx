/**
 * Illustration du hero de /le-groupe : trois volumes qui s'assemblent, un par
 * marque, du plus clair au plus sombre. Abstraite et construite, en CSS pur :
 * aucun asset à charger, et la règle de la DA est tenue.
 */
function GroupTriptych() {
  return (
    <div aria-hidden="true" className="relative h-60 md:h-75 lg:h-85">
      {/* LessonSharing : le volume le plus en retrait. */}
      <div className="absolute top-0 left-0 h-[62%] w-[52%] rounded-lg border border-line bg-raised shadow-2">
        <span className="absolute inset-x-5 top-5 h-1 rounded-full bg-[#1E40AF]" />
        <div className="absolute inset-x-5 top-10 grid gap-2">
          <span className="h-2.5 w-[70%] rounded-[3px] bg-inset" />
          <span className="h-2.5 w-[48%] rounded-[3px] bg-inset" />
        </div>
      </div>

      {/* Hexceos : le volume encre, à l'arrière-plan droit. */}
      <div className="absolute top-[14%] right-0 h-[64%] w-[50%] rounded-lg border border-line bg-inverse shadow-3">
        <span className="absolute inset-x-5 top-5 h-1 rounded-full bg-inverse-fg opacity-60" />
        <div className="absolute inset-x-5 top-10 grid gap-2">
          <span className="h-2.5 w-[62%] rounded-[3px] bg-inverse-fg opacity-25" />
          <span className="h-2.5 w-[80%] rounded-[3px] bg-inverse-fg opacity-15" />
        </div>
      </div>

      {/* Heliara : le volume au premier plan, le seul geste orange. */}
      <div className="absolute bottom-0 left-[16%] h-[58%] w-[62%] rounded-lg border border-line bg-raised shadow-4">
        <span className="absolute inset-x-6 top-6 h-1 rounded-full bg-brand" />
        <div className="absolute inset-x-6 top-12 grid gap-2.5">
          <span className="h-3 w-[76%] rounded-[4px] bg-brand-subtle" />
          <span className="h-3 w-[54%] rounded-[4px] bg-inset" />
          <span className="h-3 w-[66%] rounded-[4px] bg-inset" />
        </div>
      </div>
    </div>
  )
}

export { GroupTriptych }
