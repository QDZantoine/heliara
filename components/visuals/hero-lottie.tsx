import { LottieScene } from "@/components/visuals/lottie-scene"
import { cn } from "@/lib/utils"

/**
 * Illustration du hero : trois fenêtres - wireframe, code, maquette haute
 * fidélité - qui s'empilent lentement, tiennent la pose, puis recommencent.
 * C'est le propos du studio, montré plutôt qu'écrit, et cela reste dans la règle
 * de la DA : illustration abstraite, volumes simples, jamais de photo ni de 3D
 * gadget.
 *
 * Trois réglages portent le rendu :
 * - `load="eager"` : c'est le seul usage Lottie du site au-dessus de la ligne de
 *   flottaison. Le chargement reste posté après le premier rendu, et le LCP est
 *   le titre, rendu côté serveur, donc il n'est pas retardé.
 * - `speed` à 0,44 : les 3,5 s d'origine passent à 8 s.
 * - `holdMs` : un arrêt sur la composition terminée, sans quoi l'empilement se
 *   défait aussitôt complet. Mesuré sur le rendu, cycle de 10 s dont 3,3 s
 *   d'arrêt, la fin du fichier comptant environ une seconde sans changement
 *   visible qui s'ajoute au délai réglé.
 *
 * Le build `lottie_light` n'évalue pas les expressions du fichier, qui sont deux
 * formules de rebond élastique. C'est voulu : la DA interdit le rebond, et le
 * rendu est par ailleurs identique, vérifié image par image contre le build
 * complet.
 */
function HeroLottie({ className }: { className?: string }) {
  return (
    <LottieScene
      src="/animated-illustrations/hero-product.json"
      load="eager"
      speed={0.44}
      holdMs={2200}
      posterFrame={104}
      className={cn(
        // L'artboard porte de larges marges internes : la mise à l'échelle leur
        // fait rendre l'espace, sans toucher à la mise en page puisqu'un
        // transform ne l'affecte pas. Le débord n'est que du transparent.
        "mx-auto aspect-square w-full max-w-85 scale-110 md:max-w-115 lg:max-w-132 lg:scale-[1.2]",
        className
      )}
    />
  )
}

export { HeroLottie }
