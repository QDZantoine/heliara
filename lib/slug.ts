/**
 * Dérive un identifiant d'URL depuis un titre, exactement comme `Slugify()` en SQL.
 *
 * **C'est un aperçu, pas la valeur.** La base produit l'identifiant final quand le
 * champ est laissé vide ; celui-ci ne sert qu'à montrer l'adresse avant
 * d'enregistrer. Les deux implémentations doivent donc rester cohérentes, et c'est le
 * test d'intégration qui vérifie celle qui compte.
 *
 * Recopiée dans deux formulaires de création jusqu'ici, sans qu'aucun test ne
 * couvre la copie : deux définitions d'une même règle de nommage finissent toujours
 * par diverger d'un caractère.
 */
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
