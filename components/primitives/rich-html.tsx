import { cn } from "@/lib/utils"

/**
 * Affiche un fragment de texte riche.
 *
 * **`dangerouslySetInnerHTML` est acceptable ici, et uniquement parce que le contenu
 * a été validé à l'écriture.** `lib/rich-text.ts` refuse tout ce qui n'est pas le
 * fragment que l'éditeur sait produire - pas de `script`, pas d'attribut
 * d'évènement, pas de lien `javascript:`. Un contenu qui n'a pas franchi cette
 * validation ne peut pas se trouver en base.
 *
 * Le seul autre chemin d'entrée est `pnpm db:seed`, qui n'écrit que du contenu du
 * dépôt. Si un troisième chemin apparaît un jour, il doit passer par le même schéma.
 *
 * La classe `hel-prose` porte le style du corps de texte, partagé avec l'éditeur :
 * ce qu'on voit en écrivant est ce qui sera publié.
 */
function RichHtml({
  html,
  className,
  as: Tag = "div",
}: {
  html: string
  className?: string
  /** L'élément porteur. `div` par défaut, pour pouvoir contenir des listes. */
  as?: "div" | "section"
}) {
  return (
    <Tag
      className={cn("hel-prose", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export { RichHtml }
