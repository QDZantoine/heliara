/**
 * La section « Où nous intervenons » de l'accueil.
 *
 * **Elle existe pour une raison de fond avant d'être une raison de référencement.** Un
 * prospect qui cherche un prestataire pour son site commence par se demander s'il pourra
 * lui parler autrement que par écran interposé. Le site ne le disait nulle part : ni la
 * page de contact, ni l'accueil ne nommaient un territoire.
 *
 * **Ce qu'elle n'est pas.** Une page par ville - « développeur web à Nîmes », « agence
 * web à Paris » - est une page satellite, que Google sanctionne nommément, et sur un site
 * de quelques pages utiles cela se verrait immédiatement. Une seule section, sur
 * l'accueil, qui dit la vérité une fois.
 *
 * **Ce qui est affirmé, et ce qui est démenti.** Les quatre villes sont celles où le
 * studio se déplace ; l'aveu qu'il n'y a pas d'agence dans chacune fait partie du
 * contenu, il n'en est pas l'omission. Déclarer un établissement qui n'existe pas est le
 * premier motif de sanction en référencement local - et le dire soi-même vaut mieux que
 * de laisser un visiteur le découvrir.
 *
 * Les villes elles-mêmes vivent dans `lib/site.ts` (`serviceAreas`), lues aussi par le
 * pied de page, `areaServed` des données structurées et `llms.txt` : une seule liste,
 * quatre lecteurs.
 */
export const areasSection = {
  eyebrow: "Où nous intervenons",
  title: "Sur place quand ça compte, à distance le reste du temps.",
  lead: "Un cadrage se mène mieux dans la même pièce : comprendre un métier suppose de voir les gens le faire. Le reste d'un projet - les itérations, les démonstrations, la mise en production - se conduit très bien à distance, et c'est ce qui permet de travailler pour des clients que deux heures de route séparent de nous.",
  /**
   * La ligne qui suit les villes.
   *
   * Elle dit ce que la liste ne dit pas, et c'est le point de la section : quatre villes
   * nommées laissent croire à quatre bureaux.
   */
  note: "Pas d'agence dans chacune de ces villes, et nous ne prétendrons pas le contraire : ce sont celles où nous nous déplaçons. Ailleurs en France, le projet se mène à distance, avec les mêmes jalons et les mêmes livrables.",
} as const
