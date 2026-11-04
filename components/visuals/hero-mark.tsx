/**
 * Le symbole Heliara en aplat orange, qui déborde d'un coin de la carte du hero : la
 * composition des publications LinkedIn du studio - une carte claire qui flotte, le
 * symbole qui en dépasse, la découpe de 12,3° lisible entre ses deux pièces.
 *
 * **Le symbole entier, jamais une pièce seule** : c'est la découpe qui le fait
 * reconnaître, une pièce isolée se lit comme une tache arrondie. Les tracés sont
 * ceux du kit visuel, `piece-haute` et `piece-basse`, sans modification : la charte
 * interdit de pivoter, déformer ou recolorer hors palette.
 *
 * Deux groupes par pièce, deux mouvements : l'assemblage à l'arrivée sur le tracé,
 * l'écart au défilement - perpendiculaire à la découpe - sur le groupe. Une seconde
 * animation sur un même nœud remplacerait la première.
 *
 * Des tracés et non du texte : un `<path>` SVG n'est pas candidat au LCP, le titre
 * le reste. Décoratif, hors arbre d'accessibilité.
 */
function HeroMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 426 450"
      className={className}
      overflow="visible"
    >
      <g className="hel-mark-part-top">
        <path
          className="hel-mark-in-top"
          d="M85 7 H304 A78 78 0 0 1 382 85 V166.23 L32.39 243.08 Q7 248.66 7 222.66 V85 A78 78 0 0 1 85 7 Z"
        />
      </g>
      <g className="hel-mark-part-bottom">
        <path
          className="hel-mark-in-bottom"
          d="M44 282.43 L391.59 206.87 Q417 201.35 417 227.35 V364 A78 78 0 0 1 339 442 H122 A78 78 0 0 1 44 364 Z"
        />
      </g>
    </svg>
  )
}

export { HeroMark }
