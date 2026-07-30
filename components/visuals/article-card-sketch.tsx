import { Halo } from "@/components/primitives/halo"

/**
 * Le visuel de la carte « à la une » des ressources, quand l'article n'a pas d'image.
 *
 * **Il vivait en clair dans `app/(site)/ressources/page.tsx`**, et il y posait deux
 * problèmes. Le premier est de lisibilité : cinquante lignes de schéma au milieu d'une
 * page en rendaient la structure difficile à suivre. Le second est de fond, et il reste
 * entier ici - **ce croquis illustre un article précis** : deux colonnes « Acheter » et
 * « Construire », puis sept lignes pour sept questions. Il s'affiche sous n'importe quel
 * article mis en avant, dont il ne dit alors plus rien.
 *
 * Il est donc un **repli**, pas une illustration : dès qu'un article porte une image de
 * tête, c'est elle qui s'affiche. Le sortir ici est ce qui a permis cette bascule sans
 * empiler deux branches dans la page.
 *
 * `aria-hidden` comme tous les croquis du projet : aucun asset, aucune information, rien
 * à annoncer.
 */
function ArticleCardSketch() {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-52 overflow-hidden bg-inset md:min-h-75"
    >
      <Halo variant="warm" />
      <div className="absolute top-11 -right-6 -bottom-6 left-9 rounded-tl-md border border-line bg-raised p-5.5 shadow-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xs border border-line p-3.5">
            <p className="text-[0.69rem] font-semibold text-ink">Acheter</p>
            <div className="mt-2 grid gap-1.5">
              <span className="h-2 w-[80%] rounded-[3px] bg-inset" />
              <span className="h-2 w-[60%] rounded-[3px] bg-inset" />
            </div>
          </div>
          <div className="rounded-xs border border-brand bg-brand-subtle p-3.5">
            <p className="text-[0.69rem] font-semibold text-brand-text">
              Construire
            </p>
            <div className="mt-2 grid gap-1.5">
              <span className="h-2 w-[72%] rounded-[3px] bg-raised" />
              <span className="h-2 w-[84%] rounded-[3px] bg-raised" />
            </div>
          </div>
        </div>
        {/* Les sept questions, en lignes schématiques : c'est ce qui occupe le bas du
            visuel et donne son volume au bloc. */}
        <div className="mt-2.5 grid gap-1.5">
          {[86, 72, 90, 64, 80, 58, 76].map((width, index) => (
            <span
              key={index}
              style={{ width: `${width}%` }}
              className="h-2.5 rounded-[3px] bg-inset"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { ArticleCardSketch }
