# Heliara - conventions du projet

Site vitrine + portfolio du studio Heliara.
Next.js 16 App Router · TypeScript · Tailwind CSS v4 · shadcn/ui (style `base-nova`, primitives `@base-ui`).

## Sources de vérité

- `reference/claude-design/*.html` - maquettes « Claude Design » exportées. **Source de vérité pour le design et le contenu uniquement.** Le framework `<x-dc>` n'est jamais repris : tout est réimplémenté en Next/Tailwind idiomatique.
  **Hors du dépôt** (`.gitignore`) : 284 ko de HTML généré, qu'aucun code n'importe et qu'on ne lit qu'au moment de transcrire un écran. Conséquence à connaître : un clone frais ne les a pas, il faut les réexporter depuis Claude Design ou les récupérer auprès de l'auteur. Ce qu'elles ont appris est consigné ici et dans `docs/`, ce fichier restant la référence opposable.
- `Heliara - Direction Artistique v2.dc.html` - la DA à suivre (« Lumière d'écran »).
- `Heliara - Architecture UX.dc.html` - routes, parcours, fiches de pages, principes UX.
- `Heliara - Responsive Guidelines.dc.html` - règles de transformation desktop → tablette → mobile.
- Écart connu : la fiche UX annonce 5 temps de méthode, la maquette Méthode en montre 8. **La maquette gagne** (8 temps sur `/methode`, condensés en 4 sur l'accueil).

## Commandes

```text
pnpm dev        # Turbopack
pnpm lint       # eslint (flat config)
pnpm typecheck  # tsc --noEmit
pnpm build
pnpm format     # prettier --write
pnpm og         # les cartes de partage d'un site en marche, et leur statut

pnpm db:up      # MariaDB + MinIO + création du seau
pnpm db:down    # arrêt, volumes conservés
pnpm db:reset   # détruit les volumes et rejoue db/init - perte de données
pnpm db:shell   # console SQL en db_admin, accepte -e "SELECT ..."
pnpm db:logs
```

Après chaque phase : `pnpm lint && pnpm typecheck && pnpm build`, puis un commit atomique.

Le `.env` local n'est pas versionné. `.env.example` liste toutes les variables
attendues et fait référence : le compléter en même temps qu'on en ajoute une.

## Style de code

Le `.prettierrc` du projet fait loi, y compris quand il contredit une préférence globale :

- pas de point-virgule (`semi: false`)
- **double quotes** (`singleQuote: false`)
- 2 espaces, `printWidth: 80`, `trailingComma: "es5"`
- `prettier-plugin-tailwindcss` trie les classes - ne pas les réordonner à la main

Autres règles :

- Nommage de fichiers en `kebab-case`, composants en `PascalCase`.
- Server Components par défaut. `"use client"` réservé à : menu mobile, sélecteur de thème, filtres de réalisations, formulaire de contact, apparitions au scroll.
- Contenu éditorial : données statiques typées dans `lib/content/*.ts`, jamais en dur dans le JSX.
- **Aucun cadratin ni demi-cadratin, jamais** : ni `—` ni `–`, y compris dans le contenu éditorial, les commentaires de code et les messages de commit. Un tiret simple `-` partout où un séparateur est nécessaire. Les maquettes de référence en sont pleines : les transcrire suppose de les convertir au passage.

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

**Piège accessibilité :** l'orange de marque `#E9591F` ne donne que 3,5:1 avec du blanc - insuffisant pour un libellé de bouton. Le fond des boutons primaires utilise donc `brand-solid` (`#C9481A`, 4,8:1) et s'**éclaircit** vers `#E9591F` au survol, ce qui reste cohérent avec la DA (la bande CTA encre fait déjà éclaircir l'orange au survol). En dark, `brand-solid` = `#F0824B` avec du texte encre. `faint` (`#8F8F89`) ne doit jamais porter de texte : utiliser `label`.

## Composants

- `components/visuals/` - illustrations. `HeroLottie` pour le hero, et des maquettes d'interface en CSS pur ailleurs (`case-sketch`, `case-card-sketch`, `case-hero-sketch`, `expertise-sketch`) : toujours `aria-hidden`, aucun asset à charger.
- `components/primitives/` - `Container` (1240 / 760 px, marges 20/32/40), `Section` (`space` sm/md/lg pour le rythme binaire, `tone` page/surface/inverse), `Eyebrow`, `Halo`, `Reveal`.
- `components/layout/` - `SiteHeader`, `MobileMenu` (Dialog de Base UI : focus trap, Échap, verrou de scroll fournis), `SiteFooter`, `NavLink` (lit le pathname pour `aria-current`), `ThemeToggle`, `SkipLink`, `Logo`.
- `components/ui/button.tsx` - `Button` (action, primitive Base UI), `ButtonLink` (navigation, `next/link`), `buttonVariants` pour habiller un `Link` ad hoc. **Échelle de tailles tactile d'abord** : `md` = 44 px et c'est le défaut, `lg` = 48, `xl` = 52, `block` = pleine largeur ; `sm` = 36 px est réservé aux zones denses non tactiles. Variantes : `brand`, `secondary`, `ghost`, `link`, `outline`, `destructive`, plus `inverse` et `inverse-ghost` pour les fonds encre.
- Le focus visible est global (`:focus-visible` dans `globals.css`) : ne jamais ajouter d'anneau propre à un composant, on en cumulerait deux.
- `Reveal` bascule l'attribut `data-reveal` directement sur le nœud DOM, sans état React. Ne pas y remettre de `setState` dans un effet : la règle ESLint `react-hooks/set-state-in-effect` est active et le refuse.

## La page 404

Elle n'existait pas : un lien mort affichait l'écran par défaut de Next, noir sur blanc,
sans en-tête ni pied de page et **sans un seul lien pour revenir** - une impasse à
l'endroit où le visiteur arrive par accident.

**Deux points d'entrée, une seule vue.** `NotFoundView` porte l'écran ;
`app/not-found.tsx` et `app/(site)/not-found.tsx` le rendent. Un visiteur ne doit pas voir
deux écrans différents selon la façon dont il s'est perdu.

| Fichier                     | Attrape                                              | Chrome                      |
| --------------------------- | ---------------------------------------------------- | --------------------------- |
| `app/not-found.tsx`         | les URL qui ne correspondent à **aucune** route      | le pose lui-même            |
| `app/(site)/not-found.tsx`  | les `notFound()` d'une page du site : slug inconnu   | hérité du layout du groupe  |

**Deux pièges, tous deux mesurés dans le DOM, aucun visible à la lecture du code :**

- **Une `not-found.tsx` posée seulement dans le groupe `(site)` ne sert à rien.** Elle
  n'était utilisée pour aucun des deux chemins, et Next continuait de rendre son écran par
  défaut. Seule la racine de `app/` attrape une URL non résolue - la documentation de la
  version installée le dit en une phrase, à la fin.
- **Le fichier racine seul double le chrome** sur un slug inconnu. L'URL correspond alors à
  une route existante, donc le layout du groupe s'applique **et** la 404 racine pose le
  sien : deux en-têtes, deux pieds de page, deux `<main>`. D'où la 404 de segment, qui ne
  rend que la vue.

**`SiteChrome` a été extrait du layout du groupe pour cela.** La 404 racine vit hors du
groupe - contrainte de Next, pas un choix - et sans cette extraction, la 404 la plus
fréquente serait un écran sans chemin de retour.

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

## Vérification visuelle

`pnpm build` ne dit rien de la mise en page. Pour contrôler une section, piloter Chrome en CDP (`--headless=new --remote-debugging-port`), émuler le viewport avec `Emulation.setDeviceMetricsOverride`, `prefers-color-scheme` avec `Emulation.setEmulatedMedia`, scroller en `behavior:"instant"` puis `Page.captureScreenshot`. Le mode `--headless --screenshot` de la CLI donne des captures fausses (blocs `Reveal` figés à l'état masqué, viewport non émulé) : ne pas s'y fier.

Pour traquer un débordement horizontal, mesurer plutôt que regarder : comparer `document.documentElement.scrollWidth` à `clientWidth`, puis lister les éléments non absolus dont le `right` dépasse le viewport. Le bandeau de logos clients de l'accueil dépasse volontairement (il est masqué par `overflow-hidden`).

Piège typographique repéré ainsi : les chiffres tabulaires de Schibsted Grotesk élargissent la virgule décimale, ce qui transforme « 99,98 % » en « 99 , 98 % ». `[data-numeric]` est donc réservé aux colonnes de chiffres à aligner, jamais aux valeurs isolées.

## Le bandeau de logos clients

**Le traitement des logos n'est pas symétrique entre les thèmes**, et ce n'est pas un
oubli : les deux fonds ne posent pas le même problème.

- **En clair, désaturés à 70 % d'opacité**, couleur au survol. Huit logos à pleine couleur
  sur le plateau clair - un violet, un bleu, un rose, un turquoise, un vert acide - font de
  la bande la zone la plus criarde de la page et volent le seul geste orange de l'écran,
  qui est le point du titre du hero juste au-dessus.
- **En sombre, tels quels.** Les mêmes couleurs y ressortent sans crier, et le gris y
  ferait des taches ternes.

Deux traitements ont été essayés et abandonnés, mesurés à l'écran : `brightness-0 invert`
en sombre écrasait les formes internes des logos qui en dépendent et transformait un fond
opaque en carré gris uni ; et un plateau clair maintenu en thème sombre garantissait la
lisibilité des huit fichiers au prix d'une bande blanche dans une page encre.

**Une marque monochrome fournit ses deux variantes**, déclarées en `{ light, dark }` sur
`Client.logo`. Ne pas fabriquer la seconde en inversant la première : `invert` produit une
couleur que la marque n'a pas. Les deux images sont rendues et le CSS en masque une, comme
pour les portraits d'équipe - le thème est une classe sur `<html>`, donc échanger la source
demanderait du JavaScript.

**`shape` suit le fichier, pas la marque.** Hexceos est passé de `square` à `wide` en
changeant de fichier : le PNG était un carré de 96 px, le SVG fait 774 x 242.

**Vérifier le mot-symbole en grand avant d'intégrer un logo.** Une première version des SVG
d'Hexceos écrivait « Hexeceos », avec un « e » de trop. Le texte étant vectorisé, la faute
est invisible à la lecture du source et illisible à 28 px dans la bande : elle ne se voit
qu'en affichant le fichier à une centaine de pixels de haut.

**`shape` décide de la hauteur, pas une valeur unique.** Un logotype à 28 px de haut
couvre 140 px de large ; un carré n'en couvre que 28, soit quatre fois moins de surface
pour la même consigne. Les carrés reçoivent donc plus de hauteur.

**Ce qu'un fichier doit être** pour entrer dans la bande : fond transparent - la bande
pose les logos sur une surface, un fichier opaque y dessine un rectangle - au moins 80 px
de haut, et sans marge interne excessive. Un logo entouré de 30 % de vide paraît deux fois
plus petit que ses voisins quelle que soit sa classe de forme.

**Les clients d'une marque sœur n'y ont pas leur place.** L'AFORP, le Cnam ou Ingetis sont
des références de LessonSharing : les afficher sous « Ils nous font confiance » cumulerait
une affirmation fausse et un usage de marque sans autorisation. Hexceos et LessonSharing
elles-mêmes y figurent, parce que leurs sites sont des projets Heliara - la nuance tient à
ce qu'on a fait pour elles, pas à l'appartenance au même groupe.

## Routes

Cinq entrées de nav (`Expertises`, `Réalisations`, `Méthode`, `À propos`, `Ressources`) plus le CTA permanent vers `/contact`. `/le-groupe`, `/mentions-legales` et `/confidentialite` ne vivent que dans le pied de page.

Carrières a été retiré du périmètre : la fiche existe dans l'Architecture UX et une maquette a été exportée, mais la page n'est pas construite. Rien n'y renvoie.

`app/sitemap.ts` déclare les pages publiques et les trois collections dynamiques. Les pages légales en sont absentes : elles portent `robots: { index: false }`, il serait contradictoire de les déclarer. `app/robots.ts` pointe vers le plan du site.

Après avoir ajouté une route dynamique, régénérer les types : `pnpm exec next typegen`. Sans quoi `PageProps<"/ma/[route]">` échoue au typecheck.

## Référencement, et référencement génératif

Trois couches, dans l'ordre où elles comptent.

**`lib/seo.ts` - `pageMetadata()`.** Titre, description, canonique, OpenGraph et carte
Twitter en un appel. **Toute page publique doit passer par lui**, y compris les routes
dynamiques : les deux qui composaient leurs métadonnées à la main - la page d'article et
la page d'expertise - y perdaient toutes les deux leur **URL canonique**, ce qui ne se
voit ni au build ni à l'écran. `absoluteTitle` existe pour l'accueil, dont le titre porte
déjà le nom du studio et qui sortirait « Heliara - … - Heliara » avec le gabarit du
layout.

**`lib/schema.ts` - les données structurées.** Un graphe par page, aux `@id` stables, avec
`organizationNode` et `websiteNode` posés une fois dans le layout du groupe `(site)`. La
couverture : `Article` sur un article, `Article` sur une réalisation, `Service` plus
`FAQPage` sur une expertise, `CollectionPage` sur les trois listings, et un
`BreadcrumbList` partout où un fil est affiché.

Deux règles qui ne se négocient pas :

- **Le balisage reprend mot pour mot ce que la page montre.** Un fil balisé plus profond
  que celui qu'on affiche, ou une FAQ balisée absente de l'écran, est un écart
  signalable - d'où le `faqNode` conditionné à `service.faq.length > 0`.
- **`FAQPage` est conservé bien que Google en ait retiré le résultat enrichi en 2023.**
  La raison qui reste : des paires question-réponse explicites sont ce qu'un moteur
  génératif reprend le plus volontiers, n'ayant rien à reformuler.

**Le titre et la description d'un listing sont hissés en constante `page`**, lue par
`pageMetadata` **et** par `collectionPageNode`. Les écrire deux fois garantirait qu'ils
divergent, et un balisage qui contredit la page est un écart, pas un détail.

### Les cartes de partage

`lib/og.tsx` génère la carte, et chaque segment a son `opengraph-image.tsx`.

**Un fichier par segment, et ce n'est pas de la redondance : la convention n'est pas
héritée.** Mesuré - une carte unique dans `app/` ne couvrait rien du tout, et déplacée
dans `app/(site)/` elle ne couvrait que l'accueil. Toutes les autres pages sortaient sans
vignette. Chaque page porte donc la sienne, ce qui lui vaut au passage son propre titre.

**La hiérarchie des images, et elle fonctionne dans cet ordre** : une réalisation ou un
article qui porte une image de tête la donne en carte de partage, écrite explicitement par
`pageMetadata`, ce qui **prend le pas** sur la convention de fichier. La carte générée
n'est donc que le défaut. Une capture de l'interface livrée vaut mieux qu'un titre sur
fond encre.

**Comment les regarder** - `pnpm og`, parce qu'une URL d'image n'est pas devinable :
Next suffixe la route d'une empreinte (`/methode/opengraph-image-oupj1r?f76b0f56`) et ne
sert **que** cette adresse, `/methode/opengraph-image` répondant 404. L'empreinte change à
chaque modification du fichier. La seule source fiable est la balise `og:image` de la page,
et c'est ce que le script va lire.

```text
pnpm og                              # les pages représentatives
pnpm og --open                       # et les ouvre
pnpm og /methode /contact            # des chemins précis
pnpm og --base=https://heliara.fr /  # une autre origine, une fois déployé
```

**Il demande l'image séparément et rapporte son statut**, ce qui est le plus utile des
deux : une balise juste qui pointe vers une adresse injoignable donne une page parfaite et
aucun aperçu. Un `200` est la vérification qui compte. Le rendu tel qu'un réseau le
compose se voit ensuite dans le *post inspector* de LinkedIn ou le *sharing debugger* de
Facebook - dont WhatsApp reprend la carte, en la mettant en cache par URL : pour retester
un lien déjà partagé, il faut lui ajouter un paramètre.

**Les polices sont des TTF versionnés dans `assets/fonts/`**, pas `next/font/google`.
Satori - le moteur derrière `next/og` - n'accepte ni WOFF2 ni police variable, or c'est
exactement ce que `next/font` émet. Schibsted Grotesk est sous OFL-1.1, dont le texte est
joint : redistribuable à condition de garder la licence. Un fichier du dépôt ne dépend
d'aucun accès réseau au rendu.

**Deux pièges de satori, tous deux invisibles dans le JSX** - il faut regarder l'image :

- **Il aplatit les `span` imbriqués en éléments de flex.** Le point orange écrit à la
  suite du titre se posait au bout de la **première** ligne, contre le bord droit de la
  carte. Le titre est donc décomposé en un mot par élément avec `flexWrap`, l'espace porté
  par une marge : le point redevient un élément de plus, collé au dernier mot.
- **`display: block` fait échouer le rendu.** La route répond alors une réponse vide, pas
  une erreur. C'était la correction évidente au défaut précédent ; elle ne marche pas.

### `robots.txt`, et ce qu'il ne dit pas

**`/admin` n'y est pas interdit, volontairement.** `robots.txt` est public : y nommer
l'administration en annoncerait l'existence, ce qui défait le choix de répondre 404 plutôt
que 403. Il n'y a rien à interdire, tout `/admin` répondant 404 sur le déploiement public.

**Les explorateurs des moteurs génératifs ne sont pas bloqués, et ne sont pas nommés.**
`User-agent: *` avec `Allow: /` les couvre tous ; une douzaine de règles `Allow`
nominatives n'aurait **aucun effet** et donnerait l'illusion d'un réglage à tenir à jour.
`Google-Extended` et `Applebot-Extended` ne servent qu'à refuser : leur absence est
l'autorisation. Si l'entraînement devait être refusé - décision commerciale - c'est là que
les `Disallow` viendraient.

### `/llms.txt`

Généré par `app/llms.txt/route.ts`, lu en base avec le même repli que le reste. Un fichier
figé annoncerait des services supprimés et tairait les nouveaux, sans que personne le voie
puisque aucun visiteur ne le lit.

**Ce qu'il porte et qui ne se lit nulle part ailleurs aussi nettement, c'est ce que le
studio ne fait pas** : la pile par défaut n'est pas une obligation, l'e-commerce passe par
Shopify plutôt que par un moteur de paiement maison, et **aucun résultat chiffré n'est
publié**. Ce sont exactement les trois points sur lesquels un modèle inventerait. Un
fichier destiné à être repris textuellement est le dernier endroit où mettre une
affirmation qu'on ne peut pas justifier.

`## Optional` reste en anglais : c'est un nom de section que la spécification
(llmstxt.org) réserve pour marquer le contenu secondaire, le traduire le rendrait muet.

### `SITE_ORIGIN` : l'origine des URL absolues

**Un défaut trouvé en production, et le plus silencieux de tous.** Les métadonnées étaient
bâties sur `site.url`, `https://heliara.fr` en dur. Sur un déploiement d'essai la page se
servait très bien, mais annonçait ses URL absolues vers un domaine qui ne répondait pas
encore : **aucun aperçu de lien ne s'affichait**. WhatsApp allait chercher
`https://heliara.fr/opengraph-image-…` et ne trouvait rien, alors que la même image
répondait 200 sur l'hôte réel. Les balises étaient présentes, complètes et bien formées -
elles pointaient ailleurs. Rien dans le build, le typecheck ou les journaux ne pouvait le
voir.

Le même défaut rendait faux, sur un tel hôte : le `canonical`, `og:url`, le plan du site,
l'adresse du sitemap dans `robots.txt`, les liens de `llms.txt` et les `@id` du graphe
schema.org.

`lib/origin.ts` est désormais la source unique, et **tout** passe par elle.

- **`SITE_ORIGIN` sans préfixe `NEXT_PUBLIC_`, donc lue à l'exécution.** Une même image
  applicative sert plusieurs origines sans reconstruction.
- **`NEXT_PUBLIC_SITE_ORIGIN` n'est délibérément pas lue**, alors qu'elle désigne à peu
  près la même chose. Elle sert les liens de l'administration vers le site public et vaut
  `http://localhost:3000` en développement : la lire ferait qu'un build de production
  lancé sur une machine de développement - donc avec un `.env` local présent - produise
  des canoniques vers `localhost`. Vérifié, c'est bien ce qui arrivait. Deux variables qui
  se ressemblent ne sont pas une raison de les confondre.
- **Réserve** : les pages étant prérendues, le HTML des premières requêtes porte la valeur
  du build, reprise au premier `revalidate` - une minute. Régler la variable au build aussi
  pour que ce soit juste dès la première requête.
- **Le repli est le domaine de production, jamais l'en-tête `Host`.** Une origine devinée
  depuis la requête se laisserait dicter par l'appelant, et un `canonical` choisi par
  l'appelant ouvre la porte à l'empoisonnement d'index.
- `ORGANIZATION_ID` et `WEBSITE_ID` sont devenus `organizationId()` et `websiteId()` :
  une constante de module figerait la valeur au premier import.

Sur une préproduction, penser aussi à `noIndex` ou à un `robots.txt` restrictif au niveau
de l'hôte : un canonical juste ne suffit pas à éviter qu'elle soit indexée.

**`S3_PUBLIC_URL` porte la seconde moitié du problème, et le symptôme est identique.** Une
réalisation ou un article qui a une image de tête donne **cette URL** comme carte de
partage. Un stockage objet joignable seulement depuis le serveur donne donc des pages qui
s'affichent parfaitement et ne produisent aucun aperçu de lien - la cause est ailleurs que
dans `SITE_ORIGIN`, et se cherche en récupérant l'`og:image` de la page puis en tentant de
la charger de l'extérieur. En HTTP sur un site HTTPS, c'est du contenu mixte, que plusieurs
explorateurs refusent sans le dire.

### `sitemap.ts`

**`lastModified` est omis plutôt qu'inventé.** Les entrées venues du contenu statique et
les pages fixes n'ont pas de date honnête : leur donner celle du jour annoncerait une
modification qui n'a pas eu lieu, et un moteur qui recrawle pour rien apprend à ne plus y
croire. 24 des 32 URL en portent une, les 8 pages fixes non.

**Un objet interpolé dans un gabarit ne lève jamais au typecheck.** `listPublicCaseSlugs`
et `listPublicServiceSlugs` sont passés de `string[]` à `{ slug, updatedAt }[]` - les
procédures rendaient `updated_at` depuis toujours, seule la couche d'accès le jetait. Les
trois appelants ont alors produit `/realisations/[object Object]` : aucune erreur de
compilation, aucun avertissement. `tests/unit/navigation.test.ts` porte désormais une
assertion explicite là-dessus.

## Icônes et manifeste

Conventions de fichier de l'App Router : `app/favicon.ico`, `app/icon0.svg`,
`app/icon1.png`, `app/apple-icon.png`, `app/manifest.json`, plus les deux PNG du
manifeste dans `public/`. Next pose les `<link>` correspondants tout seul, dans l'ordre
des suffixes - **ne rien redéclarer dans `metadata.icons`**, on obtiendrait des liens en
double. Seuls `appleWebApp.title` et l'export `viewport` sont écrits à la main.

**Deux jeux d'icônes, et c'est le point à ne pas défaire.** Le logo Heliara est un
pictogramme surmontant le mot « heliara ». En dessous de 48 px - c'est-à-dire dans
l'onglet du navigateur, l'endroit où l'icône est le plus vue - le mot devient une
bavure grise et le pictogramme se retrouve écrasé dans la moitié haute du carré.
Mesuré en rendant les deux versions à 16, 20, 32 et 64 px.

| Fichier                                         | Contenu                          |
| ----------------------------------------------- | -------------------------------- |
| `favicon.ico` (16/32/48), `icon0.svg`, `icon1.png` | **pictogramme seul, recentré**   |
| `apple-icon.png` (180), les deux PNG du manifeste | logo complet, mot-symbole compris |

Le pictogramme seul est dérivé du logo : le mot-symbole est un unique chemin du SVG
(`M73.9 248.8…`, y 219 → 271), le reste du dessin occupe y 34 → 223. Le retirer puis
translater le groupe de 40,85 px vers le bas recentre la marque dans son carré. Les
PNG et l'ICO sont rendus depuis ce SVG, fond transparent - sans quoi les coins arrondis
seraient blancs, ce qui se verrait sur un onglet sombre.

**Repasser par RealFaviconGenerator régénère les cinq fichiers depuis le logo complet
et défait ce partage.** Après un tel passage, refaire la dérivation sur les trois
fichiers de la première ligne.

`theme_color` du manifeste ne peut porter qu'une valeur ; l'export `viewport` en
déclare deux, une par thème, reprises de `--hel-page`. Sans cela, en thème sombre sur
Android, la barre du navigateur resterait claire au-dessus d'une page encre.

Les icônes du manifeste sont déclarées `purpose: "maskable"` seulement. Vérifié en
simulant le rognage d'Android : le mot-symbole survit à la découpe en cercle comme en
squircle, la zone sûre est respectée.

Les icônes échappent au proxy - son `matcher` exclut `favicon.ico` et toute URL en
`.svg`, `.png`, `.ico`, `.json` - donc elles sont servies par les **deux**
déploiements, y compris celui de l'administration où tout le reste répond 404.

## Formulaires

`zod` + `react-hook-form`. Le schéma vit dans `lib/schemas/`, **partagé par le client et l'action serveur** : un seul schéma, donc aucun risque de voir les deux validations divergentes. Les messages y sont rédigés pour être affichés tels quels, en français, sans jargon de validation.

- **Le serveur rejoue toujours le schéma.** Une action serveur est une route publique : elle ne peut pas faire confiance à son appelant. La validation du navigateur n'est qu'un confort.
- **Résolveur `standardSchemaResolver`**, pas `zodResolver` : zod 4 implémente Standard Schema, et c'est la voie recommandée depuis `@hookform/resolvers` v5.
- **Les erreurs que seul le serveur connaît sont réinjectées** par `form.setError`, pour qu'elles s'affichent au même endroit que les autres.
- **On ne vide jamais un formulaire qu'on refuse** : `react-hook-form` conserve les valeurs saisies.
- **Ne jamais prétendre avoir envoyé.** En l'absence de configuration d'envoi, l'action renvoie une erreur explicite qui redirige vers l'adresse e-mail publique.
- Champ leurre anti-robot en `sr-only`, accepté par le schéma mais traité par l'action : rempli, elle renvoie un succès et n'envoie rien - un robot ne doit pas apprendre qu'il a été détecté.
- Labels visibles au-dessus des champs, messages d'erreur en clair en dessous, `aria-invalid` et `aria-describedby` sur le champ concerné, cibles à 44 px.
- **Limite assumée** : un formulaire sous `react-hook-form` exige JavaScript. La page de contact affiche l'e-mail et le téléphone en alternative, et le reste du site fonctionne sans.

### Envoi des e-mails

`resend`, configuré par variables d'environnement (voir `.env.example`) : `RESEND_API_KEY`, `CONTACT_FROM` - qui doit appartenir à un domaine vérifié chez Resend, sinon l'API refuse l'envoi - et `CONTACT_TO`, facultatif. `replyTo` porte l'adresse du prospect : répondre au message suffit.

## Illustrations vectorielles

`public/illustrations/` accueille les illustrations SVG statiques, servies par `next/image` en `unoptimized` : l'optimiseur n'apporte rien sur un SVG. Elles sont décoratives, donc `alt=""` et hors arbre d'accessibilité.

Trois illustrations portent les cartes de familles d'expertise de l'accueil :
`sass-illustration.svg`, `website-illustration.svg`, `ia-illustration.svg`. Elles ont
remplacé un croquis de barres grises qui se lisait comme un wireframe - trois filets et
une étiquette monospace suggéraient une interface sans en montrer aucune, ce qui donnait
à la section l'air d'une maquette inachevée.

**Le croquis reste, en repli.** `familyIllustrations` associe un fichier à un slug de
famille ; une famille absente de la table retombe sur `ExpertiseSketch`. C'est ce qui
permet de créer une famille depuis l'administration sans écran de dépôt de fichier, et
ce qui garde un effet aux trois barres réglables de l'administration - sans ce repli,
elles seraient devenues des réglages sans conséquence.

**Elles fonctionnent sur les deux thèmes sans recoloration**, pour la même raison que
`hero-product.json` : leurs panneaux clairs se lisent comme des écrans allumés sur
l'encre. Leurs traits en `#090814` s'y fondent, mais la composition tient parce que ce
sont les surfaces claires qui portent les formes. Vérifié à l'écran, pas supposé.

`three-process.svg` (hero de `/le-groupe`) vient d'undraw, signée Katerina Limpitsouni - conserver l'attribution portée par le fichier. Son unique couleur hors palette, un carré rose, a été passée au bleu LessonSharing pour que les trois teintes de la page se retrouvent dans le visuel. **Toujours vérifier les couleurs d'une illustration importée avant de l'intégrer**, et la recolorer plutôt que d'accepter une teinte étrangère à la DA.

Limite connue et acceptée : les flèches de ce fichier sont en `#090814` et perdent leur contraste sur fond encre. La composition reste lisible ; recolorer ces neuf occurrences délaverait aussi les cheveux et les chaussures du personnage en thème clair.

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

## Architecture du dépôt

```text
app/                      routes App Router. Un dossier par route, `page.tsx` en
                          Server Component, `actions.ts` pour les actions serveur.
  page.tsx                accueil
  realisations/           liste + [slug]
  expertises/             liste + [slug]
  ressources/             liste + [slug] + actions.ts (capture newsletter)
  methode/ a-propos/ contact/ le-groupe/
  mentions-legales/ confidentialite/
  layout.tsx              polices, ThemeProvider, PageCurtain, header, main, footer
  globals.css             la totalité des tokens et des keyframes
  sitemap.ts robots.ts
  favicon.ico icon0.svg icon1.png apple-icon.png manifest.json

components/
  layout/                 chrome du site : header, footer, nav, menu mobile,
                          sélecteur de thème, voile de transition, logo, skip link
  primitives/             Container, Section, Eyebrow, Halo, Reveal
  sections/               blocs réutilisés entre pages : PageHero, CtaBand,
                          FinalCta, Faq, Breadcrumb, LegalArticle
  home/ realisations/ ressources/ contact/   blocs propres à une page
  visuals/                illustrations : LottieScene (le seul lecteur Lottie),
                          HeroLottie, et les maquettes d'UI en CSS pur
  ui/                     shadcn : Button, ButtonLink, buttonVariants
  theme-provider.tsx

lib/
  content/                contenu éditorial, données statiques typées. Une source
                          par domaine : cases, expertises, articles, group, team,
                          method, testimonials, clients, guarantees,
                          kpis, legal
  schemas/                schémas zod partagés client / serveur
  site.ts                 nav, CTA, coordonnées, endossement de groupe
  lottie.ts utils.ts

db/init/                  monté dans /docker-entrypoint-initdb.d, exécuté une
                          seule fois sur volume vierge
docs/plan-admin.md        plan de l'administration des contenus, avancement inclus
reference/claude-design/  maquettes exportées. Hors du dépôt, lecture seule,
                          jamais de code repris
public/                   logos, illustrations SVG, fichiers Lottie
```

## Administration des contenus

Objectif : rendre modifiable depuis un back-office l'intégralité des contenus
aujourd'hui figés dans `lib/content/*.ts` - textes, projets et leurs images,
articles. Le plan détaillé, son avancement et les décisions actées vivent dans
**`docs/plan-admin.md`** : le consulter avant de reprendre le chantier.

### Infrastructure locale

```text
pnpm db:up        # MariaDB + MinIO + création du seau
pnpm db:down      # arrêt, volumes conservés
pnpm db:reset     # détruit les volumes et rejoue db/init - perte de données
pnpm db:shell     # console SQL en db_admin
pnpm db:logs
```

- MariaDB est publiée sur **3307**, pas 3306 : le port par défaut est souvent
  pris par une base locale. MinIO expose l'API sur 9000 et sa console sur 9001.
- `db/init/` **n'est exécuté qu'une fois, sur volume vierge.** Modifier un
  fichier déjà joué n'a aucun effet sur une base existante : soit on rejoue le
  fichier à la main en `db_migrate` (ce que fait un déploiement), soit on passe
  par `pnpm db:reset`.
- `01-users.sh` est un script et non un `.sql` parce que l'entrypoint MariaDB ne
  substitue pas les variables d'environnement dans les fichiers SQL : c'est ce
  qui permet de garder les mots de passe hors du dépôt.
- Seau MinIO `heliara`. Seul le préfixe `public/` est ouvert en lecture anonyme,
  le reste demeure privé. Conséquence assumée : les images d'un brouillon sont
  accessibles à qui connaît leur URL, qui n'est ni listée ni devinable.

### Trois comptes base, un seul pour l'application

| Compte       | Privilèges                            | Usage                             |
| ------------ | ------------------------------------- | --------------------------------- |
| `db_admin`   | `ALL`                                 | maintenance. Jamais l'application |
| `db_migrate` | DDL, routines, DML                    | migrations et seed, déploiement   |
| `app_exec`   | **`EXECUTE` seul**, aucun accès table | l'application, et rien d'autre    |

Vérifié sur la base en marche : `app_exec` se voit refuser `SELECT` comme
`CREATE` sur toute table. Une injection SQL réussie chez lui ne donne accès qu'à
la surface des procédures existantes.

### Conventions SQL non négociables

- **Procédures stockées uniquement.** Aucune requête écrite côté application, ni
  en lecture ni en écriture. Une nouvelle donnée à lire suppose une nouvelle
  procédure : c'est le coût assumé du modèle, et ce qui rend `EXECUTE` seul
  possible.
- **Identifiants en `BINARY(16)`**, en entrée comme en sortie. L'API SQL reste
  agnostique du langage appelant, chaque client convertit de son côté
  (`lib/db/id.ts`). `GenerateKey()` pour les identifiants créés par la base.
- **Dates en `BIGINT`**, toujours des `UNIX_TIMESTAMP()`. Jamais de `DATETIME` :
  pas de fuseau à trancher, comparaison directe en JavaScript.
- **Nommage** : `p_` pour les paramètres, `v_` pour les variables locales,
  colonnes et procédures en `snake_case`, fonctions utilitaires en `PascalCase`.
- **Transactions et erreurs** : `DECLARE EXIT HANDLER FOR SQLEXCEPTION` avec
  `ROLLBACK` puis `RESIGNAL`, et `SIGNAL SQLSTATE '45000'` pour les erreurs
  métier - que la couche d'accès traduit en erreur typée.
- **Journal d'audit sur toute écriture** : acteur, action, ressource, ancienne et
  nouvelle valeur, adresse.

### `GenerateKey()`, et pourquoi pas `UUID_v7()`

UUID version 7 : horodatage en tête, donc identifiants triés dans l'ordre de
création et insertions groupées en fin d'index InnoDB, là où `UUID()` (version 1)
éparpille les pages.

Le v7 est **assemblé à la main** en SQL et non délégué à `UUID_v7()`, qui
n'existe qu'à partir de MariaDB 11.7 alors que l'image est en 11.4 LTS. L'API
reste ainsi portable sur n'importe quel hôte 11.x ; seul prérequis,
`RANDOM_BYTES()`, présent depuis 11.3. Vérifié : 16 octets, chiffre de version à
7, marqueur de variante conforme, ordre temporel respecté.

`Uuid2Bin()` **renvoie `NULL` sur une entrée invalide** plutôt que des octets
tronqués : l'erreur remonte au lieu de corrompre silencieusement une clé
étrangère.

## Règles non négociables

Issues de la DA et de l'Architecture UX, à vérifier sur chaque écran :

- **Un seul geste orange par écran, un seul halo par écran.**
- Profondeur par les couches (cartes flottantes + ombres), jamais par des filets.
- Pas de photo stock, pas de 3D gadget, pas de dégradé saturé. Illustration = UI produit abstraite en CSS (`components/visuals/`, toujours `aria-hidden`).
- Une idée par section · rythme binaire dense/respirante · arc affirmation → preuve → action · **le CTA n'arrive jamais avant la preuve**.
- Conversion à 3 niveaux : primaire « Parlons de votre projet » (1 par page + nav permanente) · secondaire « Découvrir nos réalisations » · tertiaire capture douce (fin d'article, footer).
- Aucune impasse : chaque page finit par une action ou un rebond. Le footer est le seul terminus.
- Endossement de groupe : footer + `/le-groupe` + une ligne sur `/a-propos`. Jamais dans le hero, jamais dans la nav.
- **Le nom du holding n'apparaît nulle part sur le site public.** Il ne vit que dans les mentions légales. Hexceos et LessonSharing sont des **marques sœurs**, pas une maison mère : `/le-groupe` met en avant les trois marques et leur complémentarité, jamais le holding. Le footer dit « Heliara, une marque du groupe », sans le nommer.
- Accessibilité AA : contrastes vérifiés, focus visible bleu 2 px, cibles ≥ 44 px, un seul `h1` par page, `prefers-reduced-motion` neutralise tout mouvement, contenu complet sans JS.
  **Une limite connue et acceptée** : le bandeau de logos clients de l'accueil défile en boucle et ne se met en pause qu'au survol. WCAG 2.2.2 (« Pause, Stop, Hide », niveau A) demande un moyen d'arrêter tout mouvement automatique de plus de cinq secondes, et le survol n'en est pas un au toucher ni au clavier. Une commande de pause a été construite puis retirée, le mouvement étant jugé assez discret pour ne pas gêner la lecture du reste de la page. À rouvrir si le bandeau s'étoffe ou si un audit externe le relève. Les engagements, eux, ne défilent plus : ils sont une section pleine en bas de page, ce qui a retiré le second défilement infini de l'accueil. `prefers-reduced-motion` coupe l'animation, ce qui couvre les personnes qui ont exprimé la préférence au niveau du système.
- Motion : expo-out `cubic-bezier(0.16, 1, 0.3, 1)`, 100-360 ms. Entrées fondu + translation. Jamais de rebond ni de parallaxe profonde.

## Responsive

Mobile-first. Conteneurs : `max-w-page` (1240 px) pour les sections, `max-w-reading` (760 px) pour la lecture. Marges latérales 20 / 32 / 40 px. Espacement entre sections 56-64 → 64-80 → 96-130 px. Cibles tactiles ≥ 44 px, ≥ 8 px entre deux actions. `env(safe-area-inset-*)` sur le menu plein écran et le footer.

## Next.js 16 - pièges

- `params` et `searchParams` sont des **Promises**. Utiliser les helpers générés : `export default async function Page(props: PageProps<"/realisations/[slug]">)` puis `await props.params`. Régénérer avec `pnpm exec next typegen` après avoir ajouté une route dynamique.
- Turbopack est le bundler par défaut en dev **et** en build.
- Les docs de la version installée sont dans `node_modules/next/dist/docs/` - les consulter plutôt que la mémoire.

## Tests

`vitest`, deux projets dans `vitest.config.ts` :

- **`unit`** (Node, `tests/unit/`) - schémas zod, contenu éditorial, navigation,
  actions serveur, plan du site, règle typographique. Rapide, aucun DOM.
- **`dom`** (jsdom + plugin React, `tests/dom/`) - composants, et les deux
  fonctions de `lib/lottie` qui touchent à `window`.

```text
pnpm test           # tout
pnpm test:watch
pnpm test:coverage
npx vitest run --project unit
```

`tests/setup-dom.tsx` fournit le socle des tests de composants : `next/link`
remplacé par une ancre (le vrai composant réclame le contexte du routeur, et une
ancre est exactement ce que `PageCurtain` intercepte en production),
`next/navigation` simulé et pilotable, plus des doubles de `IntersectionObserver`
et `matchMedia` que jsdom n'implémente pas. `intersect()` déclenche l'entrée dans
le champ, `media.reducedMotion` bascule la préférence de mouvement.

Ce que ces tests ont appris, à ne pas redécouvrir :

- **Le vrai `lottie-web` ne peut pas s'initialiser dans jsdom** : il réclame un
  contexte de canevas dès son évaluation. Les tests simulent `lib/lottie`, qui est
  de toute façon le contrat que les composants consomment.
- **Le lever du voile passe par un `requestAnimationFrame`** : sous minuteries
  simulées, avancer de `COVERED_MS` seul ne suffit pas, il faut une image de plus.
- **`tailwind-merge` ne connaît pas nos échelles maison** (`max-w-page`) et ne les
  dédoublonne donc pas : régler une largeur par la prop `width` de `Container`, pas
  par une classe.
- **Un clic déjà préempté** se simule en appelant `preventDefault()` sur
  l'évènement avant de le distribuer : `PageCurtain` écoute sur `document` en
  capture, donc aucun gestionnaire de l'arbre ne peut le précéder.
- **`AGENTS.md` est exclu du contrôle typographique** : son bloc est posé et
  régénéré par l'outillage Next, le corriger serait défait au prochain passage.
- **Un test d'ordre sur `GenerateKey()` ne doit porter que sur l'horodatage.** Un UUID
  v7 n'est totalement ordonné dans une même milliseconde que s'il embarque un compteur ;
  le nôtre remplit sa queue avec `RANDOM_BYTES()`. Comparer deux identifiants complets
  échouait au hasard environ un lancement sur sept, et l'horodatage de tête suffit à la
  propriété visée - la localité d'insertion InnoDB.

Un défaut trouvé par ces tests, pour mémoire : le schéma de contact **refusait**
un champ leurre rempli, alors que la conception veut qu'il l'accepte et laisse
l'action serveur répondre « envoyé » sans rien envoyer. La validation échouait
donc, le robot recevait une erreur sur ce champ - il apprenait qu'il était
détecté - et la branche prévue dans l'action était inatteignable.

## Les deux déploiements

Un seul code, **deux processus**, distingués par `HELIARA_ROLE` :

```text
pnpm dev:both    # les deux, 3000 et 3001, journaux préfixés
pnpm dev:read    # 3000, le site public
pnpm dev:write   # 3001, l'administration
```

|                | `read`, port 3000  | `write`, port 3001 |
| -------------- | ------------------ | ------------------ |
| Exposition     | publique           | VPN seulement      |
| Compte base    | `app_read`         | `app_write`        |
| Routes servies | tout sauf `/admin` | `/admin` seulement |

**La séparation lecture / écriture est portée par la base, pas par le réseau.**
`app_read` n'a `EXECUTE` que sur les procédures `pub_*`, accordées une par
une dans `db/init/10-grants.sql`. Il se voit refuser toute procédure d'écriture,
`list_case_studies` - celle qui montrerait un brouillon - et `SELECT` sur toute
table. Vérifié contre la base en marche dans `tests/db/separation.test.ts`.

Trois barrières se cumulent, de la plus faible à la plus forte :

1. `proxy.ts` renvoie 404 - pas 403, qui confirmerait l'existence.
2. `getPool("write")` refuse de s'ouvrir hors du rôle `write`.
3. Le déploiement de lecture ne reçoit pas `DB_WRITE_PASSWORD` : les deux
   premières contournées, il n'a aucun identifiant capable d'écrire.

`read` est la valeur par défaut : un oubli de configuration dégrade vers moins de
droits, jamais vers plus.

Limite assumée : un seul build sert les deux processus, donc le code de
l'administration existe sur l'hôte public même si ses routes y répondent 404. Le
rendre physiquement absent demanderait deux applications en monorepo.

### Pièges de ce mode à deux processus

- **Next 16 pose un verrou par répertoire de build** et refuse un second serveur
  de dev : « Another next dev server is already running ». D'où `NEXT_DIST_DIR`
  dans `next.config.ts`, et `.next-read` / `.next-write` pour `pnpm dev:both`.
- **Un lien relatif écrit dans l'administration reste sur le port d'écriture**, où
  tout ce qui n'est pas `/admin` répond 404. « Voir le site » et « Voir en ligne »
  passent par `publicSiteUrl()`, réglé par `NEXT_PUBLIC_SITE_ORIGIN`.
- **Le cache d'un processus n'est pas celui de l'autre.** Un `updateTag` écrit côté
  administration ne franchit pas la frontière : la fraîcheur du site public vient
  d'un `revalidate` de 60 s, pas d'une invalidation par tag.
- **`revalidate` doit être un littéral.** Next analyse les exports de configuration
  de segment statiquement : une valeur importée fait échouer le build sur « Invalid
  segment configuration export ». `CASES_REVALIDATE_SECONDS` n'est que
  documentaire, les deux valeurs doivent rester d'accord.

## Le contenu doit être vrai

Le site est parti d'un contenu de démonstration entièrement fictif, et cela reste la
première chose à vérifier avant d'écrire quoi que ce soit d'éditorial.

**Ce qui a été retiré, et ne doit pas revenir.** Huit noms de clients inventés dans le
bandeau de l'accueil, quatre statistiques non vérifiables (« 47 produits livrés »,
« 87 % de clients qui reviennent »). Restent en place, et restent à traiter : trois
témoignages signés de personnes nommées avec fonction et employeur, six autres dans les
fiches de réalisation, six membres d'équipe avec parcours détaillés, et vingt-quatre
résultats chiffrés.

**Attribuer un verbatim inventé à une personne nommée chez une entreprise nommée est le
point le plus exposé du site.** Si un homonyme existe, le préjudice est réel. Ce n'est
pas une question de ton de voix, c'est une question de risque.

**Ne jamais emprunter les références d'une marque sœur.** Les clients de LessonSharing
ou d'Hexceos ne sont pas ceux de Heliara, et ce sont des marques de tiers réelles : les
afficher sous « Ils nous font confiance » cumulerait une affirmation fausse et un usage
de marque sans autorisation. Elles ont leur place sur `/le-groupe`, attribuées à la
marque qui les sert, et sous réserve que l'autorisation d'usage de logo couvre ce site.

**La caution d'une marque jeune passe par ce qui lui coûte quelque chose.** L'accueil
porte donc deux registres distincts, et la distinction est ce qui les autorise à
coexister :

- `lib/content/guarantees.ts` (S3) - des **artefacts** : un dépôt, un document, une
  date, un chiffre au contrat. Ce qu'on remet.
- `lib/content/kpis.ts` (S7) - des **principes** : sur mesure, interlocuteur unique,
  aucun verrou, pensé pour évoluer. Ce qu'on tient.

Une garantie qui se reformule en principe appartient à `kpis.ts`, et l'inverse. Le
défaut est arrivé : quatre des sept lignes du bandeau redisaient mot pour mot les
quatre principes, et le visiteur lisait deux fois la même promesse. Un test de
`tests/unit/content.test.ts` compare désormais les mots pleins des deux listes et
nomme le terme fautif.

### Les technologies, telles qu'elles sont

Écrit une fois ici parce que le site l'affirmait faux, et que l'erreur se recopie :

- **Par défaut : TypeScript, Next.js, MariaDB.** Ennuyeux, documentés, recrutables. Ce
  ne sont **pas** des passages obligés : la technologie suit le besoin, et un choix
  différent se dit avant de commencer. Le site annonçait PostgreSQL, qui n'est pas la
  base par défaut.
- **E-commerce : Shopify, avec un thème entièrement sur mesure.** Le studio ne
  développe pas de moteur de paiement, de calcul de TVA ni de gestion de fraude. Le
  site décrivait une boutique développée de zéro.
- **Site institutionnel : entièrement sur mesure**, sans thème acheté ni constructeur
  de pages. C'est le seul domaine où l'on ne part pas d'une plateforme du marché.

## Contenu : base d'abord, statique en secours

Les réalisations sont lues en base par `lib/db/public-cases.ts`, **avec repli
explicite sur `lib/content/cases.ts`** quand la base est vide ou injoignable. Un
déploiement ne doit pas échouer parce que la base n'a pas répondu, et le site ne
doit jamais afficher une page de réalisations vide. Le repli est silencieux pour le
visiteur et bruyant dans les journaux : une base injoignable est un incident.

**Le repli est « tout ou rien », et c'est pourquoi `pnpm db:seed` existe.** Dès
qu'une fiche est publiée en base, le repli cesse de s'appliquer : sans amorçage, la
première publication ferait disparaître les fiches statiques de la grille.
`pnpm db:seed` importe le contenu existant, une fois, de façon idempotente - une
fiche dont le slug existe déjà n'est jamais écrasée.

**`lib/content/cases.ts` porte donc deux rôles à la fois, et c'est ce qui le rend
sensible** : il est le repli du site public, et la source de ce que `db:seed` publie à
l'initialisation d'une production. Une erreur y est publique deux fois, sans qu'aucune
mise en ligne n'ait été décidée. Ses six fiches de démonstration - Voltéis, CHU
Rhône-Nord, Kerlon, Nexa Santé - ont été remplacées par les neuf réalisations réelles.
Deux tests de `tests/unit/content.test.ts` le verrouillent : aucun marqueur de rédaction
(`[à compléter]`, `20XX`, `ajoute un résultat`) et aucun des noms de clients inventés.

Les neuf fiches sont volontairement **sans chiffre, sans témoignage et sans ligne
`Stack`** : aucun client n'a communiqué de mesure, un verbatim se fait valider par écrit,
et une pile technique affichée publiquement est une affirmation vérifiable par le
lecteur. Chaque bloc est conditionné à son contenu, donc rien ne manque à l'écran - et
ces trois manques se comblent dans l'administration à mesure que l'information est
confirmée. `figure` et `measure` vont par deux ou pas du tout, c'est le seul invariant
que le test conserve.

**L'amorçage ne réenveloppe plus les corps de chapitre.** Les fiches de démonstration
portaient un paragraphe de texte brut, que `db:seed` entourait d'un `<p>` pour l'égaler
à ce que produit l'éditeur riche. Les fiches réelles portent déjà leur HTML, deux
paragraphes par chapitre : les envelopper donnerait un `<p>` contenant deux `<p>`.

Fusionner base et statique à la lecture a été écarté : cela installerait une
ambiguïté permanente, puisqu'il deviendrait impossible de supprimer une fiche
statique depuis l'administration.

## Administration

`app/admin/layout.tsx` ne porte **pas** de garde : il couvre aussi `/admin/login`,
qui doit rester atteignable sans session. La garde vit dans
`app/admin/(protected)/layout.tsx`, ce qui évite la boucle de redirection qu'un
contrôle posé plus haut provoquerait.

**L'autorisation est refaite dans chaque action serveur.** Une action serveur est
une route publique : le layout protège le rendu des pages, pas les actions. Toutes
commencent par `requireSession()`, sans exception, et rejouent leur schéma zod.

```text
pnpm admin:create   # premier compte, mot de passe saisi sans écho
pnpm db:migrate     # rejoue schéma, procédures ET privilèges
pnpm db:seed        # amorce la base depuis le contenu statique
pnpm db:resync-expertises <slug>...   # repousse en base la fiche d'un service
pnpm db:import-cases <fichier.json>   # importe des réalisations rédigées hors de l'outil
```

**`pnpm db:import-cases` existe pour la reprise de contenu, pas pour l'usage courant.**
Des fiches rédigées ailleurs - le format est spécifié dans `docs/brief-realisation.md` -
entrent en une commande plutôt qu'en une heure de recopie, et une heure de recopie fait
toujours une faute de frappe quelque part. Il importe **en brouillon uniquement**,
est idempotent par slug, et **rejoue le schéma zod de l'administration** : `caseFields`
et ses collections, la même validation que l'écran, y compris la liste fermée de balises
HTML. Un import plus permissif que l'éditeur créerait des fiches impossibles à modifier
ensuite, et le défaut ne se verrait qu'au premier enregistrement.

C'est ce partage qui a fait éclater `caseSchema` en deux : zod 4 refuse `.omit()` sur un
schéma affiné, et l'import doit retirer quatre réglages d'affichage pour leur donner une
valeur par défaut. D'où `caseFields` pour la forme et `withTestimonialRule()` pour la
règle du tout ou rien, appliquée des deux côtés. Redéclarer la forme dans le script
aurait donné deux définitions à tenir d'accord, ce qu'un schéma partagé sert à éviter.

Les marqueurs du genre `[À COMPLÉTER]` sont **importés tels quels et signalés en fin
d'exécution**. Les effacer ferait disparaître la question qu'ils posent.

Quatre collections sont administrables : **Réalisations**, **Articles**, **Expertises** et
**Références clientes**. Les autres contenus vivent encore dans `lib/content/*.ts`.

### Références clientes

Le bandeau « Ils nous font confiance » de l'accueil, à `/admin/references`.

**Un tableau et non l'éditeur à étapes**, à la différence des trois autres collections. Une
référence a quatre champs et pas de page à elle : le rail d'étapes, le panneau de
publication et les aperçus de placement seraient une coque autour de rien. On voit la bande
entière dans son ordre, ce qui est exactement ce qu'on vient vérifier.

**Le logo est montré à la hauteur qu'il aura dans la bande**, sur la même surface. C'est la
seule façon de voir qu'un fichier est trop chargé, mal détouré ou déséquilibré par rapport à
ses voisins ; un aperçu confortable mentirait sur le résultat.

**« En ligne » veut dire « l'autorisation est obtenue ».** C'est le seul écran où publier
engage autre chose que la qualité du contenu : un logo est une marque, et l'afficher sous
« ils nous font confiance » est une affirmation commerciale qui se couvre par un accord
écrit. Aucune base ne peut le vérifier, d'où le rappel à côté de l'interrupteur et le sens
particulier que prend `status` dans cette table.

**`seedMedia()` est la seule exception à « le fichier ne traverse jamais l'application ».**
L'amorçage a dû pousser les huit logos du dépôt vers le stockage objet, et il n'y a pas de
navigateur pour recevoir une URL présignée. La surface est nulle - les fichiers viennent du
dépôt - mais `putObject()` ne doit pas servir dans une action serveur : faire passer un
téléversement d'usager par l'application, c'est reprendre à sa charge la taille, le type,
le temps de transfert et la mémoire, tout ce que la signature déporte sur le stockage.

**Les dimensions des logos restent nulles en base**, et c'est un choix. La bande borne la
hauteur de chaque image et laisse la largeur suivre, `shape` décidant de cette hauteur :
aucun rendu ne consomme les dimensions, les lire demanderait une bibliothèque de décodage,
et un SVG n'en a pas. C'est l'inverse d'une couverture de réalisation, dont la boîte prend
le rapport du fichier.

**Corriger un contenu administrable dans `lib/content/*.ts` ne change rien au site.**
Réalisations, articles et expertises sont lus en base ; ces fichiers ne sont plus que le
repli et la source d'amorçage. Et `pnpm db:seed` ne rattrapera pas la correction : il est
idempotent et laisse intact tout élément dont le slug existe déjà - ce qui est exactement
ce qu'on veut de lui, rejouer l'amorçage ne doit pas défaire une saisie.

D'où `pnpm db:resync-expertises <slug>...`, pour une correction de fond relue dans le
dépôt qu'on ne veut ni ressaisir à la main ni réamorcer en bloc. Il remplace la fiche,
les livrables, les choix techniques et les objections des **seuls services nommés**, par
les procédures stockées, sous le compte d'amorçage - donc traçable dans l'audit. Aucun
slug par défaut, volontairement : lancé sans argument, il n'écrase rien. Il n'existe pas
d'équivalent pour les réalisations ni les articles : leur correction passe par
l'administration.

**`pnpm db:migrate` n'est pas un confort.** `DROP PROCEDURE` emporte avec lui les
privilèges accordés sur cette procédure - ils vivent dans `mysql.procs_priv` et
rien ne les restaure. Rejouer un fichier de procédures à la main révoque donc
silencieusement l'accès des comptes applicatifs, et l'application répond « execute
command denied » sur une procédure qui existe pourtant. Le symptôme est déroutant,
la cause invisible.

**`SQL SECURITY DEFINER` sur toutes les procédures**, et c'est ce qui rend le
modèle possible : en `INVOKER`, la procédure s'exécute avec les droits de
l'appelant, donc un compte sans droit de table échoue à l'intérieur même de la
procédure. Aucune clause `DEFINER = ...` explicite, pour ne pas exiger `SET USER`.

### L'image de tête, et deux défauts qui ne se voyaient pas

`CaseCover` rend la couverture d'une réalisation aux **quatre** endroits qui l'affichent :
hero de la fiche, carte du hub, carte de l'accueil, et l'aperçu de brouillon - qui
construit sa vue à la main et l'aurait donc oubliée. **Sans média, il rend le croquis
d'origine** (`CaseHeroSketch`, `CaseCardSketch`, `CaseSketch`) : une fiche sans image ne
change pas d'un pixel.

L'image remplace **le contenu de la fenêtre, pas la fenêtre** : le halo, le cadre
flottant, son ombre et son débord restent. C'est la profondeur par les couches, et c'est
ce qui fait qu'une capture de site se lit comme un écran allumé plutôt qu'une photo
collée. Pas de halo sur le hero, sa section en portant déjà un.

Deux défauts se cumulaient, et **aucun ne se voyait au build, au typecheck ou dans les
journaux** :

1. **`heroMedia` n'était consommé nulle part.** La chaîne était complète - MinIO, la
   ligne `media`, `hero_media_id`, les colonnes des procédures `pub_*`, `heroMedia`
   construit par `lib/db/public-cases.ts` - et les trois vues dessinaient toujours le
   croquis. Déposer une image n'avait aucun effet. `CaseSketch` portait depuis l'origine
   le commentaire « à remplacer par les captures réelles ». Le même défaut valait pour le
   texte alternatif : `set_media_alt`, son privilège et l'action `setMediaAlt` existaient,
   sans rien pour les appeler. **Une donnée qui arrive jusqu'au composant et qu'il ignore
   ne produit aucun signal** : c'est le mode de panne à suspecter quand une écriture
   réussit et ne se voit pas.
2. **`next/image` refusait le fichier, deux fois.** `remotePatterns` portait le `pathname`
   `/heliara`, comparé de façon exacte, alors qu'une image est à `/heliara/public/…` :
   d'où le `/**`. Et **Next 16 refuse par défaut toute image distante dont l'hôte résout
   sur une IP privée** (`dangerouslyAllowLocalIP: false`), ce qui vise MinIO en
   développement. Le piège est que ce refus rend **le même 400 `"url" parameter is not
   allowed` qu'un motif absent** : on cherche dans `remotePatterns` un défaut qui n'y est
   pas, et la cause ne se lit que dans le journal du serveur, « resolved to private ip ».
   Le drapeau est ouvert **selon l'hôte et non selon `NODE_ENV`**, pour qu'un stockage
   réellement public reste protégé même sur un build de production lancé en local, et le
   risque reste borné par `remotePatterns`.

**Un changement de `next.config.ts` demande un vrai redémarrage.** Le serveur de dev
recharge le rendu mais garde la configuration de son optimiseur d'images : l'un passe,
l'autre continue de répondre 400. Ne pas conclure que le correctif est faux.

**Le rapport de la boîte vient du fichier, pas d'une constante.** `media.width` et
`media.height` sont lus à l'envoi et stockés : la couverture de lecture d'un article et
chaque image de galerie prennent donc le rapport réel du fichier, ce qui les affiche
entières **et** garde la boîte dimensionnée avant le chargement - donc aucun décalage de
mise en page. Un rapport imposé rognait les côtés d'une capture de site, c'est-à-dire
coupait le logo du client : exactement ce qu'une couverture doit montrer. Les deux seuls
endroits qui gardent un `object-cover` rognant sont ceux dont la hauteur est imposée par
autre chose - la fenêtre de `CaseCover` et la moitié de carte du hub des ressources - et
ils s'ancrent alors en haut à gauche, une vignette devant montrer le début du contenu.

**Il n'y a pas de champ de texte alternatif pour la galerie**, seulement la légende, et
c'est le bon partage : la légende est visible donc lue par tout le monde, et une
alternative qui la répéterait ferait entendre deux fois la même phrase.

`ArticleCardSketch` a été sorti de `app/(site)/ressources/page.tsx` pour devenir le repli
de la carte « à la une ». Il reste un **repli** et non une illustration : il dessine la
grille de décision d'un article précis, et s'affichait sous n'importe quel article mis en
avant.

**Ne pas lancer un troisième serveur de dev pour vérifier.** `NEXT_DIST_DIR` permet deux
processus, pas trois : un troisième corrompt le cache Turbopack, et le symptôme est un
« Parsing CSS source code failed » sur `app/globals.css` avec des octets abîmés dans le
CSS **généré**. La source est intacte, le correctif est `rm -rf .next-read .next-write`
puis un redémarrage. Vérifier une page se fait par CDP sur les serveurs déjà en marche.

`curl` ne suffit pas pour vérifier un rendu : la réponse contient surtout la charge RSC,
et une section absente du HTML récupéré n'est pas une section absente de la page.

La **galerie** d'une réalisation se rend par `CaseGallery`, **après le récit et avant les
résultats** : on lit l'histoire, on voit ce qui a été livré, puis on mesure. Avant le
récit ce seraient des captures sans contexte ; après les résultats, elle arriverait la
démonstration déjà faite.

L'**image de tête d'un article** se rend par `ArticleCover`, sous le bloc auteur et avant
le corps - la placer au-dessus du titre repousserait le `h1` sous le pli, ce qui coûterait
le LCP pour un gain d'atmosphère. Deux replis différents et c'est voulu : la carte « à la
une » retombe sur `ArticleCardSketch`, sa moitié visuelle ne pouvant pas être vide sans
déséquilibrer la grille ; la vue de lecture ne rend **rien**, un article sans image étant
un article et non un article incomplet.

Traitement plus sobre que celui des réalisations, volontairement : `CaseCover` garde la
fenêtre flottante de son croquis parce qu'il montre une interface livrée, alors qu'une
image d'article peut être un schéma comme une photo - un cadre de fenêtre mentirait sur
la nature du contenu.

**La page article était la seule route dynamique à composer ses métadonnées à la main**,
et elle y perdait l'URL canonique et l'image de partage. Elle passe désormais par
`pageMetadata`, avec l'image de tête en carte de partage quand elle existe - même règle
que les réalisations. Un article se partage plus que toute autre page du site, ce qui en
faisait l'endroit le plus coûteux pour cet oubli.

Limite connue : les **cartes du flux** de `/ressources` restent sans vignette. Ce sont des
cartes de texte compactes en trois colonnes ; y ajouter une image ne se ferait bien qu'en
en mettant sur toutes, et une grille où certaines en ont et d'autres pas se lit comme un
défaut. À rouvrir comme une décision de mise en page, pas comme un branchement.

### Aperçu de brouillon

`/admin/realisations/[slug]/apercu`, servi par l'administration, **et il ne peut
pas en être autrement** : le déploiement public utilise `app_read`, à qui la base
refuse de lire un brouillon. Un aperçu servi par le site public exigerait de percer
cette séparation, ce qui annulerait la garantie qu'elle apporte. Il est donc
derrière la session et le VPN : aucun lien signé à faire expirer.

`CaseStudyView` est partagé par la page publique et l'aperçu : **le même rendu, les
mêmes composants, le même CSS.** Il ne peut pas diverger, il n'y a rien à tenir en
double.

### Interface

Les trois éditeurs - réalisations, articles, expertises - partagent **un seul moule**.
Ajouter une quatrième collection, c'est décrire ses étapes, pas réécrire un écran.

| Pièce                    | Rôle                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `editor-state.ts`        | l'état de saisie, hissé au-dessus des panneaux, et ce qu'une étape enregistre |
| `step-editor.tsx`        | le rail d'étapes et la barre d'enregistrement                            |
| `publish-panel.tsx`      | ce qu'il manque pour publier, **avant** le clic                          |
| `placement.tsx`          | le bloc du site dessiné à côté du champ qui le remplit                   |
| `form-kit.tsx`           | champ, groupe, sélecteur, interrupteur, compteur, liste vide, erreur de ligne |
| `editor-header.tsx`      | fil d'Ariane, statut, aperçu, lien public, suppression en deux temps      |
| `create-dialog.tsx`      | la coque des créations, et le champ d'identifiant d'URL avec son aperçu   |

**Des étapes, mais pas un assistant.** Un assistant impose l'ordre et verrouille ce qui
n'a pas été validé : il faut ça pour une première saisie, c'est insupportable ensuite
quand on revient corriger une phrase. Les étapes sont numérotées, portent leur état et
proposent « Enregistrer et continuer », mais toutes restent atteignables d'un clic.

**Hisser l'état hors des panneaux est ce qui autorise le découpage.** Tant qu'un onglet
était un formulaire, le découpage suivait les procédures d'écriture :
`update_case_study` prend la fiche entière, donc ses trente champs devaient tenir dans
un seul écran. L'état vivant dans l'éditeur, une étape peut n'en montrer que quatre et
enregistrer le tout. Une étape enregistre **tout ce qu'elle touche**, ce qui peut viser
plusieurs procédures en séquence (`commitAll`) - un bouton par procédure était fidèle à
la plomberie et incompréhensible à l'usage.

**Les aperçus de placement suivent la frappe, l'état des étapes non.** Le premier doit
répondre à la saisie ; le second est calculé sur les données **enregistrées**, parce que
la publication interroge la base et qu'une pastille qui verdirait à la frappe
promettrait ce que la base refuserait encore. Le panneau de publication duplique
volontairement les exigences des procédures `publish_*` : la base reste l'autorité, ce
miroir n'achète que le confort de savoir avant d'essayer.

**`data-active`, pas `data-selected`.** C'est l'attribut que pose cette version de Base
UI. Les quatre barres d'onglets de l'administration visaient `data-selected` : elles
n'avaient donc **aucune** marque d'onglet actif, et l'on ne repérait la position qu'à
l'anneau de focus. Un sélecteur Tailwind qui ne correspond à rien ne produit ni erreur
ni avertissement - ce défaut ne se voit qu'en relevant les attributs dans le DOM.

- **Glisser-déposer d'images** : `MediaDropzone`. Le fichier ne traverse pas
  l'application - l'action signe une URL, le navigateur envoie l'octet directement
  à MinIO, une seconde action confirme. `XMLHttpRequest` et non `fetch`, seule API
  qui rapporte la progression d'un envoi. Le média n'est `ready` qu'après
  confirmation : un envoi interrompu ne laisse rien d'affichable.
- **Le texte alternatif de l'image de tête** se saisit dans l'étape Visuels, et
  l'étape écrit **deux procédures en séquence** : `update_case_study` rattache l'image,
  `set_media_alt` la décrit - l'alternative appartient au média, pas à la fiche.
  L'écriture est conditionnée à un changement réel, sans quoi chaque enregistrement de
  n'importe quelle étape déposerait une ligne `media.set_alt` dans l'audit ; la
  comparaison porte sur le média **de même identifiant**, l'alternative en base après un
  remplacement d'image étant celle du nouveau fichier. Il est légitime de le laisser
  vide : la couverture est posée sous le titre, qui nomme déjà le projet.
- **Éditeur riche** : `RichText`, sur Tiptap. Jeu de marques volontairement court -
  gras, italique, lien, listes, citation. Ni titres ni couleurs : la hiérarchie et
  la typographie appartiennent à la DA, pas à la personne qui rédige.
  `immediatelyRender: false` est obligatoire dans l'App Router.
- **Réordonnancement** : `SortableList`, sur dnd-kit, **à la souris et au clavier**.
  C'est la raison de la dépendance : l'API de glisser-déposer du navigateur n'a
  aucun équivalent clavier.
- **Chaque étape s'enregistre séparément** : une saisie invalide dans une étape ne fait
  pas perdre le travail fait dans une autre, et changer d'étape ne perd rien.
- **Les chapitres d'une réalisation sont en accordéon, un seul ouvert à la fois** -
  huit éditeurs riches empilés faisaient plusieurs écrans de haut, on perdait le plan
  de la fiche, et huit instances de Tiptap tournaient pour une seule qu'on utilisait.
  **Les blocs d'un article, non**, et la différence est délibérée : un chapitre porte un
  titre, donc replié il reste identifiable et la liste fait sommaire ; un paragraphe
  d'article n'a que son texte, et rédiger de la prose demande de passer sans cesse d'un
  paragraphe au suivant. Un accordéon y coûterait un clic par phrase déplacée.
- **Créer n'exige que le minimum** - titre, adresse, et le champ sans lequel la fiche
  n'a pas de place (secteur, catégorie, famille). La complétude est exigée à la
  publication : réclamer tout à la création obligerait à préparer le contenu hors de
  l'outil.
- **`lib/slug.ts` reproduit `Slugify()` en SQL**, uniquement pour montrer l'adresse
  avant d'enregistrer. La valeur qui compte est produite par la base quand le champ est
  laissé vide, et c'est le test d'intégration qui la vérifie.
- `useOptimistic` pour le réordonnancement, jamais un `useState` recopié des props :
  React retombe seul sur la valeur du serveur, donc ni rollback à écrire ni
  synchronisation par effet - ce que `react-hooks/set-state-in-effect` refuse.
- La colonne de navigation est `sticky` avec sa hauteur propre. Sans cela elle
  s'étire à la hauteur du contenu et le bloc du compte part hors de vue.

### Articles

Le corps reste en **blocs typés** - paragraphe, intertitre, encadré, liste
numérotée - et non en HTML. Un encadré porte un chapô distinct de son texte, une
liste numérotée des triplets numéro / titre / texte : aucun champ de texte riche ne
saurait exprimer ces deux formes, et les écraser en HTML ferait perdre deux formes
de la DA. Le corps de chaque paragraphe passe malgré tout par l'éditeur riche - à
l'intérieur d'un bloc, gras, italique et liens ont leur place.

**Une exception à la règle « jamais un JSON opaque ».** Elle vise les collections
dont les éléments sont des entités qu'on veut requêter et réordonner. Les entrées
d'un bloc numéroté n'en sont pas : sans identité, jamais lues séparément du bloc,
disparaissant avec lui. Elles sont la charge d'un bloc, d'où `article_block.items`
en JSON validé.

Deux dates, et ce n'est pas une redondance : `published_on` en ISO trie et alimente
le plan du site, `date_label` s'affiche en français. Formater l'un depuis l'autre en
SQL dépendrait de la locale du serveur, et « été 2026 » est parfois plus juste
qu'une date exacte.

**Un jour de calendrier ne se ramène jamais en ISO par `toISOString()`.** `mysql2` rend
une colonne `DATE` en `Date` positionnée à minuit **local** ; la reconvertir en UTC la
fait reculer d'un jour partout à l'est de Greenwich. Le défaut était en production et
silencieux : la base contenait le 12 juillet, l'éditeur affichait le 11, et enregistrer
la fiche écrivait le 11 - la date d'un article reculait d'un jour à chaque passage dans
l'éditeur, et le détail des vues quotidiennes était décalé d'autant. `lib/date.ts`
(`isoDay`, `todayIso`) ne raisonne qu'en composantes locales, et `tests/unit/date.test.ts`
le verrouille dans n'importe quel fuseau. Ni le build ni le typecheck ne voyaient quoi
que ce soit, et le commentaire d'origine affirmait l'inverse - qu'un formatage local
risquerait de décaler.

Le détail des trente jours est **reconstitué côté écran**, tous les jours y compris
ceux sans vue. La base ne rend que les jours qui ont une ligne, ce qui est juste pour
elle et faux à l'affichage : avec un seul jour de trafic, l'unique barre en `flex-1`
prenait toute la largeur et l'histogramme se lisait comme un mois entier au maximum.

**La mise en avant est exclusive**, portée par `set_article_featured` et non par le
formulaire : le flux public affiche un article en tête et l'exclut de la grille, donc
deux mises en avant en feraient disparaître une sans que personne comprenne pourquoi.

### Expertises, et la navigation du site

Deux niveaux : une **famille** regroupe des services et porte une entrée du menu ; un
**service** est une page. C'est la seule collection dont une écriture peut casser la
navigation, présente sur chaque page - d'où trois garde-fous en base :
`nav_service_slug` doit désigner un service existant, une famille non vide ne se
supprime pas, un service cible de nav ne se supprime pas.

**Les pages d'expertise vendent la conception, pas la technologie.** Le titre « Des
choix techniques assumés » coiffait des cartes qui nommaient des outils. Deux effets,
tous deux mauvais : le décideur - non technique - décrochait, et celui qui lisait
comprenait qu'on lui imposait une pile. La section s'appelle désormais « Une technologie
au service de votre projet » et dit ce que ces choix apportent. La pile réelle vit **en
FAQ**, où elle répond à « suis-je enfermé ? » au lieu d'annoncer une contrainte - et
c'est aussi là que la cherche le lecteur technique du comité d'achat.

**`whyCustom` - « Pourquoi du sur-mesure ? »** La section qui **qualifie** au lieu de
vendre : les signes qui indiquent qu'une plateforme spécifique se justifie, puis une
dernière phrase qui admet le cas contraire. C'est ce renoncement qui rend crédible tout
ce qui précède. Trois particularités :

- **Elle ne s'affiche que complète.** Un chapô sans signe annoncerait une liste vide,
  des signes sans conclusion laisseraient le visiteur sans la réponse qui compte. La
  couche de lecture publique rend `undefined` dès qu'une pièce manque ; le schéma zod,
  lui, accepte tout vide - refuser un enregistrement partiel empêcherait de sauvegarder
  un brouillon en cours de rédaction.
- **Un seul enregistrable pour trois pièces.** Une première version tenait le chapô dans
  un `useFieldSet` et les signes dans un `useCollection` : chaque `commit` devait lire
  l'autre pour reconstituer l'envoi, donc les deux se référençaient en cercle et le
  typage refusait. Le défaut était de conception - `set_expertise_why_custom` écrit tout
  dans une transaction, il n'y a qu'un enregistrable, et les signes sont un champ de ce
  jeu.
- **Facultative par service.** Tous ne se décident pas sur cette question.

**Un défaut de conception corrigé.** Le contenu statique faisait pointer chaque entrée
de nav vers `/expertises/<slug de la famille>`, ce qui ne fonctionnait que parce que
trois services portaient par coïncidence le même slug que leur famille. Renommer un
service cassait la nav en silence. La famille désigne désormais explicitement sa
cible, et `update_expertise_service` la fait suivre en cas de renommage.

**Les familles sans service publié sont écartées de la nav comme du hub.** Les garder
en les faisant mener au hub paraissait prudent, et c'était une erreur : deux familles
vides donnaient deux entrées vers la même adresse, et le visiteur y aurait trouvé un
hub où la famille n'apparaît pas. Une entrée de menu sans destination propre est une
impasse.

La nav est lue dans `app/(site)/layout.tsx` et passée à l'en-tête et au pied de page.
`lib/site.ts` n'en garde qu'un **repli** (`expertiseNavFallback`), et ce repli compte
double : une base muette ne doit pas vider le menu de toutes les pages.

### Texte riche : validé, jamais nettoyé

Les corps de chapitre et les paragraphes d'article sont saisis dans Tiptap, donc
stockés en HTML, donc affichés par `dangerouslySetInnerHTML` - via `RichHtml`. Cela
n'est acceptable qu'à une condition : **rien d'autre que ce fragment ne peut entrer en
base**, ce que `lib/rich-text.ts` garantit.

**Valider plutôt que nettoyer.** Un nettoyeur transforme ce qu'il ne comprend pas et
laisse passer ce qu'il a mal compris ; les contournements de nettoyeurs écrits à la
main remplissent des rapports de vulnérabilité. La validation échoue en cas de doute :
toute balise hors liste, tout attribut inconnu, tout `<` non reconnu, tout commentaire
HTML fait rejeter l'enregistrement. Le pire cas est un refus, pas une injection.
24 tests couvrent les tentatives usuelles.

La liste des balises reprend **exactement** ce que l'éditeur sait produire. L'étendre
d'un côté sans l'autre ouvre une porte que personne n'emprunte, ou fait rejeter du
contenu légitime.

Défaut constaté en production avant correction : le corps des chapitres affichait
`<p>` et `</p>` en clair, la vue le rendant comme du texte.

### Comptage des vues

**Compter une vue est une écriture, et le site public ne peut pas écrire.** C'est
là que le modèle par procédure paie : `pub_count_article_view` est la **seule**
procédure d'écriture accordée à `app_read`, et le pire qu'un appelant hostile en
tire est un chiffre gonflé - elle ne lit aucun contenu, ne rend aucune ligne,
n'accepte qu'un slug, et ne touche que deux compteurs. Un `GRANT EXECUTE ON
heliara.*` aurait tout ouvert d'un coup ; le grant par procédure permet d'ouvrir un
millimètre.

Le déclenchement vient du **navigateur** et non du rendu : les fiches sont prérendues
et leur code ne s'exécute pas à chaque visite, donc un compteur incrémenté au rendu
ne compterait qu'une visite sur beaucoup. `ViewCounter` attend deux secondes, ne
compte qu'une fois par article et par session, s'abstient si l'onglet est caché ou
sous automatisation. Le chiffre reste approximatif et gonflable, comme tout compteur
public : il est présenté comme une indication de lecture, jamais comme une mesure
d'audience.

Deux niveaux de stockage : un total dénormalisé sur `article`, pour que la liste
l'affiche sans un `SUM` par ligne, et un agrégat quotidien à part, parce qu'un total
depuis toujours ne dit pas si l'article est lu **aujourd'hui**. Les deux écritures
sont dans la même transaction - dénormaliser impose de tenir le total à jour au même
instant que son détail.

### Deux pièges SQL rencontrés sur les articles

- **`LEAVE` exige un bloc étiqueté** en MariaDB : une sortie anticipée s'écrit
  comme une condition, pas comme un saut.
- **`IFNULL(STR_TO_DATE(...), colonne)` ne protège de rien** : en mode strict,
  MariaDB lève sur une entrée illisible au lieu de rendre `NULL`. La forme se
  vérifie par une expression régulière **avant** la conversion. Et côté schéma,
  `Date.parse` ne suffit pas non plus - il accepte 2026-02-30 en le reportant au 2
  mars, d'où le contrôle par aller-retour.

### Rédiger une fiche : le brief à donner

`docs/brief-realisation.md` liste tous les champs d'une réalisation, ce que la
publication exige et ce qu'elle n'exige pas, avec les limites de longueur reprises des
colonnes. Il est écrit pour être donné tel quel à un assistant qui rédige une fiche, et
il porte les deux contraintes qu'on oublie : le corps des chapitres est du HTML validé
contre une liste fermée de treize balises, et les images ne se fournissent pas par écrit
puisqu'un identifiant de média vient du dépôt de fichiers.

### Ce qui est facultatif dans une fiche

Le chiffre, le témoignage, l'étiquette de hero, la fiche technique, les résultats
et les enseignements. **Chaque bloc est conditionné à son contenu** dans les vues
publiques : toute mission ne se résume pas à une mesure, et en réclamer une
pousserait à en inventer. La publication n'exige que le titre, le secteur, les deux
résumés et au moins un chapitre.
