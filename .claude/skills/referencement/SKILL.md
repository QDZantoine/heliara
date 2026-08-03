---
name: referencement
description: Referencement et referencement generatif du site Heliara : pageMetadata et les URL canoniques, les donnees structurees schema.org, les cartes de partage OpenGraph et pnpm og, robots.txt, sitemap.ts, llms.txt et SITE_ORIGIN. A charger avant de toucher aux metadonnees, aux cartes de partage ou au plan du site.
---

<!--
  Extrait de CLAUDE.md, ou ces sections etaient residentes a chaque session pour un
  contenu qui ne sert qu'a une tache precise. Le fichier racine garde les
  interdictions dures et un pointeur vers ici.
-->

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
