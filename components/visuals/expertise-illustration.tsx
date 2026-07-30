import Image from "next/image"

import { Halo } from "@/components/primitives/halo"

/**
 * L'illustration en tête de carte expertise, sur son halo.
 *
 * **Elle a remplacé un croquis de barres grises** qui se lisait comme un wireframe :
 * trois filets et une étiquette monospace suggéraient une interface sans en montrer
 * aucune, ce qui donnait à la section l'air d'une maquette inachevée plutôt que d'un
 * propos.
 *
 * Le halo est conservé, c'est lui qui donne sa profondeur au bandeau. Reste donc une
 * seule couche colorée derrière l'illustration, et la règle « un seul halo par écran »
 * n'est pas plus sollicitée qu'avant.
 *
 * **`unoptimized`** : l'optimiseur de Next n'apporte rien sur un SVG, il le
 * retraiterait pour le rendre identique en pesant un aller-retour de serveur.
 *
 * **Décorative** : `alt=""` et `aria-hidden` sur le conteneur. Tout ce que l'image
 * raconte est écrit juste dessous, dans le titre et le résumé de la carte ; l'annoncer
 * ferait entendre deux fois la même chose.
 */
function ExpertiseIllustration({
  illustration,
  halo,
}: {
  illustration: { src: string; width: number; height: number }
  halo: "warm" | "cool"
}) {
  return (
    <div
      aria-hidden="true"
      className="relative grid h-30 place-items-center overflow-hidden rounded-md bg-inset"
    >
      <Halo variant={halo} />
      {/*
        La hauteur est bornée et la largeur suit : les trois fichiers n'ont pas les
        mêmes proportions - 1095×714, 876×661, 800×524 - et fixer la largeur les
        rendrait à des hauteurs apparentes très différentes d'une carte à l'autre.
      */}
      <Image
        src={illustration.src}
        alt=""
        width={illustration.width}
        height={illustration.height}
        unoptimized
        // 100 px dans une boîte de 120 : les artboards portent déjà leurs propres
        // marges internes, donc une illustration collée aux bords de sa boîte n'y
        // touche pas vraiment. Dix pixels de respiration de chaque côté suffisent, et
        // au-delà l'illustration perdait sa présence face au titre de la carte.
        className="relative h-[6.25rem] w-auto max-w-[85%] object-contain"
      />
    </div>
  )
}

export { ExpertiseIllustration }
