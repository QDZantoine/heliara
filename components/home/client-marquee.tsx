import Image from "next/image"
import { Pause, Play } from "lucide-react"

import { Container } from "@/components/primitives/container"
import type { Client } from "@/lib/content/clients"

/**
 * S3 - le bandeau de logos clients, juste après le hero : « la caution avant le premier
 * scroll d'effort » de l'Architecture UX.
 *
 * **Compacte, volontairement.** Une bande d'une ligne avec son libellé à gauche, pas une
 * section titrée : un `h2` et un chapô à cet endroit retarderaient le propos du site de
 * deux écrans.
 *
 * Elle ne s'affiche pas tant qu'il n'y a rien à montrer, et les références arrivent en
 * prop : elles sont administrables, le composant reste ignorant de leur provenance.
 */
function ClientMarquee({ clients }: { clients: readonly Client[] }) {
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
        La bande suit le thème plutôt que de garder un plateau clair : une section qui
        ignore le thème se remarque plus qu'un logo un peu moins contrasté. Conséquence,
        un logo monochrome sombre disparaît sur l'encre - cela se corrige en fournissant
        sa variante claire, jamais par un filtre.
      */
      className="border-y border-line bg-surface"
    >
      <Container className="flex flex-col gap-4 py-6 menu:flex-row menu:items-center menu:gap-9">
        {/*
          La case à cocher qui pilote la pause, et sa place dans l'arbre n'est pas
          négociable : le CSS l'atteint par `~`, donc elle doit être un frère **précédant**
          le conteneur de la piste. La déplacer dans le bloc du titre casserait la
          commande sans qu'aucun outil le signale.
        */}
        {defile ? (
          <input
            type="checkbox"
            id="hel-logos-pause"
            className="hel-logos-switch sr-only"
          />
        ) : null}

        <h2
          id="confiance-titre"
          className="flex-none text-[0.72rem] font-semibold tracking-[0.12em] text-label uppercase"
        >
          Ils nous font confiance
        </h2>

        {defile ? (
          <div className="hel-logos group min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
            <div className="hel-logos-track flex w-max animate-marquee items-center group-hover:[animation-play-state:paused] max-menu:[animation-duration:52s]">
              <LogoRow clients={clients} />
              <LogoRow clients={clients} hidden />
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

        {/* En bout de bande, après les logos : la commande est nécessaire, elle n'a pas
            à disputer l'attention au titre ni aux marques. */}
        {defile ? <PauseControl /> : null}
      </Container>
    </section>
  )
}

/**
 * La commande de pause du bandeau, en bout de bande.
 *
 * **Un `label` et non un bouton**, parce que l'état vit dans une case à cocher : la pause
 * fonctionne donc sans JavaScript et dès le premier rendu, là où un bouton à état React
 * n'aurait servi qu'après l'hydratation - c'est-à-dire pas au moment où le défilement
 * gêne le plus.
 *
 * **Une icône seule, et le libellé pour les lecteurs d'écran.** WCAG 2.2.2 demande un
 * mécanisme, pas un mécanisme textuel : à cet endroit de la page, deux mots de plus
 * disputeraient l'attention au titre et aux marques. Le `title` donne l'infobulle au
 * survol, le texte `sr-only` donne la même phrase à qui écoute la page.
 *
 * La cible fait 44 px comme le reste des commandes du site, et le focus visible est celui
 * de `:focus-visible` global - la case étant masquée, l'anneau se pose sur le libellé par
 * `has-[:focus-visible]`.
 */
function PauseControl() {
  return (
    <label
      htmlFor="hel-logos-pause"
      className="grid size-11 flex-none cursor-pointer place-items-center rounded-sm text-faint transition-colors duration-100 hover:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-info"
    >
      <span
        className="hel-logos-when-running inline-flex items-center"
        title="Arrêter le défilement des logos"
      >
        <Pause aria-hidden="true" className="size-3.5" strokeWidth={2} />
        <span className="sr-only">Arrêter le défilement des logos</span>
      </span>
      <span
        className="hel-logos-when-paused inline-flex items-center"
        title="Reprendre le défilement des logos"
      >
        <Play aria-hidden="true" className="size-3.5" strokeWidth={2} />
        <span className="sr-only">Reprendre le défilement des logos</span>
      </span>
    </label>
  )
}

/** La liste, rendue deux fois pour que le défilement boucle sans saut. */
function LogoRow({
  clients,
  hidden = false,
}: {
  clients: readonly Client[]
  hidden?: boolean
}) {
  return (
    <ul
      aria-hidden={hidden ? "true" : undefined}
      /*
        `inert` sur la copie, et il n'est pas décoratif : depuis que les logos font lien,
        un `aria-hidden` seul laisserait huit ancres focalisables dans une rangée que rien
        n'annonce - la tabulation traverserait deux fois les mêmes marques, la seconde
        fois en silence.
      */
      inert={hidden}
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
 * **La hauteur est bornée, jamais la largeur**, et une hauteur unique ne suffit pas : un
 * logotype à 28 px de haut couvre 140 px de large, un carré n'en couvre que 28. Les carrés
 * reçoivent donc plus de hauteur.
 *
 * **Désaturés en clair, tels quels en sombre**, et l'asymétrie est voulue : à pleine
 * couleur sur le plateau clair, huit logos deviennent la zone la plus criarde de la page
 * et volent le seul geste orange de l'écran. Sur l'encre, ces mêmes couleurs ressortent
 * sans crier, là où le gris ferait des taches ternes.
 *
 * **Les deux variantes d'une marque monochrome sont rendues, le CSS en masque une.** Le
 * thème est une classe sur `<html>` et non la seule préférence système, puisque le
 * sélecteur permet de le forcer : un `<picture media>` se désynchroniserait d'un choix
 * manuel. Même mécanique que les portraits d'équipe.
 *
 * **Le logo fait lien vers le site du client, dans un nouvel onglet.** La bande reste une
 * preuve : c'est justement une preuve qu'un visiteur doit pouvoir aller vérifier, et le
 * nouvel onglet lui évite de perdre la page d'accueil pour le faire.
 */
function ClientLogo({ client }: { client: Client }) {
  const taille =
    client.shape === "square" ? "h-10 w-auto md:h-11" : "h-7 w-auto md:h-8"
  /*
    La couleur revient au survol **et à la prise de focus**, et la seconde moitié n'est pas
    un ornement : depuis que le logo est un lien, il se parcourt au clavier, et un état
    focalisé qui ne rendrait que l'anneau laisserait la marque grise pendant qu'on la
    désigne. Les variantes sont nommées (`/logo`) pour ne pas être capturées par le
    `group` de la piste, qui pilote la pause du défilement.
  */
  const rendu =
    "opacity-70 grayscale transition-[opacity,filter] duration-[200ms] ease-expo group-hover/logo:opacity-100 group-hover/logo:grayscale-0 group-focus-visible/logo:opacity-100 group-focus-visible/logo:grayscale-0 dark:opacity-100 dark:grayscale-0"

  const images =
    typeof client.logo === "string" ? (
      <Logo
        src={client.logo}
        alt={client.name}
        className={`${taille} ${rendu}`}
      />
    ) : (
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

  /*
    Une référence sans site reste un logo nu. La base rend une chaîne vide quand le champ
    n'a pas été rempli, et une ancre vide mènerait à la page courante : un lien qui ne va
    nulle part coûte plus qu'il ne rapporte.
  */
  if (!client.site) {
    return images
  }

  return (
    <a
      href={client.site}
      target="_blank"
      rel="noreferrer"
      /*
        `min-h-11 min-w-11` : la cible fait 44 px comme le reste des commandes du site, y
        compris pour un logotype rendu à 28 px de haut. La zone gagnée est du vide autour
        du dessin, donc la bande ne bouge pas.
      */
      className="group/logo inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm"
    >
      {images}
      {/* Un lien qui change de fenêtre le dit, sinon le retour arrière semble cassé. */}
      <span className="sr-only">, voir le site (nouvel onglet)</span>
    </a>
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
