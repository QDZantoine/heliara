---
name: admin-contenus
description: Le back-office Heliara : les six collections administrables (realisations, articles, expertises, references clientes, equipe, temoignages), l'editeur a etapes, le depot d'images par URL presignee, le texte riche valide, l'apercu de brouillon et le comptage de vues. A charger avant de toucher a app/admin/**, components/admin/**, lib/db/** ou aux procedures stockees d'ecriture.
---

<!--
  Extrait de CLAUDE.md, ou ces sections etaient residentes a chaque session pour un
  contenu qui ne sert qu'a une tache precise. Le fichier racine garde les
  interdictions dures et un pointeur vers ici.
-->

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
pnpm db:export [d]  # exporte le contenu réel : SQL + objets du stockage + manifeste
pnpm db:import <d>  # rejoue un export ailleurs, et vérifie ses comptes
pnpm db:resync-expertises <slug>...   # repousse en base la fiche d'un service
pnpm db:import-cases <fichier.json>   # importe des réalisations rédigées hors de l'outil
```

**`pnpm db:seed` amorce depuis le dépôt, `pnpm db:export` transporte le réel. Ne pas les
confondre : c'est la différence entre une production plausible et une production fidèle.**
Le premier ne connaît que `lib/content/*.ts` et `public/` ; tout ce qui est passé par
l'administration - images de tête déposées, textes corrigés, témoignages - lui est
invisible. Mesuré : cinq des neuf réalisations ont une couverture qui n'existe pas dans le
dépôt, et `db:seed` les recréerait sans image. Le repli sur le croquis fait que rien ne
casse et que personne ne le voit.

Deux pièges de cet outillage, tous deux trouvés en le construisant :

- **`--hex-blob` est la condition pour que le dump soit juste.** Les identifiants sont des
  `BINARY(16)` : sans elle, le fichier mélange texte et octets bruts, et le relire en UTF-8
  remplace chaque octet invalide par U+FFFD. Des clés primaires distinctes deviennent alors
  identiques, `REPLACE INTO` écrase les lignes l'une après l'autre, et **neuf réalisations
  arrivent à deux** - sans qu'aucune erreur ne soit levée.
- **Un import partiel ne lève rien.** Les contraintes sont satisfaites, les instructions
  passent, il manque simplement des lignes. D'où le manifeste de comptes par table et sa
  vérification à l'import, qui est ce qui a rendu le défaut ci-dessus visible.

Le schéma et les procédures ne sont pas exportés - ils viennent du dépôt, par
`pnpm db:migrate`, joué avant l'import. Ni les comptes ni les sessions non plus, et les
colonnes d'auteur sont remises à `NULL` : un hash de développement n'a rien à faire en
production.

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

Six collections sont administrables : **Réalisations**, **Articles**, **Expertises**,
**Références clientes**, **Équipe** et **Témoignages**. C'est **tout ce qui change à un
rythme humain** : ce qui reste dans `lib/content/*.ts` - méthode, engagements, principes,
groupe, textes de sections, pages légales - a été écarté volontairement, pour les raisons
consignées dans `docs/plan-admin.md`.

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

### L'équipe

Les personnes de `/a-propos`, dont les associés que `/contact` présente, à `/admin/equipe`.
Un tableau comme les références, pas l'éditeur à étapes.

**Une seule table pour deux listes.** Le contenu statique en portait deux, `team` étant
`[...partners, une personne de plus]`. Les dédoubler en base rendrait possible qu'une
personne figure dans l'une et pas l'autre, ou deux fois avec des textes divergents.
`is_partner` distingue les usages sans dupliquer la personne, et les deux pages lisent le
**même appel** - `listPublicTeam()` rend `{ all, partners }`.

**Ce drapeau engage.** `/contact` promet une réponse d'un associé sous 48 heures et
affiche cette liste : le lever pour quelqu'un qui ne répond pas aux messages rendrait la
promesse fausse. Ce n'est pas un rang honorifique, d'où le rappel à côté de
l'interrupteur.

**La teinte de la pastille est déduite de la position**, et il n'existe **aucune colonne
`accent`** : 1re personne orange, 2e bleue, 3e et suivantes encre. La DA n'autorise qu'un
geste orange par écran, donc sur une grille de cartes une seule répartition est correcte,
et un champ dont une seule valeur est juste n'est pas un réglage. `accentOfIndex` vit dans
`lib/content/team.ts` - c'est une règle de la DA, pas une règle de lecture - et trois
appelants la partagent. Conséquence assumée : **réordonner change les couleurs**, ce que
l'écran écrit en tête de liste et à côté de chaque ligne.

**La publication exige les deux portraits**, en plus des initiales et du parcours. Aucun
fichier ne tient sur les deux thèmes : un détourage sur blanc posé sur une carte encre
devient un pavé lumineux. Publier sans le portrait sombre laisse un trou qu'on ne voit
qu'en basculant le thème, c'est-à-dire jamais avant un visiteur - c'est la seule exigence
de ce genre du projet.

**D'où les deux aperçus côte à côte dans l'écran**, chacun sur la surface figée en dur du
thème auquel il est destiné (`#fafaf9`, `#101012`), au cadrage exact de la carte. `bg-page`
suivrait le thème de l'administration : en sombre, l'aperçu du portrait clair se poserait
sur l'encre, montrant l'inverse de ce qu'on vient vérifier. Le libellé « clair » / « sombre »
est **hors** du cadre, sur la surface de l'écran : à l'intérieur, il aurait fallu deux
couleurs figées elles aussi, dont l'une devenait illisible.

**Aucun champ de texte alternatif**, et c'est le bon partage : la carte rend ces images en
`alt=""`, le nom de la personne étant écrit juste dessous. Une alternative le répéterait à
voix haute.

**Les spécialités se répartissent par `member_id`**, jamais en suivant l'ordre des
personnes. Elles arrivent dans un second jeu de résultats, et l'ordre seul ne dit pas où
finit la liste de l'une. Le défaut a été rencontré ; `tests/db/team.test.ts` le verrouille
avec deux personnes de longueurs inégales.

Le titre de section, le manifeste et les convictions **restent dans `lib/content/team.ts`**.
Les rendre administrables demanderait une table de réglages clé / valeur, forme nouvelle
qui appellerait ensuite tous les textes fixes du site.

### Les témoignages

La section « Ils en parlent mieux que nous » de l'accueil, à `/admin/temoignages`. Un
tableau, comme les références et l'équipe.

**Le champ qui compte n'est pas le verbatim, c'est la trace de l'accord.** `consent_at`
et `consent_note` - la date de la validation écrite, et où cet écrit se trouve - sont
exigées par `publish_testimonial`. Deux colonnes plutôt qu'une case à cocher : une case
répond « oui » sans dire quand ni où, ce qui ne vaut rien le jour où un auteur demande le
retrait de sa citation. Aucune base ne peut vérifier qu'un accord existe ; elle peut
refuser de publier tant qu'on ne l'a pas déclaré. Ni l'une ni l'autre ne sort de
`pub_list_testimonials` : ce sont des données internes.

**La section ne se rend pas quand la liste est vide**, et c'est ce qui a permis de la
rétablir. Elle affichait trois verbatims inventés, attribués à des personnes nommées avec
leur fonction et leur employeur ; elle a été retirée avec eux. Le composant est celui
d'origine, repris dans l'historique, et il reprend sa place dans l'arc de l'accueil :
preuve, **pairs**, demande. Tant qu'aucune citation n'est en ligne, l'accueil est
identique à ce qu'il était.

**Le repli statique est vide, et c'est voulu.** Une base muette fait disparaître la
section au lieu d'en servir une version périmée : c'est le seul contenu du site où le
repli ne doit rien ressusciter.

**Les chevrons sont posés par la vue, jamais stockés**, et avec des **espaces
insécables**. Les laisser à la saisie ferait dépendre le rendu de ce que la personne a
recopié depuis sa messagerie - guillemets droits, courbes ou absents selon le passage. Et
avec des espaces ordinaires, le chevron fermant passait seul à la ligne, mesuré à l'écran
sur la carte du milieu.

**Modifier un témoignage publié ne le dépublie pas.** Une correction de coquille ne doit
pas retirer une citation du site. La conséquence - l'accord porte sur le texte tel qu'il
était validé - est portée par le journal d'audit, qui garde l'ancienne valeur en entier,
et par le rappel de l'écran. Une dépublication automatique ferait disparaître la section
sans que personne comprenne pourquoi.

**Aucune clé unique sur le nom**, à la différence des références clientes et de l'équipe :
la même personne peut témoigner deux fois, sur deux projets, et rien ne permet de dire que
la seconde est une erreur de saisie.

Pas d'amorçage : il n'y a rien à amorcer, et c'est le but.

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
