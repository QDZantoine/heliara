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
  /** Le site du client. Le bandeau ne fait pas de lien : c'est une preuve, pas une pub. */
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
