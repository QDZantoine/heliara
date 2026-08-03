---
name: animations
description: Le mouvement du site Heliara : la transition de page PageCurtain, les sept illustrations Lottie et leur politique de chargement, et la methode pour mesurer la fluidite plutot que la juger a l'oeil. A charger avant de toucher a components/layout/page-curtain.tsx, components/visuals/** ou lib/lottie.ts.
---

<!--
  Extrait de CLAUDE.md, ou ces sections etaient residentes a chaque session pour un
  contenu qui ne sert qu'a une tache precise. Le fichier racine garde les
  interdictions dures et un pointeur vers ici.
-->

## Transition de page

`PageCurtain` (dans le layout) intercepte les clics sur les liens internes, fait apparaître un voile encre en fondu avec l'illustration Lottie en son centre, navigue écran couvert, puis lève le voile pendant que la page entrante monte se mettre en place.

**Trois pièces, deux propriétés.** Le voile (`opacity`), l'illustration (`opacity`) et `main` (`opacity` + `transform`) : rien d'autre. Tout est composé par le GPU, il n'y a ni mise en page ni peinture pendant l'animation, donc rien qui puisse saccader. Les versions précédentes - voile à crêtes arrondies, puis traits en lentille balayant en diagonale sur six couches de grande taille - sont restées perçues comme sèches malgré un profil d'images propre à la mesure. **Ne pas y revenir sans une raison forte.**

Le détail qui fait l'élégance : la montée de la page (560 ms) dure plus longtemps que le lever du voile (400 ms), si bien qu'elle finit de se poser à découvert. C'est ce décalage qui donne une impression d'arrivée plutôt que d'apparition. `REVEAL_MS` doit donc couvrir la plus longue des deux animations, sinon elle serait retirée en plein vol.

**Seule l'arrivée est animée, pas le départ.** Animer aussi la page sortante obligeait le navigateur à promouvoir `main` - plusieurs milliers de pixels de haut - au moment même du clic : 140 ms de blocage mesurés, précisément là où la réactivité compte le plus. Sur l'arrivée, cette promotion tombe pendant le répit, écran couvert, donc invisible. Et on ne perd presque rien : la page sortante est recouverte aussitôt.

Quatre points la maintiennent propre :

1. **Interception en phase de capture.** `next/link` navigue dans son propre `onClick` et n'abandonne que si l'évènement est déjà préempté ; en phase de bulle, la navigation a déjà eu lieu et le voile ne se déclenche jamais. La propagation n'est pas coupée, pour que les `onClick` portés par les liens continuent de s'exécuter (c'est ainsi que le menu mobile se ferme).
2. **`data-scroll-behavior="smooth"` sur `<html>`.** Sans lui, Next anime le retour en haut de page à chaque navigation, et ce scroll animé entre en concurrence avec le voile. Next l'annonce en clair dans le log de dev.
3. **Un répit avant le lever** (`SETTLE_MS`, 140 ms). Le voile ne doit pas se lever au moment où React commite la page entrante : sa mise en page, sa peinture et son hydratation tomberaient sur les premières images de l'animation. Ce répit se passe écran couvert, donc invisible.
4. **Le contenu entrant n'anime pas par-dessus le voile.** `PageCurtain` pose la phase dans `data-curtain` sur `<html>` - c'est ce qui permet au CSS d'animer `main` sans qu'aucun composant de page ait à le savoir. `Reveal` lit ce drapeau **au moment où il révèle** - pas au montage, sinon les blocs sous la ligne de flottaison perdraient leur apparition au scroll - et pose `data-reveal-now`, qui coupe le fondu. Le geste de page est la transition ; empiler trente fondus de 600 ms par-dessus rend l'arrivée confuse.

Un filet de sécurité rouvre le voile si la navigation n'aboutit pas. Sans JavaScript et sous `prefers-reduced-motion`, les liens naviguent normalement.

Pas de `framer-motion` : tout porte sur `opacity` et `transform`, déjà composés par le GPU. La bibliothèque n'améliorerait pas la fluidité et ajouterait du poids.

### Illustration Lottie

`public/animated-illustrations/loading-animation-white.json` (7,3 ko, quatre calques vectoriels, 1,9 s par cycle, sans expressions) est jouée par `lottie-web`, centrée dans le voile.

- **Chargement à la demande.** `lottie-web/build/player/lottie_light` (~168 ko, la variante sans expressions suffit puisque le fichier n'en contient aucune) est importé dynamiquement dans un `requestIdleCallback`, jamais avant : il ne pèse pas sur le premier rendu, et il n'est pas téléchargé du tout sous `prefers-reduced-motion`. Si le chargement échoue ou n'a pas eu le temps d'aboutir, la transition se joue sans illustration.
- **La taille se porte sur le conteneur, pas sur le SVG.** `lottie-web` pose `width: 100%` en style inline sur le SVG qu'il crée : une règle CSS visant le SVG est perdue. D'où le `div.hel-curtain-lottie` intermédiaire.
- **L'illustration est enfant du voile**, donc son opacité se multiplie à la sienne : elle s'efface avec lui au lever, sans règle dédiée. Elle n'a qu'un retard d'apparition, le temps que le voile devienne franchement opaque.
- **`COVERED_MS` (520 ms) est le réglage qui compte** : c'est lui qui donne à l'illustration le temps d'être lue. Avec `LOTTIE_SPEED` à 1,6 le cycle tombe à 1,2 s, dont on voit environ la moitié. Une transition plus vive se règle en baissant `COVERED_MS`, au prix d'une illustration plus fugace.
- L'animation est mise en pause au retour à `idle` : rien ne tourne en fond entre deux navigations.
- La lecture Lottie se fait sur le thread principal, mais les animations du voile et de `main` portent sur des propriétés composées : elles ne peuvent pas être bloquées par elle. Mesuré, cinq passages avec l'illustration active : aucune frame au-delà de 24 ms.

### Mesurer la fluidité, ne pas la juger à l'œil

Des captures ne disent rien du nombre d'images perdues. Installer un enregistreur `requestAnimationFrame` qui note à chaque frame l'horodatage **et** la valeur de `data-phase`, déclencher la navigation, puis agréger les écarts par phase. L'agrégation par phase est ce qui compte : une pause de 150 ms pendant que l'écran est couvert est invisible, la même pause pendant le lever est un défaut. Référence en production : médiane 8,3 ms, maximum 9,4 ms, **aucune frame au-delà de 24 ms** sur `cover` comme sur `reveal`.

Trois pièges de méthode, tous rencontrés :

- **Chrome headless annonce `prefers-reduced-motion: reduce` par défaut**, ce qui désactive toute la transition. Forcer `no-preference` via `Emulation.setEmulatedMedia`, sinon on mesure une page sans animation.
- **Un `next start` resté en vie sert un build périmé.** Les chunks répondent alors en 500, l'hydratation échoue, la transition ne tourne pas - et la mesure affiche une fluidité parfaite qui ne mesure rien. Vérifier qu'un chunk référencé par le HTML répond en 200, et surveiller `Network.responseReceived` pour les statuts ≥ 400. Le `data-phase` du DOM est rendu côté serveur : sa présence ne prouve pas que le composant client a pris la main.
- **`element.click()` ne déclenche pas `pointerdown`.** Sans conséquence sur l'implémentation actuelle, mais à savoir si un jour un comportement en dépend : émettre la séquence `pointerdown` → `pointerup` → `click`.

## Illustrations Lottie

**Tous les fichiers vivent dans `public/animated-illustrations/`**, et pas à la racine de
`public/`. Sept JSON mêlés aux logos, aux icônes et aux illustrations SVG rendaient le
dossier illisible ; un sous-dossier les nomme pour ce qu'ils sont. Les chemins passés à
`LottieScene` et à `loadLottieData` sont donc préfixés - un fichier ajouté à la racine ne
serait pas trouvé.


Six illustrations, **un seul composant** : `components/visuals/lottie-scene.tsx`. Ne pas réécrire un lecteur ailleurs, tout passe par lui.

`lib/lottie.ts` centralise le chargement : `loadLottie()` mémorise l'import dynamique de `lottie-web/build/player/lottie_light`, `loadLottieData(url)` mémorise le `fetch` du JSON, `whenIdle()` diffère avec repli sur un délai pour Safari. Un seul chunk, un seul téléchargement par fichier, quel que soit le nombre de scènes.

### `LottieScene`, et sa politique de chargement

`load` est le réglage qui compte :

- **`"visible"` (défaut)** : téléchargement à l'approche du champ, marge de 300 px. Un visiteur qui ne descend pas jusqu'à la section ne télécharge rien. Vérifié : sur `/le-groupe`, les 778 ko de la chaîne de valeur ne partent qu'au défilement.
- **`"eager"`** : dès le montage. Réservé à ce qui est au-dessus de la ligne de flottaison, c'est-à-dire l'illustration du hero d'accueil, et à rien d'autre.
- **`"idle"`** : quand le navigateur est inoccupé. Pour ce qui doit être prêt sans être visible, comme le sélecteur de thème du footer.

Les autres garanties sont communes à toutes les scènes, et c'est la raison d'être du composant : boîte dimensionnée avant chargement (aucun décalage de mise en page), lecture arrêtée hors du champ et jamais relancée hors du champ, image représentative figée sous `prefers-reduced-motion` plutôt qu'une absence, et boîte vide sans casse si le fichier n'arrive pas.

`holdMs` pilote la boucle à la main quand il faut tenir une pause entre deux cycles : Lottie ne sait pas le faire.

### Trois règles apprises à l'usage

- **La variante `lottie_light` suffit** : aucun de nos fichiers n'utilise d'expressions utiles, et le build complet pèse près de 140 ko de plus. Le fichier du hero en contient deux, qui sont des formules de rebond élastique - la DA interdit le rebond, ne pas les évaluer est donc un gain.
- **La taille se porte sur le conteneur, jamais sur le SVG** : `lottie-web` pose `width: 100%` en style inline sur le SVG qu'il crée, une règle CSS visant le SVG serait perdue.
- **Un fichier sans marqueur demande un relevé image par image.** C'est le cas du sélecteur de thème : les repères ont été trouvés en rendant la séquence, puis consignés en constantes.

### Inventaire

| Fichier                               | Usage                       | Chargement                       | Notes                                         |
| ------------------------------------- | --------------------------- | -------------------------------- | --------------------------------------------- |
| `hero-product.json` (47 ko)           | hero d'accueil              | `eager`                          | 0,44× et arrêt de 2,2 s : cycle mesuré à 10 s |
| `loading-animation-white.json` (7 ko) | transition de page          | à la demande, dans `PageCurtain` | en boucle, 1,6×                               |
| `theme-toggle.json` (56 ko)           | sélecteur de thème          | `idle`                           | segments relevés à la main, 2,2×              |
| `chain-former.json` (227 ko)          | chaîne de valeur, Former    | `visible`                        | 0,7×                                          |
| `chain-concevoir.json` (177 ko)       | chaîne de valeur, Concevoir | `visible`                        | 0,75×                                         |
| `chain-operer.json` (374 ko)          | chaîne de valeur, Opérer    | `visible`                        | 0,75×                                         |
| `error-404.json` (94 ko)              | page 404                    | `eager`                          | 0,9× et arrêt de 1,2 s                        |

Les artboards ont des proportions et des marges internes différentes : chaque scène porte une échelle en `transform` pour équilibrer les tailles apparentes, jamais une largeur, afin de ne pas toucher à la mise en page.

### `public/animated-illustrations/hero-product.json` - illustration du hero

48 ko, trois calques nommés `wireframe`, `code`, `hi-fidelity` : les trois fenêtres s'empilent, tiennent la pose, puis recommencent. C'est le propos du studio montré plutôt qu'écrit, et cela reste dans la règle de la DA - illustration abstraite, volumes simples, jamais de photo ni de 3D gadget. Elle a remplacé la fenêtre produit en CSS pur et ses trois cartes flottantes (`hero-stage`, `product-window`, `parallax`, supprimés).

- **Le rythme est ralenti et la boucle marque un temps d'arrêt.** Lecture à 0,44× (3,5 s d'origine portées à 8 s) et `loop: false` plus un délai de 2,2 s en fin de cycle, Lottie ne sachant pas tenir une pause entre deux boucles. La pause perçue est plus longue que ce délai : la fin du fichier compte environ une seconde sans changement visible. Mesuré sur le rendu - cycle de 10 s, dont 6,7 s de mouvement et 3,3 s d'arrêt. C'est cette respiration, plus que la lenteur, qui rend l'illustration calme.
- **Seul usage chargé sans attendre l'inoccupation** : l'illustration est au-dessus de la ligne de flottaison. Le chargement reste posté après le premier rendu, et le LCP est le titre rendu côté serveur, donc il n'est pas retardé.
- **La boîte est dimensionnée avant le chargement** : aucun décalage de mise en page à l'arrivée de l'illustration.
- **La lecture s'arrête hors du champ** (`IntersectionObserver`), et le cycle ne se relance pas hors champ : rien n'occupe le processeur pendant le reste du défilement. Si le cycle s'est terminé pendant l'absence, il repart du début plutôt que de reprendre sur la dernière image.
- **Sous `prefers-reduced-motion`, l'illustration est figée sur sa dernière image** plutôt qu'absente : on garde le visuel, on retire le mouvement.
- **La mise à l'échelle est un `transform`**, pas une largeur : l'artboard porte de larges marges internes, et un transform leur fait rendre l'espace sans toucher à la mise en page ni provoquer de débordement horizontal.
- Les 11 expressions du fichier sont deux formules de **rebond élastique**, que `lottie_light` n'évalue pas. C'est voulu : la DA interdit le rebond. Le rendu a été comparé image par image contre le build complet - identique par ailleurs.
- Le fichier fonctionne tel quel sur les deux thèmes : sur l'encre, ses panneaux clairs se lisent comme des écrans allumés. Aucune recoloration.

### `public/animated-illustrations/theme-toggle.json` - sélecteur de thème

57 ko, 19 calques, 60 i/s, 481 images. Le fichier enchaîne les deux bascules avec de longues tenues entre elles, **sans marqueur** : les repères ont été relevés en rendant la séquence image par image, et sont consignés en constantes dans `theme-toggle.tsx` (`LIGHT_REST` 40, `DARK_REST` 305, `TO_DARK` [40, 120], `TO_LIGHT` [305, 400]). On ne joue que les transitions, à 2,2× - 2 s d'origine par bascule serait bien trop lent pour une commande - et l'on se repose sur l'image de tenue d'où part la transition suivante. Les tenues étant visuellement identiques, le saut de l'une à l'autre ne se voit pas.

Deux pièges rencontrés, à ne pas réintroduire :

- **Suivre `resolvedTheme`, pas le clic.** Le thème change aussi par le raccourci clavier de `ThemeProvider` et par la préférence système ; un interrupteur piloté par le clic se désynchronise.
- **Mémoriser le thème précédent même quand le lecteur n'est pas encore chargé.** Sinon la première bascule est prise pour un premier rendu et saute à l'état final au lieu de s'animer. C'est un bug qui ne se voit qu'en capturant la séquence, jamais en lisant le code.
