import Image from "next/image"

import { Container } from "@/components/primitives/container"
import { clients } from "@/lib/content/clients"

/**
 * S3 - le bandeau de logos clients, juste après le hero.
 *
 * **C'est la place que cette bande attendait depuis le début.** L'architecture UX y
 * prévoit « la caution avant le premier scroll d'effort », et une rangée de logos est
 * exactement cela : reconnaissable sans être lue. Elle a d'abord porté huit noms de
 * clients inventés, puis les engagements contractuels faute de références réelles ; ces
 * derniers sont désormais une section pleine en bas de page, où un engagement se lit
 * posément.
 *
 * **Compacte, volontairement.** Une bande d'une ligne avec son libellé à gauche, pas une
 * section titrée : à cet endroit de la page, la caution doit se percevoir en passant. Un
 * `h2` et un chapô en S3 retarderaient le propos du site de deux écrans.
 *
 * **Elle ne s'affiche pas tant qu'il n'y a rien à montrer.** Un bandeau « Ils nous font
 * confiance » vide serait pire que son absence.
 */
function ClientMarquee() {
  if (clients.length === 0) {
    return null
  }

  /*
    Assez de logos pour que le défilement ait un sens ? Sinon, une rangée fixe.

    La bande doit être plus large que l'écran pour boucler sans trou visible. Sous quatre
    logos, la copie de la liste nécessaire au bouclage apparaît dans le même champ de
    vision et le doublon se voit - on lit deux fois le même nom à trente centimètres
    d'écart.
  */
  const defile = clients.length >= 4

  return (
    <section
      aria-labelledby="confiance-titre"
      /*
        La bande suit le thème, et les logos gardent leur couleur dans les deux.

        Un plateau clair maintenu en thème sombre avait été essayé : il garantissait la
        lisibilité des huit fichiers, au prix d'une bande blanche dans une page encre.
        Écarté - la couleur des marques se tient sur les deux fonds, et une section qui
        ignore le thème se remarque plus qu'un logo un peu moins contrasté.

        Aucun filtre non plus. La désaturation à opacité réduite effaçait les logos
        clairs, et `brightness-0 invert` en sombre écrasait les formes internes de ceux
        qui en dépendent. Les logos sont montrés tels que leurs propriétaires les ont
        dessinés, ce qu'on doit de toute façon à une marque qu'on affiche.

        Conséquence connue : un fichier à fond opaque foncé - `logo-hexceos.png` - se
        fond dans la bande en thème sombre. Cela se corrige dans le fichier, pas en CSS.
      */
      className="border-y border-line bg-surface"
    >
      <Container className="flex flex-col gap-4 py-6 menu:flex-row menu:items-center menu:gap-9">
        <h2
          id="confiance-titre"
          className="flex-none text-[0.72rem] font-semibold tracking-[0.12em] text-label uppercase"
        >
          Ils nous font confiance
        </h2>

        {defile ? (
          <div className="hel-logos group min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
            <div className="hel-logos-track flex w-max animate-marquee items-center group-hover:[animation-play-state:paused] max-menu:[animation-duration:52s]">
              <LogoRow />
              <LogoRow hidden />
            </div>
          </div>
        ) : (
          <ul className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-5">
            {clients.map((client) => (
              <li key={client.name}>
                <ClientLogo client={client} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}

/** La liste, rendue deux fois pour que le défilement boucle sans saut. */
function LogoRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden ? "true" : undefined}
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
    >
      {clients.map((client) => (
        <li key={client.name} className="shrink-0">
          <ClientLogo client={client} />
        </li>
      ))}
    </ul>
  )
}

/**
 * Un logo, ramené à un poids visuel comparable.
 *
 * **La hauteur est bornée, jamais la largeur** : fixer la largeur rendrait un carré
 * minuscule et un logotype horizontal énorme.
 *
 * **Mais une hauteur unique ne suffit pas.** Un logotype à 28 px de haut couvre 140 px de
 * large, un carré n'en couvre que 28 - quatre fois moins de surface pour la même consigne.
 * Les carrés reçoivent donc plus de hauteur, ce qui est la seule façon de les faire peser
 * pareil sans mesurer chaque fichier à la main.
 *
 * **Désaturés en thème clair, en couleur en thème sombre.** Le traitement n'est pas
 * symétrique parce que les deux fonds ne posent pas le même problème.
 *
 * Sur le plateau clair, huit logos à pleine couleur - un violet, un bleu, un rose, un
 * turquoise, un vert acide - font de la bande la zone la plus criarde de la page et
 * volent le seul geste orange de l'écran, qui est le point du titre du hero juste
 * au-dessus. Le gris les ramène à ce qu'ils sont : une liste de références. La couleur
 * revient au survol, pour qui s'y intéresse.
 *
 * Sur l'encre, l'inverse : les mêmes couleurs y ressortent sans crier, et le gris y
 * ferait des taches ternes. `dark:grayscale-0` et `dark:opacity-100` rendent donc les
 * fichiers tels quels.
 *
 * **`brightness-0 invert` a été essayé et abandonné** : il écrasait les formes internes
 * des logos qui en dépendent et transformait un fond opaque en carré gris uni. Ne pas y
 * revenir - une marque monochrome fournit ses deux variantes, voir `Client.logo`.
 *
 * **Une marque monochrome fournit ses deux variantes**, et l'on rend les deux images en
 * masquant l'une par le CSS. Le thème du site est porté par une classe sur `<html>` et non
 * par la seule préférence système, puisque le sélecteur permet de le forcer : échanger la
 * source demanderait du JavaScript, et un `<picture media>` se désynchroniserait d'un
 * choix manuel. Même mécanique que les portraits d'équipe.
 */
function ClientLogo({ client }: { client: (typeof clients)[number] }) {
  const taille =
    client.shape === "square" ? "h-10 w-auto md:h-11" : "h-7 w-auto md:h-8"
  const rendu =
    "opacity-70 grayscale transition-[opacity,filter] duration-[200ms] ease-expo hover:opacity-100 hover:grayscale-0 dark:opacity-100 dark:grayscale-0"

  if (typeof client.logo === "string") {
    return (
      <Logo
        src={client.logo}
        alt={client.name}
        className={`${taille} ${rendu}`}
      />
    )
  }

  return (
    <>
      <Logo
        src={client.logo.light}
        alt={client.name}
        className={`${taille} ${rendu} dark:hidden`}
      />
      {/*
        La seconde variante est décorative : le nom est déjà porté par la première, qui
        reste dans l'arbre d'accessibilité même masquée en CSS. L'annoncer ferait lire la
        référence en double.
      */}
      <Logo
        src={client.logo.dark}
        alt=""
        className={`hidden ${taille} dark:block`}
      />
    </>
  )
}

/**
 * L'image elle-même.
 *
 * `unoptimized` sur un SVG : l'optimiseur de Next n'a rien à y gagner, et il le refuse de
 * toute façon tant que `dangerouslyAllowSVG` n'est pas activé - c'est la règle du projet
 * pour `public/illustrations`, et elle vaut ici.
 */
function Logo({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className: string
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={240}
      height={240}
      unoptimized={src.endsWith(".svg")}
      className={className}
    />
  )
}

export { ClientMarquee }
