import { MessageSquareText } from "lucide-react"

/**
 * L'icône du CTA primaire, définie une fois.
 *
 * **Pourquoi un composant pour trois lignes.** « Parlons de votre projet » apparaît à
 * sept endroits - en-tête, menu mobile, hero, bandeau de conversion, bande finale, fin
 * de fiche, fin d'article - et deux d'entre eux sont visibles sur le même écran de
 * l'accueil. Une icône ajoutée à la main dans sept fichiers finit par diverger sur sa
 * taille ou son épaisseur de trait, et l'écart se voit précisément là où les deux
 * boutons se côtoient.
 *
 * `aria-hidden` : le libellé du bouton dit déjà ce qu'il fait. Annoncer l'icône
 * ferait entendre deux fois la même chose.
 *
 * Version statique, sans animation. La bibliothèque d'icônes animées a été écartée :
 * `motion` serait entré dans le bundle partagé de toutes les pages - le CTA vit dans
 * l'en-tête - il aurait fallu envelopper le layout racine pour que
 * `prefers-reduced-motion` soit respecté, et l'animation par défaut de cette icône est
 * une oscillation que la DA interdit.
 */
export function CtaIcon() {
  return (
    <MessageSquareText
      aria-hidden="true"
      className="size-4 shrink-0"
      strokeWidth={1.75}
    />
  )
}
