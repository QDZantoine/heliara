import { CircleCheckBig } from "lucide-react"

import { guarantees } from "@/lib/content/guarantees"

/**
 * S3 - la caution avant le premier scroll d'effort.
 *
 * **Le contenu vit dans `lib/content/guarantees.ts`**, pas ici : c'est la règle du
 * projet, et elle a une raison concrète dans ce cas précis. La liste doit rester
 * disjointe des principes de S7 (`kpis.ts`), et cette contrainte-là se documente à
 * côté de la donnée, pas dans un composant de rendu.
 *
 * La bande a remplacé un ticker de noms de clients inventés. Elle porte des artefacts
 * vérifiables plutôt que des références empruntées : c'est ce qu'une marque jeune peut
 * affirmer sans emprunter.
 */

function BrandSeparator() {
  return (
    <CircleCheckBig
      aria-hidden="true"
      className="size-4 shrink-0 text-brand"
      strokeWidth={2.1}
    />
  )
}

/**
 * La liste, rendue deux fois pour que le défilement boucle sans saut.
 *
 * La seconde copie porte `aria-hidden` : elle n'existe que pour l'illusion visuelle,
 * et l'annoncer ferait lire la liste en double.
 */
function GuaranteeList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden ? "true" : undefined}
      className="flex shrink-0 items-center gap-9 pr-9 sm:gap-11 sm:pr-11 lg:gap-14 lg:pr-14"
    >
      {guarantees.map((guarantee) => (
        <li
          key={guarantee}
          className="flex shrink-0 items-center gap-5 text-[0.9rem] font-medium whitespace-nowrap text-body sm:text-[0.9375rem]"
        >
          <span>{guarantee}</span>
          <BrandSeparator />
        </li>
      ))}
    </ul>
  )
}

function CommitmentsMarquee() {
  return (
    <section
      aria-labelledby="engagements-heliara"
      className="border-y border-line bg-surface"
    >
      <h2 id="engagements-heliara" className="sr-only">
        Nos engagements
      </h2>
      <div className="hel-commitments-viewport group overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
        <div className="hel-commitments-track flex w-max animate-marquee items-center py-5 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] max-menu:[animation-duration:52s] menu:py-6">
          <GuaranteeList />
          <GuaranteeList hidden />
        </div>
      </div>
    </section>
  )
}

export { CommitmentsMarquee }
