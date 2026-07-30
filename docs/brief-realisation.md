# Fiche de réalisation - ce qu'il faut fournir

Brief à donner tel quel à un assistant pour qu'il rédige une fiche de réalisation
Heliara. Les contraintes viennent des sources de vérité du projet : `lib/schemas/case.ts`
pour la validation, `publish_case_study` dans `db/init/07-proc-cases.sql` pour ce
qu'exige la publication, et les vues publiques pour ce qui s'affiche où.

**Une fiche par projet, en un bloc de texte structuré.** Ne pas inventer : un champ
facultatif laissé vide fait simplement disparaître son bloc de la page, ce qui vaut
mieux qu'une valeur approximative.

---

## Ce qui est obligatoire pour publier

Cinq choses, et rien de plus. Sans elles la base refuse la publication.

| Champ      | Limite      | Ce que c'est                                                                 |
| ---------- | ----------- | ---------------------------------------------------------------------------- |
| `title`    | 200 car.    | Le nom du projet sur toutes les cartes de listing. Court.                     |
| `sector`   | 80 car.     | Sert de filtre sur `/realisations`. Reprendre un secteur existant si possible. |
| `summary`  | 600 car.    | Résumé **court** : deux lignes sous le titre, sur les cartes du hub.          |
| `teaser`   | 1200 car.   | Résumé **long** : carte de l'accueil, et sous le titre du hero de la fiche.   |
| `chapters` | 1 minimum   | Au moins un chapitre de récit. Voir la structure plus bas.                    |

`year` est également exigé à la création (max 9 caractères, par exemple `2026`).

---

## Ce qui est facultatif

Chaque bloc est conditionné à son contenu : absent, il ne s'affiche pas. Ne rien
remplir par défaut.

### Identité et accroche

| Champ       | Limite    | Ce que c'est                                                                                    |
| ----------- | --------- | ----------------------------------------------------------------------------------------------- |
| `slug`      | 120 car.  | L'identifiant d'URL. Minuscules, chiffres, tirets simples, sans accent. Déduit du titre si omis. |
| `heroTitle` | 300 car.  | Le grand titre en haut de la fiche. Une phrase, **avec le résultat dedans**.                     |
| `badge`     | 160 car.  | La petite ligne au-dessus du titre du hero. Par exemple `Industrie · Plateforme métier`.         |

### Le chiffre d'accroche

Le couple s'affiche sur les cartes de listing. Les deux ou aucun.

| Champ     | Limite   | Ce que c'est                                                     |
| --------- | -------- | ---------------------------------------------------------------- |
| `figure`  | 40 car.  | La valeur seule. Par exemple `-38 %`, `×3`, `11 min`.            |
| `measure` | 160 car. | Ce qu'elle mesure. Par exemple `de temps administratif par commande`. |

### Le récit - `chapters`

Une liste ordonnée. C'est le cœur de la fiche, et le seul bloc obligatoire.

| Champ     | Obligatoire | Limite    | Ce que c'est                                                 |
| --------- | ----------- | --------- | ------------------------------------------------------------ |
| `title`   | oui         | 200 car.  | Le titre du chapitre. Par exemple `Contexte`, `Difficultés`. |
| `text`    | oui         | -         | Le corps, en **HTML restreint** - voir la contrainte ci-dessous. |
| `callout` | non         | 2000 car. | Encadré de décision structurante, en **texte simple**.       |

Ne pas fournir de numéro : la numérotation est refaite à l'enregistrement, dans
l'ordre de la liste.

**Contrainte sur `text` : HTML validé contre une liste fermée.** Tout écart fait
rejeter l'enregistrement, il n'y a aucune réparation automatique.

- Balises acceptées, et **aucune autre** : `p` `br` `strong` `b` `em` `i` `s` `code`
  `a` `ul` `ol` `li` `blockquote`.
- Pas de titres (`h1`…`h6`) : la hiérarchie appartient au gabarit de page.
- Pas d'attribut, sauf `href`, `target` et `rel` sur `a`.
- Liens en `https://`, `mailto:`, `tel:`, `/` ou `#` seulement.
- Pas de commentaire HTML.
- Chaque paragraphe dans son `<p>`.

### Les résultats mesurés - `results`

Une liste. Quatre valeurs se lisent bien, huit ne se lisent plus.

| Champ   | Obligatoire | Limite   | Ce que c'est                                    |
| ------- | ----------- | -------- | ----------------------------------------------- |
| `value` | oui         | 40 car.  | La valeur. Par exemple `-61 %`, `0`, `4,6/5`.   |
| `label` | oui         | 200 car. | Ce qu'elle mesure.                              |

`resultsLabel` (160 car.) remplace le titre du bloc, « Résultats » par défaut.

### Le témoignage

**Tout ou rien** : les trois premiers champs remplis, ou aucun. Un verbatim sans nom
ne s'affiche pas, un nom sans verbatim n'a rien à dire.

| Champ                 | Limite    | Ce que c'est                        |
| --------------------- | --------- | ----------------------------------- |
| `testimonialQuote`    | 1200 car. | Le verbatim, tel que dit.           |
| `testimonialName`     | 120 car.  | Le nom de la personne.              |
| `testimonialRole`     | 160 car.  | Sa fonction et son employeur.       |
| `testimonialInitials` | 4 car.    | Ses initiales, pour la pastille.    |

**Ne jamais rédiger un témoignage.** Il se demande à son auteur, se relit et se fait
valider par écrit. Un verbatim inventé attribué à une personne nommée est le contenu
le plus exposé qu'un site puisse porter.

### La fiche technique - `meta`

Le tableau en fin de page. Une liste de couples.

| Champ   | Obligatoire | Limite   | Ce que c'est                                         |
| ------- | ----------- | -------- | ---------------------------------------------------- |
| `label` | oui         | 120 car. | Par exemple `Durée`, `Équipe`, `Stack`, `Périmètre`. |
| `value` | oui         | 300 car. | Par exemple `7 mois jusqu'à la production`.          |

### Les enseignements - `lessons`

Une liste de textes libres. Ce que la mission a appris, sans langue de bois - c'est la
section qui sonne le plus juste quand elle admet une limite.

---

## Ce qui ne se fournit pas par écrit

À faire dans l'administration après la création, pas dans le texte :

- **`heroMediaId`** et la **galerie** : les images passent par le dépôt de fichiers de
  l'administration, qui rend un identifiant. Impossible à produire à l'avance.
- **`halo`** (`warm` ou `cool`), **`accent`** (`brand` ou `info`), **`featured`**,
  **`wide`** : réglages d'affichage. Valeurs par défaut acceptables, à ajuster à
  l'écran.

---

## Le ton, qui compte autant que les champs

- **Le résultat dans le titre.** Un visiteur doit savoir ce que la mission a produit
  avant de cliquer.
- **Des valeurs exactes uniquement.** Un chiffre qu'on ne peut pas justifier vaut moins
  qu'un chiffre absent : sans `figure`, la carte n'affiche simplement pas le bloc.
- **Le problème avant la solution.** Le premier chapitre décrit la situation du client
  dans ses mots.
- **Admettre les difficultés.** Un chapitre « Difficultés, et ce qu'on en a fait » vaut
  mieux qu'un récit sans accroc, que personne ne croit.
- **Aucun cadratin ni demi-cadratin**, jamais : ni `—` ni `–`. Un tiret simple `-`
  partout où un séparateur est nécessaire. Cette règle vaut pour tout le contenu.
- Pas de superlatif, pas d'exclamation, pas de jargon technique dans les résumés - le
  décideur qui lit n'est pas développeur.

---

## Le format attendu en retour

Un bloc par projet, les champs nommés comme ci-dessus. Le YAML ou le JSON conviennent
tous les deux, et le texte structuré aussi du moment que chaque champ est identifiable.

```yaml
- slug: refonte-site-mairie-silligny
  title: Refonte du site de la mairie de Silligny
  sector: Public
  year: "2026"
  heroTitle: ...
  badge: ...
  summary: ...
  teaser: ...
  figure: ...
  measure: ...
  chapters:
    - title: Contexte
      text: "<p>...</p><p>...</p>"
      callout: ...
  results:
    - value: ...
      label: ...
  meta:
    - label: Durée
      value: ...
  lessons:
    - ...
```
