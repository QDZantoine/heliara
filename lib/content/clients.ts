/**
 * Les références clientes du bandeau de preuve sociale.
 *
 * **Une seule condition pour ajouter une entrée : l'accord écrit du client pour être
 * cité.** Un logo est une marque, et l'afficher sous « ils nous font confiance » est une
 * affirmation commerciale.
 *
 * **Ne jamais y mettre les clients d'une marque sœur.** L'AFORP, le Cnam ou Ingetis sont
 * des références de LessonSharing : les afficher ici cumulerait une affirmation fausse et
 * un usage de marque sans autorisation. Hexceos et LessonSharing elles-mêmes y figurent,
 * parce que leurs sites sont des projets Heliara - la nuance tient à ce qu'on a fait pour
 * elles, pas à l'appartenance au même groupe.
 */

export type Client = {
  /** Le nom, tel qu'il s'écrit. Sert d'alternative textuelle au logo. */
  name: string
  /**
   * Le logo, dans `public/trusts-logos/`.
   *
   * SVG de préférence, sinon un PNG à **fond transparent** d'au moins 80 px de haut : la
   * bande pose les logos sur la surface de la page, donc un fichier opaque y dessine un
   * rectangle, et un écran à deux fois la densité réclame 56 px pour un affichage à 28.
   *
   * **Une chaîne quand un seul fichier tient sur les deux thèmes** - le cas d'un logo en
   * couleur. Une paire `{ light, dark }` quand la marque est monochrome, car un logo noir
   * disparaît sur l'encre. **Ne pas inventer la seconde en inversant la première** :
   * l'inversion écrase les formes internes et fabrique une couleur que la marque n'a pas.
   */
  logo: string | { light: string; dark: string }
  /**
   * La forme du logo, qui décide de sa hauteur d'affichage.
   *
   * Un logotype à 28 px de haut couvre 140 px de large, un carré n'en couvre que 28 :
   * `square` reçoit donc plus de hauteur, sans quoi il se lit quatre fois plus petit.
   * Elle suit le fichier, pas la marque.
   */
  shape: "wide" | "square"
  /**
   * Le site du client, vers lequel le logo fait lien.
   *
   * **Facultatif de fait** : la base peut rendre une chaîne vide, et le bandeau rend
   * alors le logo sans ancre plutôt qu'un lien mort. Une URL complète, avec son schéma.
   */
  site: string
}

/** Les clients, dans l'ordre d'affichage. */
export const clients: readonly Client[] = [
  {
    name: "MyDigitalSchool",
    shape: "wide",
    logo: "/trusts-logos/logo-mydigitalschool.svg",
    site: "https://www.mydigitalschool.com",
  },
  {
    name: "South Clean",
    shape: "wide",
    logo: "/trusts-logos/logo-southclean.png",
    site: "https://southclean.fr",
  },
  {
    name: "BSL Portage",
    shape: "wide",
    logo: "/trusts-logos/bsl-logo.png",
    site: "https://bslportage.fr",
  },
  {
    name: "Yoginette",
    shape: "wide",
    logo: "/trusts-logos/yoginette-logo.png",
    site: "https://yoginette.fr",
  },
  {
    name: "Rabbit Web",
    shape: "square",
    logo: "/trusts-logos/rabbit-web-logo.png",
    site: "https://rabbitweb.fr",
  },
  {
    name: "Luundi",
    shape: "wide",
    logo: "/trusts-logos/logo-luundi.png",
    site: "https://luundi.fr",
  },
  {
    name: "Allianz Uzès",
    shape: "wide",
    /*
      Une paire, parce que le logotype est monochrome : un bleu unique, `#004a93`, qui
      ne donne que 1,4:1 sur la surface encre - une mesure, pas une impression. La
      variante sombre est le même dessin repeint en blanc, ce que l'usage de la marque
      prévoit sur fond sombre.

      **Repeint, et non inversé** : la règle de `Client.logo` tient, `invert` sur ce bleu
      donnerait un orange qu'Allianz n'a pas. Seul le canal alpha du fichier de référence
      est conservé, rempli de blanc, donc les contreformes du « A » et l'anneau de
      l'emblème restent ouverts. Vérifié à l'écran sur les deux plateaux.

      Le fichier de référence porte 500 x 313 px dont près de 60 % de vide vertical : les
      deux variantes sont détourées à 480 x 126, sans quoi le logo se lirait deux fois
      plus petit que ses voisins à hauteur égale.
    */
    logo: {
      light: "/trusts-logos/logo-allianz.png",
      dark: "/trusts-logos/logo-allianz-white.png",
    },
    site: "https://agence.allianz.fr/uzes-30700-530092",
  },
  // Les deux dernieres sont les marques soeurs : elles figurent ici parce que leurs sites
  // sont des projets Heliara. Si l'un cessait de l'etre, l'entree sortirait.
  {
    name: "Hexceos",
    shape: "wide",
    /*
      Une paire, parce que la marque est monochrome : le fichier de reference est
      entierement noir, donc invisible sur l'encre - mesure en le rendant a 120 px sur les
      deux plateaux.

      **La variante sombre est ce meme fichier, inverse**, ce qui est admissible ici et
      seulement ici : le dessin ne comporte aucune couleur a preserver, donc l'inversion
      rend exactement le blanc attendu, hexagone plein compris. Verifie a l'ecran. Pour un
      logo en couleur, la regle de `Client.logo` reste entiere - on demande le fichier.
    */
    logo: {
      light: "/trusts-logos/logo-hexceos.svg",
      dark: "/trusts-logos/logo-hexceos-white.svg",
    },
    site: "https://hexceos.fr",
  },
  {
    name: "LessonSharing",
    shape: "square",
    logo: "/trusts-logos/logo-lessonsharing.png",
    site: "https://lessonsharing.fr",
  },
]
