import Image from "next/image"

import { Container } from "@/components/primitives/container"
import { Eyebrow } from "@/components/primitives/eyebrow"
import { Reveal } from "@/components/primitives/reveal"
import { Section } from "@/components/primitives/section"
import { clients } from "@/lib/content/clients"

/**
 * Le bandeau de logos clients.
 *
 * **Il ne s'affiche pas tant qu'il n'y a rien à montrer.** Deux ou trois logos qui
 * défilent dans une bande conçue pour huit se lisent comme un manque ; et un bandeau
 * « Ils nous font confiance » vide serait pire que son absence. La section rend `null`
 * en dessous de quatre entrées - en dessous, une grille statique dit la même chose
 * sans donner l'impression qu'on étire ce qu'on a.
 *
 * Il a remplacé trois témoignages inventés, attribués à des personnes nommées avec
 * fonction et employeur. Un logo réel avec l'accord de son propriétaire vaut mieux
 * qu'un verbatim fabriqué, et le rôle de la section dans l'arc - une voix autre que
 * celle du studio, juste avant la demande - est le même.
 */
function ClientMarquee() {
  if (clients.length === 0) {
    return null
  }

  /*
    Assez de logos pour que le défilement ait un sens ? Sinon, une rangée fixe.

    La bande doit être plus large que l'écran pour boucler sans trou visible. Sous
    quatre logos, la copie de la liste apparaît dans le même champ de vision et le
    doublon se voit - on lit deux fois le même nom à trente centimètres d'écart.
  */
  const defile = clients.length >= 4

  return (
    <Section space="lg" aria-labelledby="confiance-titre">
      <Container>
        <Reveal className="mb-9 max-w-[35rem] md:mb-11">
          <Eyebrow className="mb-4">Preuve</Eyebrow>
          <h2
            id="confiance-titre"
            className="text-[clamp(1.625rem,6.5vw,2.75rem)] leading-[1.1] font-bold"
          >
            Ils nous font confiance.
          </h2>
        </Reveal>
      </Container>

      {/*
        Hors du `Container` quand ça défile : la bande doit filer d'un bord à l'autre
        de la fenêtre, sinon le dégradé d'estompage se voit s'arrêter au milieu de
        l'écran et le défilement a l'air enfermé dans une boîte.
      */}
      {defile ? (
        <div className="hel-commitments group overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
          <div className="hel-commitments-track flex w-max animate-marquee items-center py-2 group-hover:[animation-play-state:paused] max-menu:[animation-duration:52s]">
            <LogoRow />
            <LogoRow hidden />
          </div>
        </div>
      ) : (
        <Container>
          <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:justify-start md:gap-x-16">
            {clients.map((client) => (
              <li key={client.name}>
                <ClientLogo client={client} />
              </li>
            ))}
          </ul>
        </Container>
      )}
    </Section>
  )
}

/** La liste, rendue deux fois pour que le défilement boucle sans saut. */
function LogoRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden ? "true" : undefined}
      className="flex shrink-0 items-center gap-12 pr-12 md:gap-16 md:pr-16"
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
 * Un logo, ramené à une hauteur commune.
 *
 * **La hauteur est bornée, jamais la largeur** : les logos clients n'ont pas les mêmes
 * proportions - un carré et un logotype horizontal côte à côte - et fixer la largeur
 * rendrait le carré minuscule et l'horizontal énorme. Une hauteur commune est ce qui
 * les fait peser pareil à l'œil.
 *
 * **`grayscale` et une opacité réduite, relevées au survol.** Ce n'est pas une
 * coquetterie : sept logos aux couleurs de sept marques, à pleine saturation, feraient
 * de la bande la zone la plus criarde de la page et voleraient le seul geste orange de
 * l'écran. En gris, ils se lisent comme une liste de références - ce qu'ils sont - et
 * la couleur revient quand on s'y intéresse.
 */
function ClientLogo({ client }: { client: (typeof clients)[number] }) {
  return (
    <Image
      src={client.logo}
      alt={client.name}
      width={240}
      height={80}
      className="h-8 w-auto opacity-70 grayscale transition-[opacity,filter] duration-[200ms] ease-expo hover:opacity-100 hover:grayscale-0 md:h-9 dark:opacity-60 dark:invert dark:hover:opacity-100"
    />
  )
}

export { ClientMarquee }
