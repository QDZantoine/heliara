# Heliara — conventions du projet

Site vitrine + portfolio du studio Heliara (marque du groupe Hexceos).
Next.js 16 App Router · TypeScript · Tailwind CSS v4 · shadcn/ui (style `base-nova`, primitives `@base-ui`).

## Sources de vérité

- `reference/claude-design/*.html` — maquettes « Claude Design » exportées. **Source de vérité pour le design et le contenu uniquement.** Le framework `<x-dc>` n'est jamais repris : tout est réimplémenté en Next/Tailwind idiomatique.
- `Heliara - Direction Artistique v2.dc.html` — la DA à suivre (« Lumière d'écran »).
- `Heliara - Architecture UX.dc.html` — routes, parcours, fiches de pages, principes UX.
- `Heliara - Responsive Guidelines.dc.html` — règles de transformation desktop → tablette → mobile.
- Écart connu : la fiche UX annonce 5 temps de méthode, la maquette Méthode en montre 8. **La maquette gagne** (8 temps sur `/methode`, condensés en 4 sur l'accueil).

## Commandes

```
pnpm dev        # Turbopack
pnpm lint       # eslint (flat config)
pnpm typecheck  # tsc --noEmit
pnpm build
pnpm format     # prettier --write
```

Après chaque phase : `pnpm lint && pnpm typecheck && pnpm build`, puis un commit atomique.

## Style de code

Le `.prettierrc` du projet fait loi, y compris quand il contredit une préférence globale :

- pas de point-virgule (`semi: false`)
- **double quotes** (`singleQuote: false`)
- 2 espaces, `printWidth: 80`, `trailingComma: "es5"`
- `prettier-plugin-tailwindcss` trie les classes — ne pas les réordonner à la main

Autres règles :

- Nommage de fichiers en `kebab-case`, composants en `PascalCase`.
- Server Components par défaut. `"use client"` réservé à : menu mobile, sélecteur de thème, filtres de réalisations, formulaire de contact, apparitions au scroll.
- Contenu éditorial : données statiques typées dans `lib/content/*.ts`, jamais en dur dans le JSX.
- Le caractère `—` est autorisé dans le contenu éditorial français (il fait partie de la DA), interdit dans les titres de documents et messages de commit.

## Design tokens

Tailwind v4 : aucun `tailwind.config`. Tout vit dans `app/globals.css`, en deux couches :

1. `:root` / `.dark` déclarent les variables brutes `--hel-*` (hex, ombres, halos, easings).
2. `@theme inline` les expose comme utilitaires Tailwind (`bg-surface`, `text-brand-text`, `shadow-3`, `ease-expo`, `max-w-page`…) **et** mappe la nomenclature shadcn dessus (`--color-background`, `--color-primary`, `--color-ring`…), pour que tout composant shadcn ajouté ensuite hérite de la DA sans retouche.

Dark mode : classe `.dark` sur `<html>`, pilotée par `next-themes`. Un composant peut donc lire l'état du thème en CSS (`dark:hidden`) plutôt qu'en React : c'est ce que fait `ThemeToggle`, ce qui évite la garde `mounted` et le rendu vide à l'hydratation.

Breakpoints : ceux de Tailwind, plus `2xl` ramené à 1440 px et un `menu` à 900 px, qui est la bascule nav horizontale / menu plein écran (`hidden menu:flex`).

### Nommage des couleurs

| Utilitaire                                                         | Rôle                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `page` `surface` `raised` `inset` `inverse`                        | surfaces, du fond au plus élevé                                        |
| `ink` `body` `label` `faint`                                       | texte : titres · courant · méta · **décoratif seulement**              |
| `line` `line-strong`                                               | filets                                                                 |
| `brand`                                                            | le geste orange : point du logo, pastilles, filets 2 px, barres, halos |
| `brand-solid` / `brand-solid-hover` / `brand-on-solid`             | fond de bouton primaire et son texte                                   |
| `brand-text`                                                       | orange pour du **texte** sur fond clair                                |
| `info` `info-text` `info-subtle`                                   | bleu : liens, focus, information                                       |
| `inverse-fg` `inverse-fg-muted` `inverse-brand` `inverse-on-brand` | jeu de couleurs sur fond encre                                         |

**Piège accessibilité :** l'orange de marque `#E9591F` ne donne que 3,5:1 avec du blanc — insuffisant pour un libellé de bouton. Le fond des boutons primaires utilise donc `brand-solid` (`#C9481A`, 4,8:1) et s'**éclaircit** vers `#E9591F` au survol, ce qui reste cohérent avec la DA (la bande CTA encre fait déjà éclaircir l'orange au survol). En dark, `brand-solid` = `#F0824B` avec du texte encre. `faint` (`#8F8F89`) ne doit jamais porter de texte : utiliser `label`.

## Composants

- `components/primitives/` — `Container` (1240 / 760 px, marges 20/32/40), `Section` (`space` sm/md/lg pour le rythme binaire, `tone` page/surface/inverse), `Eyebrow`, `Halo`, `Reveal`.
- `components/layout/` — `SiteHeader`, `MobileMenu` (Dialog de Base UI : focus trap, Échap, verrou de scroll fournis), `SiteFooter`, `NavLink` (lit le pathname pour `aria-current`), `ThemeToggle`, `SkipLink`, `Logo`.
- `components/ui/button.tsx` — `Button` (action, primitive Base UI), `ButtonLink` (navigation, `next/link`), `buttonVariants` pour habiller un `Link` ad hoc. **Échelle de tailles tactile d'abord** : `md` = 44 px et c'est le défaut, `lg` = 48, `xl` = 52, `block` = pleine largeur ; `sm` = 36 px est réservé aux zones denses non tactiles. Variantes : `brand`, `secondary`, `ghost`, `link`, `outline`, `destructive`, plus `inverse` et `inverse-ghost` pour les fonds encre.
- Le focus visible est global (`:focus-visible` dans `globals.css`) : ne jamais ajouter d'anneau propre à un composant, on en cumulerait deux.
- `Reveal` bascule l'attribut `data-reveal` directement sur le nœud DOM, sans état React. Ne pas y remettre de `setState` dans un effet : la règle ESLint `react-hooks/set-state-in-effect` est active et le refuse.

## Transition de page

`PageCurtain` (dans le layout) intercepte les clics sur les liens internes, fait apparaître un voile encre en fondu avec l'illustration Lottie en son centre, navigue écran couvert, puis lève le voile pendant que la page entrante monte se mettre en place.

**Trois pièces, deux propriétés.** Le voile (`opacity`), l'illustration (`opacity`) et `main` (`opacity` + `transform`) : rien d'autre. Tout est composé par le GPU, il n'y a ni mise en page ni peinture pendant l'animation, donc rien qui puisse saccader. Les versions précédentes — voile à crêtes arrondies, puis traits en lentille balayant en diagonale sur six couches de grande taille — sont restées perçues comme sèches malgré un profil d'images propre à la mesure. **Ne pas y revenir sans une raison forte.**

Le détail qui fait l'élégance : la montée de la page (560 ms) dure plus longtemps que le lever du voile (400 ms), si bien qu'elle finit de se poser à découvert. C'est ce décalage qui donne une impression d'arrivée plutôt que d'apparition. `REVEAL_MS` doit donc couvrir la plus longue des deux animations, sinon elle serait retirée en plein vol.

**Seule l'arrivée est animée, pas le départ.** Animer aussi la page sortante obligeait le navigateur à promouvoir `main` — plusieurs milliers de pixels de haut — au moment même du clic : 140 ms de blocage mesurés, précisément là où la réactivité compte le plus. Sur l'arrivée, cette promotion tombe pendant le répit, écran couvert, donc invisible. Et on ne perd presque rien : la page sortante est recouverte aussitôt.

Quatre points la maintiennent propre :

1. **Interception en phase de capture.** `next/link` navigue dans son propre `onClick` et n'abandonne que si l'évènement est déjà préempté ; en phase de bulle, la navigation a déjà eu lieu et le voile ne se déclenche jamais. La propagation n'est pas coupée, pour que les `onClick` portés par les liens continuent de s'exécuter (c'est ainsi que le menu mobile se ferme).
2. **`data-scroll-behavior="smooth"` sur `<html>`.** Sans lui, Next anime le retour en haut de page à chaque navigation, et ce scroll animé entre en concurrence avec le voile. Next l'annonce en clair dans le log de dev.
3. **Un répit avant le lever** (`SETTLE_MS`, 140 ms). Le voile ne doit pas se lever au moment où React commite la page entrante : sa mise en page, sa peinture et son hydratation tomberaient sur les premières images de l'animation. Ce répit se passe écran couvert, donc invisible.
4. **Le contenu entrant n'anime pas par-dessus le voile.** `PageCurtain` pose la phase dans `data-curtain` sur `<html>` — c'est ce qui permet au CSS d'animer `main` sans qu'aucun composant de page ait à le savoir. `Reveal` lit ce drapeau **au moment où il révèle** — pas au montage, sinon les blocs sous la ligne de flottaison perdraient leur apparition au scroll — et pose `data-reveal-now`, qui coupe le fondu. Le geste de page est la transition ; empiler trente fondus de 600 ms par-dessus rend l'arrivée confuse.

Un filet de sécurité rouvre le voile si la navigation n'aboutit pas. Sans JavaScript et sous `prefers-reduced-motion`, les liens naviguent normalement.

Pas de `framer-motion` : tout porte sur `opacity` et `transform`, déjà composés par le GPU. La bibliothèque n'améliorerait pas la fluidité et ajouterait du poids.

### Illustration Lottie

`public/loading-animation-white.json` (7,3 ko, quatre calques vectoriels, 1,9 s par cycle, sans expressions) est jouée par `lottie-web`, centrée dans le voile.

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
- **Un `next start` resté en vie sert un build périmé.** Les chunks répondent alors en 500, l'hydratation échoue, la transition ne tourne pas — et la mesure affiche une fluidité parfaite qui ne mesure rien. Vérifier qu'un chunk référencé par le HTML répond en 200, et surveiller `Network.responseReceived` pour les statuts ≥ 400. Le `data-phase` du DOM est rendu côté serveur : sa présence ne prouve pas que le composant client a pris la main.
- **`element.click()` ne déclenche pas `pointerdown`.** Sans conséquence sur l'implémentation actuelle, mais à savoir si un jour un comportement en dépend : émettre la séquence `pointerdown` → `pointerup` → `click`.

## Vérification visuelle

`pnpm build` ne dit rien de la mise en page. Pour contrôler une section, piloter Chrome en CDP (`--headless=new --remote-debugging-port`), émuler le viewport avec `Emulation.setDeviceMetricsOverride`, `prefers-color-scheme` avec `Emulation.setEmulatedMedia`, scroller en `behavior:"instant"` puis `Page.captureScreenshot`. Le mode `--headless --screenshot` de la CLI donne des captures fausses (blocs `Reveal` figés à l'état masqué, viewport non émulé) : ne pas s'y fier.

Pour traquer un débordement horizontal, mesurer plutôt que regarder : comparer `document.documentElement.scrollWidth` à `clientWidth`, puis lister les éléments non absolus dont le `right` dépasse le viewport. Le ticker de la preuve sociale dépasse volontairement (il est masqué par `overflow-hidden`).

Piège typographique repéré ainsi : les chiffres tabulaires de Schibsted Grotesk élargissent la virgule décimale, ce qui transforme « 99,98 % » en « 99 , 98 % ». `[data-numeric]` est donc réservé aux colonnes de chiffres à aligner, jamais aux valeurs isolées.

## Illustrations Lottie

Deux illustrations, un seul lecteur. `lib/lottie.ts` centralise le chargement : `loadLottie()` mémorise l'import dynamique de `lottie-web/build/player/lottie_light`, `loadLottieData(url)` mémorise le `fetch` du JSON, `whenIdle()` diffère le tout avec repli sur un délai pour Safari, qui n'implémente pas `requestIdleCallback`.

- **La variante `lottie_light` suffit** : aucun de nos fichiers n'utilise d'expressions, et le build complet pèse près de 140 ko de plus.
- **Rien n'est chargé sur le chemin critique**, ni du tout sous `prefers-reduced-motion`. Les deux usages partagent un chunk unique.
- **Amélioration progressive obligatoire** : si le lecteur n'arrive pas, l'interface doit rester fonctionnelle. La transition se joue sans illustration ; le sélecteur de thème garde ses icônes lucide.
- **La taille se porte sur le conteneur, jamais sur le SVG** : `lottie-web` pose `width: 100%` en style inline sur le SVG qu'il crée, une règle CSS visant le SVG serait perdue.

### `public/loading-animation-white.json` — transition de page

7,3 ko, quatre calques, 1,9 s par cycle. Centrée dans le voile, en boucle, jouée à 1,6× pour qu'on en voie environ la moitié. Enfant du voile, donc son opacité se multiplie à la sienne et elle s'efface avec lui sans règle dédiée. Mise en pause au retour au repos.

### `public/theme-toggle.json` — sélecteur de thème

57 ko, 19 calques, 60 i/s, 481 images. Le fichier enchaîne les deux bascules avec de longues tenues entre elles, **sans marqueur** : les repères ont été relevés en rendant la séquence image par image, et sont consignés en constantes dans `theme-toggle.tsx` (`LIGHT_REST` 40, `DARK_REST` 305, `TO_DARK` [40, 120], `TO_LIGHT` [305, 400]). On ne joue que les transitions, à 2,2× — 2 s d'origine par bascule serait bien trop lent pour une commande — et l'on se repose sur l'image de tenue d'où part la transition suivante. Les tenues étant visuellement identiques, le saut de l'une à l'autre ne se voit pas.

Deux pièges rencontrés, à ne pas réintroduire :

- **Suivre `resolvedTheme`, pas le clic.** Le thème change aussi par le raccourci clavier de `ThemeProvider` et par la préférence système ; un interrupteur piloté par le clic se désynchronise.
- **Mémoriser le thème précédent même quand le lecteur n'est pas encore chargé.** Sinon la première bascule est prise pour un premier rendu et saute à l'état final au lieu de s'animer. C'est un bug qui ne se voit qu'en capturant la séquence, jamais en lisant le code.

## Règles non négociables

Issues de la DA et de l'Architecture UX, à vérifier sur chaque écran :

- **Un seul geste orange par écran, un seul halo par écran.**
- Profondeur par les couches (cartes flottantes + ombres), jamais par des filets.
- Pas de photo stock, pas de 3D gadget, pas de dégradé saturé. Illustration = UI produit abstraite en CSS (`components/visuals/`, toujours `aria-hidden`).
- Une idée par section · rythme binaire dense/respirante · arc affirmation → preuve → action · **le CTA n'arrive jamais avant la preuve**.
- Conversion à 3 niveaux : primaire « Parlons de votre projet » (1 par page + nav permanente) · secondaire « Voir nos réalisations » · tertiaire capture douce (fin d'article, footer).
- Aucune impasse : chaque page finit par une action ou un rebond. Le footer est le seul terminus.
- Endossement Hexceos : footer + `/le-groupe` + une ligne sur `/a-propos`. Jamais dans le hero, jamais dans la nav.
- Accessibilité AA : contrastes vérifiés, focus visible bleu 2 px, cibles ≥ 44 px, un seul `h1` par page, `prefers-reduced-motion` neutralise tout mouvement, contenu complet sans JS.
- Motion : expo-out `cubic-bezier(0.16, 1, 0.3, 1)`, 100–360 ms. Entrées fondu + translation. Jamais de rebond ni de parallaxe profonde.

## Responsive

Mobile-first. Conteneurs : `max-w-page` (1240 px) pour les sections, `max-w-reading` (760 px) pour la lecture. Marges latérales 20 / 32 / 40 px. Espacement entre sections 56–64 → 64–80 → 96–130 px. Cibles tactiles ≥ 44 px, ≥ 8 px entre deux actions. `env(safe-area-inset-*)` sur le menu plein écran et le footer.

## Next.js 16 — pièges

- `params` et `searchParams` sont des **Promises**. Utiliser les helpers générés : `export default async function Page(props: PageProps<"/realisations/[slug]">)` puis `await props.params`. Régénérer avec `pnpm exec next typegen` après avoir ajouté une route dynamique.
- Turbopack est le bundler par défaut en dev **et** en build.
- Les docs de la version installée sont dans `node_modules/next/dist/docs/` — les consulter plutôt que la mémoire.
