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

`package.json` porte les scripts. Trois avertissements qu'il ne porte pas :

- **`pnpm db:reset` détruit les volumes** et rejoue `db/init` : perte de données.
- **`pnpm db:migrate` n'est pas un confort** : tout `DROP PROCEDURE` emporte ses privilèges,
  et cette commande seule les rejoue dans le bon ordre.
- **`pnpm db:seed` amorce depuis le dépôt, `pnpm db:export` transporte le réel.** Pour
  reproduire le site tel qu'il est, c'est le second.

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
- Server Components par défaut. `"use client"` réservé à : menu mobile, sélecteur de thème, filtres de réalisations, formulaire de contact, apparitions au scroll, lien de prise de rendez-vous.
- Contenu éditorial : données statiques typées dans `lib/content/*.ts`, jamais en dur dans le JSX.
- **Aucun cadratin ni demi-cadratin, jamais** : ni `—` ni `–`, y compris dans le contenu éditorial, les commentaires de code et les messages de commit. Un tiret simple `-` partout où un séparateur est nécessaire. Les maquettes de référence en sont pleines : les transcrire suppose de les convertir au passage.

## Design tokens

Tailwind v4 : aucun `tailwind.config`. Tout vit dans `app/globals.css`, en deux couches :

1. `:root` / `.dark` déclarent les variables brutes `--hel-*` (hex, ombres, halos, easings).
2. `@theme inline` les expose comme utilitaires Tailwind (`bg-surface`, `text-brand-text`, `shadow-3`, `ease-expo`, `max-w-page`…) **et** mappe la nomenclature shadcn dessus (`--color-background`, `--color-primary`, `--color-ring`…), pour que tout composant shadcn ajouté ensuite hérite de la DA sans retouche.

Dark mode : classe `.dark` sur `<html>`, pilotée par `next-themes`. Un composant peut donc lire l'état du thème en CSS (`dark:hidden`) plutôt qu'en React : c'est ce que fait `ThemeToggle`, ce qui évite la garde `mounted` et le rendu vide à l'hydratation.

Breakpoints : ceux de Tailwind, plus `2xl` ramené à 1440 px et un `menu` à 900 px, qui est la bascule nav horizontale / menu plein écran (`hidden menu:flex`).

### Nommage des couleurs

Les utilitaires sont déclarés dans `@theme inline` de `app/globals.css` : les lire là plutôt
que d'en tenir une seconde liste ici. Deux points que le CSS ne dit pas : `faint` est
**décoratif seulement** et ne doit jamais porter de texte - utiliser `label` -, et `brand`
est le geste orange, dont la DA n'autorise **qu'une occurrence par écran**.

**Piège accessibilité :** l'orange de marque `#E9591F` ne donne que 3,5:1 avec du blanc - insuffisant pour un libellé de bouton. Le fond des boutons primaires utilise donc `brand-solid` (`#C9481A`, 4,8:1) et s'**éclaircit** vers `#E9591F` au survol, ce qui reste cohérent avec la DA (la bande CTA encre fait déjà éclaircir l'orange au survol). En dark, `brand-solid` = `#F0824B` avec du texte encre. `faint` (`#8F8F89`) ne doit jamais porter de texte : utiliser `label`.

## Composants

`ls components/` donne la carte : `layout/` (chrome du site), `primitives/`, `sections/`,
`visuals/`, `ui/`, plus un dossier par page. Ce que la lecture des fichiers n'apprend pas :

- **Le focus visible est global** (`:focus-visible` dans `globals.css`) : ne jamais ajouter
  d'anneau propre à un composant, on en cumulerait deux.
- **`Reveal` bascule `data-reveal` sur le nœud DOM, sans état React.** Ne pas y remettre de
  `setState` dans un effet : `react-hooks/set-state-in-effect` est active et le refuse.
- **`Button` a une échelle tactile d'abord** : `md` = 44 px et c'est le défaut, `sm` = 36 px
  est réservé aux zones denses non tactiles.
- **`LottieScene` est le seul lecteur Lottie**, et `MediaDropzone` le seul dépôt de fichier.

## La page 404

Elle n'existait pas : un lien mort affichait l'écran par défaut de Next, noir sur blanc,
sans en-tête ni pied de page et **sans un seul lien pour revenir** - une impasse à
l'endroit où le visiteur arrive par accident.

**Deux points d'entrée, une seule vue.** `NotFoundView` porte l'écran ;
`app/not-found.tsx` et `app/(site)/not-found.tsx` le rendent. Un visiteur ne doit pas voir
deux écrans différents selon la façon dont il s'est perdu.

| Fichier                    | Attrape                                            | Chrome                     |
| -------------------------- | -------------------------------------------------- | -------------------------- |
| `app/not-found.tsx`        | les URL qui ne correspondent à **aucune** route    | le pose lui-même           |
| `app/(site)/not-found.tsx` | les `notFound()` d'une page du site : slug inconnu | hérité du layout du groupe |

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

`PageCurtain` (dans le layout) intercepte les clics sur les liens internes, fait apparaître
un voile encre avec l'illustration Lottie en son centre, navigue écran couvert, puis lève le
voile pendant que la page entrante monte se mettre en place.

**Trois interdictions, chacune payée par une mesure** - le détail est dans le skill
`animations` :

- **Ne pas animer la page sortante.** Mesuré à 140 ms de blocage au clic, là où la
  réactivité compte le plus.
- **Ne pas revenir aux versions à crêtes arrondies ni aux traits en lentille.** Perçues
  comme sèches malgré un profil d'images propre.
- **Pas de `framer-motion`.** Tout porte sur `opacity` et `transform`, déjà composés par le
  GPU : la bibliothèque n'améliorerait pas la fluidité et ajouterait du poids.

Sans JavaScript et sous `prefers-reduced-motion`, les liens naviguent normalement.

Avant de toucher à `components/layout/page-curtain.tsx` ou de juger une animation à l'œil,
charger le skill **`animations`** : il porte les réglages, les quatre points qui maintiennent
la transition propre et la méthode de mesure image par image.

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

**Deux règles qui ne se négocient pas, et qui restent ici parce qu'une seule omission ne se
voit ni au build, ni au typecheck, ni à l'écran :**

- **Toute page publique passe par `pageMetadata()`** de `lib/seo.ts`, routes dynamiques
  comprises. Les deux qui composaient leurs métadonnées à la main y perdaient toutes les
  deux leur URL canonique.
- **Le balisage reprend mot pour mot ce que la page montre.** Un fil balisé plus profond que
  celui qu'on affiche, ou une FAQ balisée absente de l'écran, est un écart signalable.
- **Le titre de l'accueil porte le metier, pas la baseline**, et c'est une decision de
  referencement : `homeTitle` de `lib/site.ts`, lu par l'accueil **et** par le `default`
  du layout. « Heliara » est aussi le nom d'une autrice-compositrice presente sur
  Spotify, Apple Music et la presse : un moteur qui doit trancher entre deux entites du
  meme nom se sert d'abord de ce que la page dit d'elle-meme. La baseline reste le `h1`
  du hero.
- **Les villes d'intervention ne sont pas des adresses.** `serviceAreas` de `lib/site.ts`
  porte Montpellier, Béziers, Nîmes et Paris ; elles sont **affichées** - pied de page de
  chaque écran, `/contact`, `llms.txt` - avant d'être reprises en `areaServed`. Jamais de
  `PostalAddress` par ville, jamais de `LocalBusiness`, jamais de page « développeur web
  à Montpellier » : le studio n'a pas d'agence dans chacune, et un établissement déclaré
  qui n'existe pas est le premier motif de sanction en référencement local.

**`lib/origin.ts` est la source unique des URL absolues**, et tout passe par elle :
canonique, OpenGraph, plan du site, `robots.txt`, `llms.txt`, `@id` du graphe. Ne jamais
bâtir une URL absolue sur `site.url` en dur, ni deviner l'origine depuis l'en-tête `Host`.

Avant de toucher aux métadonnées, aux cartes de partage, au plan du site ou à `llms.txt`,
charger le skill **`referencement`** : il porte les trois couches, les pièges de satori, le
fonctionnement de `pnpm og` et ce que `robots.txt` ne dit délibérément pas.

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

| Fichier                                            | Contenu                           |
| -------------------------------------------------- | --------------------------------- |
| `favicon.ico` (16/32/48), `icon0.svg`, `icon1.png` | **pictogramme seul, recentré**    |
| `apple-icon.png` (180), les deux PNG du manifeste  | logo complet, mot-symbole compris |

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

## La prise de rendez-vous

Cal.com, sur `/contact`, en troisième voie après le formulaire et le téléphone - jamais
en bouton, jamais avant eux : le formulaire apporte le contexte du projet, un créneau
n'apporte qu'un créneau.

**Rien de Cal.com n'est chargé avant le clic, et c'est ce qui rend la page tenable.** Le
composant officiel contacte `app.cal.com` dès le rendu : l'adresse IP du visiteur partirait
chez un tiers sans qu'il ait rien demandé, sur un site qui ne pose aujourd'hui aucune
question de consentement. `BookingLink` est donc une ancre ordinaire vers l'adresse
publique - elle fonctionne sans JavaScript - dont le clic installe le chargeur officiel puis
ouvre la fenêtre. Mesuré : avant le clic, `localhost` est le seul hôte contacté.

**`lib/content/legal.ts` décrit ce traitement et doit rester d'accord avec le composant.**
Poser l'embed au rendu rendrait faux le paragraphe qui dit qu'aucun traceur n'est déposé à
l'arrivée - le même défaut que celui rencontré avec Umami.

Les couleurs passent par `cssVarsPerTheme`, en **valeurs littérales** : l'iframe est servie
par Cal.com et n'hérite d'aucune de nos variables CSS. C'est la seule duplication de la
palette du projet. `cal-brand` est bien pilotable ainsi - vérifié à l'écran, le jour
sélectionné du calendrier ressort en `#c9481a`.

Deux limites du plan gratuit, à ne pas confondre : la personnalisation **du compte** (page
Apparence de Cal.com) est réservée au plan Teams, et le badge « Propulsé par Cal.com » reste
affiché. La configuration de l'embed, elle, est côté navigateur et ne dépend d'aucun plan.

## La bulle WhatsApp

En bas à droite de **toutes** les pages publiques, 404 comprise, posée par `SiteChrome`
comme le pied de page. Elle déplie deux actions : écrire sur WhatsApp, ou appeler le
même numéro. Une seule des deux aurait tranché à la place du visiteur.

**Aucun JavaScript, et c'est le point de conception.** L'ouverture repose sur
`<details>` : le navigateur porte l'état, le clavier et l'annonce « développé / replié ».
Un composant client aurait ajouté du script sur chaque page du site pour deux liens qui
n'en demandent pas. Contrepartie assumée : le dépliant ne se referme ni au clic à côté
ni sur `Échap` - un second clic sur la bulle suffit, et les deux actions quittent la
page.

**Rien n'est chargé depuis Meta avant le clic** : deux ancres ordinaires, pas de widget
officiel, pas d'iframe. Même exigence que Cal.com, et pour la même raison -
`lib/content/legal.ts` l'affirme, et le poser autrement rendrait cette page fausse.

**Deux numéros sur le site, jamais sur le même écran.** `site.phone` est la ligne du
studio (`/contact`, mentions légales) ; `whatsapp.number` est le mobile professionnel,
le seul qui porte un compte WhatsApp, et la bulle est le seul endroit qui le montre.
Il s'écrit **en chiffres seuls, indicatif compris** : un `+`, un espace ou un `0` de
tête donnent une page d'erreur de WhatsApp et non une conversation.

**Habillage surface, glyphe vert, jamais `brand`.** Le geste orange de chaque écran est
déjà pris par le CTA primaire. Le vert reste cantonné au glyphe et vient de la palette
du projet (`success-text`), pas du vert de la marque WhatsApp - dont le contraste tombe
sous le seuil AA sur nos deux fonds. Vérifié à l'écran dans les deux thèmes.

`z-100` : au-dessus du contenu, sous l'en-tête collant (`z-200`), sous le menu plein
écran (`z-400`) qui doit la couvrir, loin sous le voile de transition (`z-900`).

**48 px collés au coin, et les rangées de filtres lui réservent la place.** Un élément
fixe traverse toutes les positions verticales au défilement : ce qu'il recouvre ne dépend
donc que de la **largeur de sa bande depuis le bord** - 64 px sur mobile, 72 px au-delà.
Mesuré avant correction : la dernière pastille de filtre de `/realisations` et
`/ressources` était recouverte sur 32 à 48 px, une cible de 53 px l'étant presque
entièrement. Les deux rangées portent donc un `pr-16 md:pr-12 2xl:pr-0` - au-delà de
1440 px la gouttière du conteneur suffit et les pastilles retrouvent le bord de la
grille. **Ne pas déplacer la bulle à gauche** : à 390 px, la bande gauche croise seize
petites cibles contre cinq à droite, mesuré.

Reste recouvert de 32 à 40 px, et assumé : « S'abonner » de la lettre d'information et
le lien « Heliara, une marque du groupe » du pied de page, tous deux larges de plus de
120 px. Et sur mobile, la pastille qui se trouve sous la bulle au repos - la rangée est
un défileur horizontal, un glissement la dégage.

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

**Tous les fichiers vivent dans `public/animated-illustrations/`**, et six illustrations
passent par **un seul composant**, `components/visuals/lottie-scene.tsx`. Ne pas réécrire un
lecteur ailleurs, ne pas poser un fichier à la racine de `public/`.

Deux règles qui coûtent cher à redécouvrir :

- **La taille se porte sur le conteneur, jamais sur le SVG** : `lottie-web` pose
  `width: 100%` en style inline sur le SVG qu'il crée, une règle CSS le visant serait perdue.
- **La variante `lottie_light` suffit**, et c'est voulu : les seules expressions de nos
  fichiers sont des formules de rebond élastique, que la DA interdit de toute façon.

Avant d'ajouter une scène ou de régler une existante, charger le skill **`animations`** : il
porte l'inventaire des sept fichiers, la politique de chargement `visible` / `eager` / `idle`
et les réglages relevés à la main.

## Architecture du dépôt

`ls` donne la structure. Les trois seuls emplacements qu'elle ne dit pas :

- `lib/content/*.ts` - contenu éditorial typé, désormais **repli et source d'amorçage**
  seulement pour les six collections administrables.
- `db/init/` - monté dans `/docker-entrypoint-initdb.d`, **exécuté une seule fois sur
  volume vierge**. Un fichier déjà joué ne se rejoue pas tout seul : `pnpm db:migrate`.
- `reference/claude-design/` - maquettes exportées, **hors du dépôt** (`.gitignore`),
  lecture seule, aucun code repris.

## Administration des contenus

Objectif : rendre modifiable depuis un back-office l'intégralité des contenus
aujourd'hui figés dans `lib/content/*.ts` - textes, projets et leurs images,
articles. Le plan détaillé, son avancement et les décisions actées vivent dans
**`docs/plan-admin.md`** : le consulter avant de reprendre le chantier.

### Infrastructure locale

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

### Quatre comptes base, deux pour l'application

| Compte       | Privilèges                          | Usage                             |
| ------------ | ----------------------------------- | --------------------------------- |
| `db_admin`   | `ALL`                               | maintenance. Jamais l'application |
| `db_migrate` | DDL, routines, DML                  | migrations, amorçage, déploiement |
| `app_read`   | `EXECUTE` sur les seules `pub_*`    | le site public                    |
| `app_write`  | `EXECUTE` sur toutes les procédures | l'administration                  |

**Aucun des deux comptes applicatifs n'a d'accès table**, en lecture comme en écriture :
vérifié sur la base en marche, et verrouillé par `tests/db/separation.test.ts`. Une injection
SQL réussie chez eux ne donne accès qu'à la surface des procédures existantes.

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
« 87 % de clients qui reviennent »), six membres d'équipe fictifs, et les **cinq auteurs
d'articles** qui portaient les mêmes noms. Restent en place, et restent à traiter : trois
témoignages signés de personnes nommées avec fonction et employeur, six autres dans les
fiches de réalisation, et vingt-quatre résultats chiffrés.

**Les articles sont signés du studio, et `authorRole` reste vide.** `studioByline` de
`lib/content/articles.ts` porte « L'équipe Heliara » ; les trois affichages sautent la
ligne de fonction quand elle manque, et `isStudioByline` fait que la page d'article
balise l'**organisation** par son `@id` au lieu d'un `Person` nommé « L'équipe Heliara ».
Les cinq noms inventés avaient survécu là après avoir été retirés de l'équipe : visibles
sous chaque article, dans les données structurées, et jusque dans le flux RSS. Une
signature nommée redevient possible le jour où quelqu'un écrit **et assume** son texte.

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

## Administration : l'interface

`app/admin/layout.tsx` ne porte **pas** de garde : il couvre aussi `/admin/login`, qui doit
rester atteignable sans session. La garde vit dans `app/admin/(protected)/layout.tsx`.

**Quatre règles qui ne se négocient pas**, parce qu'une seule omission ouvre un trou que
rien ne signale :

- **L'autorisation est refaite dans chaque action serveur.** Une action serveur est une
  route publique : le layout protège le rendu des pages, pas les actions. Toutes commencent
  par `requireSession()`, sans exception, et rejouent leur schéma zod.
- **Valider le texte riche, jamais le nettoyer.** Un nettoyeur transforme ce qu'il ne
  comprend pas et laisse passer ce qu'il a mal compris. Le pire cas doit être un refus.
- **Le fichier ne traverse jamais l'application.** Un dépôt d'image passe par une URL
  présignée : l'action signe, le navigateur envoie l'octet au stockage, une seconde action
  confirme. Seule exception, `seedMedia()` de l'amorçage.
- **`pnpm db:migrate` après tout `DROP PROCEDURE`.** Les privilèges vivent dans
  `mysql.procs_priv` et rien ne les restaure : rejouer un fichier de procédures à la main
  révoque silencieusement l'accès des comptes applicatifs.

Six collections sont administrables : **Réalisations**, **Articles**, **Expertises**,
**Références clientes**, **Équipe** et **Témoignages**. C'est tout ce qui change à un rythme
humain ; ce qui reste dans `lib/content/*.ts` a été écarté volontairement, les raisons sont
dans `docs/plan-admin.md`.

**Corriger un contenu administrable dans `lib/content/*.ts` ne change rien au site** :
ces fichiers ne sont plus que le repli et la source d'amorçage. `pnpm db:seed` ne
rattrapera pas la correction non plus - il est idempotent et laisse intacte toute entrée
dont le slug existe déjà. Deux scripts comblent ce trou, et **n'agissent que sur les
slugs qu'on leur nomme** : `pnpm db:resync-expertises` pour une fiche d'expertise,
`pnpm db:resync-article-authors` pour la signature d'un article - ce dernier relit toutes
les autres valeurs en base et les repasse telles quelles, pour ne pas défaire ce qui a
été retouché dans l'administration.

Avant de toucher à `app/admin/**`, `components/admin/**`, `lib/db/**` ou aux procédures
d'écriture, charger le skill **`admin-contenus`** : il porte le moule des éditeurs, les
conventions SQL, les particularités de chaque collection et les défauts déjà rencontrés.
