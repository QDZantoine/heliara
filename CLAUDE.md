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

Dark mode : classe `.dark` sur `<html>`, pilotée par `next-themes`.

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
