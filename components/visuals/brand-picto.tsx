import { pictos, type PictoName } from "@/lib/content/pictos"
import { cn } from "@/lib/utils"

/**
 * Un picto du kit visuel, en SVG inline. Voir `lib/content/pictos.ts` pour les deux
 * variables de couleur. Décoratif : le libellé qu'il accompagne porte le sens.
 *
 * Le balisage vient du dépôt, pas d'un contenu saisi : `dangerouslySetInnerHTML` n'y
 * injecte rien qui n'ait été relu à la génération.
 */
function BrandPicto({
  name,
  className,
}: {
  name: PictoName
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: pictos[name] }}
    />
  )
}

export { BrandPicto }
