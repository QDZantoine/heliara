import Image from "next/image"

import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import type { MediaWithCaption } from "@/lib/media"

/**
 * La galerie d'une réalisation : les captures de ce qui a été livré.
 *
 * **Troisième cas du même défaut, et le plus avancé des trois.** La galerie se saisit
 * dans l'éditeur, se réordonne à la poignée, s'enregistre par `set_case_gallery`, revient
 * dans le sixième jeu de résultats de `pub_get_case_study` et arrive jusqu'à
 * `PublicCase.gallery` - où elle s'arrêtait. Aucune vue ne la lisait. On pouvait donc
 * composer une galerie complète, la réordonner, la voir dans l'administration, et elle
 * n'existait pour aucun visiteur.
 *
 * **Sa place dans la fiche : après le récit, avant les résultats.** On lit l'histoire de
 * la mission, on voit ce qui a été livré, puis on mesure. La mettre avant le récit
 * donnerait des captures sans contexte ; après les résultats, elle arriverait une fois la
 * démonstration faite, donc trop tard pour y servir.
 *
 * **Le texte alternatif est vide et la légende visible**, ce qui est le bon partage pour
 * une capture d'écran légendée : la légende est lue par tout le monde, et une alternative
 * qui la répéterait ferait entendre deux fois la même phrase. L'administration n'a de
 * champ que pour la légende, et c'est cohérent avec ce choix.
 */
function CaseGallery({ items }: { items: readonly MediaWithCaption[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <Reveal className="mb-13">
      <Eyebrow className="mb-5">Aperçus</Eyebrow>
      {/*
        Une colonne sous 768 px, deux au-delà - et une seule image occupe alors toute la
        largeur plutôt que la moitié, ce que `grid-cols-2` ferait sans ce test. Une
        capture d'interface réduite à la moitié d'une colonne de contenu n'est plus
        lisible : autant lui laisser la place quand elle est seule.
      */}
      <ul
        className={
          items.length === 1
            ? "grid gap-4"
            : "grid gap-4 md:grid-cols-2 md:gap-5"
        }
      >
        {/* La clé est l'URL, unique par média : elle ne dépend donc pas de l'ordre, que
            l'administration permet de changer. */}
        {items.map((item) => (
          <li key={item.url}>
            <figure>
              {/*
                **Chaque boîte prend le rapport de son fichier.** Un rapport imposé
                rognerait les captures, et une capture rognée perd justement ce qu'on
                voulait montrer. Les dimensions sont lues à l'envoi et stockées, donc la
                boîte reste dimensionnée avant le chargement : aucun décalage de mise en
                page. Le 16/10 n'est qu'un repli, pour un fichier sans dimensions connues.

                Conséquence assumée : sur deux colonnes, deux images de rapports
                différents ne s'alignent pas en bas. C'est le prix de ne rien couper, et
                il est plus faible que celui d'une capture amputée.
              */}
              <div
                style={{
                  aspectRatio:
                    item.width && item.height
                      ? item.width / item.height
                      : 16 / 10,
                }}
                className="relative overflow-hidden rounded-md border border-line bg-inset"
              >
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes={
                    items.length === 1
                      ? "(min-width: 1240px) 860px, 100vw"
                      : "(min-width: 1240px) 420px, (min-width: 768px) 45vw, 100vw"
                  }
                  className="object-cover"
                  // Elles sont sous le récit, donc jamais au premier écran.
                  loading="lazy"
                />
              </div>
              {item.caption ? (
                <figcaption className="mt-2.5 text-[0.82rem] leading-relaxed text-label">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

export { CaseGallery }
