# Plan d'action - administration des contenus

Objectif : rendre modifiable l'intégralité des contenus du site (textes, projets et
leurs images, articles) depuis une interface d'administration, sur une base MariaDB
accédée **exclusivement par procédures stockées** et un stockage objet MinIO.

État de départ : site 100 % statique, contenu en dur dans `lib/content/*.ts`, 24 commits,
36 pages prérendues.

## Avancement

Ce tableau est la première chose à lire pour reprendre le chantier. « Fait » signifie
éprouvé contre l'infrastructure en marche, pas seulement écrit.

| Étape                                       | État                                           |
| ------------------------------------------- | ---------------------------------------------- |
| 0 - Infrastructure                          | **fait**                                       |
| 1 - Schéma et procédures d'authentification | **fait**                                       |
| 2 - Couche d'accès                          | **fait**                                       |
| 3 - Authentification applicative            | **fait**                                       |
| 4 - Médias                                  | **fait**, dépôt par URL présignée              |
| 5 - Réalisations                            | **fait**, aperçu de brouillon compris          |
| 6 - Bascule du site public                  | **fait** pour les réalisations et les articles |
| 7 - Articles                                | **fait**, comptage de vues compris             |
| 8 - Expertises                              | **fait**, familles et nav comprises            |
| 9 - Interface de saisie                     | **fait** pour les trois collections            |
| 10 - Références clientes                    | **fait**, logos poussés vers le stockage       |
| 11 - Équipe                                 | **fait**, les deux pages branchées             |
| 12 - Témoignages                            | **fait**, section d'accueil rétablie           |
| 13 - Le reste des contenus                  | et il n'en reste presque rien : voir ci-dessous |

### Étape 11 - l'équipe

**Deux décisions actées avec l'auteur, à ne pas rediscuter :**

- **La teinte de la pastille est déduite de la position** - 1re carte orange, 2e bleue,
  3e et suivantes encre. Il n'y a donc **aucune colonne `accent`** : la DA n'autorise
  qu'un geste orange par écran, une seule répartition est correcte, et un champ dont une
  seule valeur est juste n'est pas un réglage. Conséquence : réordonner change les
  couleurs, et l'écran le dit en clair, à côté de chaque ligne comme en tête de liste.
- **Les personnes seulement.** Le titre de section, le manifeste et les convictions
  restent dans `lib/content/team.ts`. Les rendre administrables demanderait une table de
  réglages clé / valeur, forme nouvelle qui appellerait ensuite tous les textes fixes du
  site - une porte à n'ouvrir qu'avec une raison.

**Tout est en place et éprouvé contre l'infrastructure en marche :**

- `db/init/18-schema-team.sql`, `db/init/19-proc-team.sql`, neuf procédures, privilèges
  vérifiés - `app_read` n'a que `pub_list_team_members`.
- `lib/schemas/team.ts`, `lib/db/team.ts`, `lib/db/public-team.ts`,
  `app/admin/(protected)/equipe/{actions.ts,page.tsx}`,
  `components/admin/team-board.tsx`, entrée de nav dans `admin-shell.tsx`.
- `/a-propos` et `/contact` lisent la base par `listPublicTeam()`, avec repli statique.
- `seedTeam()` dans `scripts/db-seed.ts` : trois personnes, six portraits poussés vers
  le stockage, publiées d'emblée puisqu'elles s'affichaient déjà.
- `tests/db/team.test.ts` : 12 tests d'intégration.
- Vérifié à l'écran par CDP, **dans les deux thèmes**, sur les deux pages publiques et
  sur l'écran d'administration. Le rendu public est identique au statique, portraits
  servis depuis MinIO à travers l'optimiseur d'images (200, pas 400).

**Ce que cette tranche a appris :**

- **Les spécialités se répartissent par `member_id`**, jamais en suivant l'ordre des
  personnes : l'ordre seul ne dit pas où finit la liste de l'une. Piège rencontré,
  corrigé, et désormais verrouillé par un test à deux personnes de longueurs inégales.
- **`accentOfIndex` vit dans `lib/content/team.ts`** et non dans la couche d'accès :
  trois appelants la partagent - lecture publique, écran d'administration, données
  statiques. C'est une règle de la DA, pas une règle de lecture.
- **Les deux surfaces d'aperçu sont figées en dur** (`#fafaf9`, `#101012`). `bg-page`
  suivrait le thème de l'administration : en sombre, l'aperçu du portrait clair se
  poserait sur l'encre, c'est-à-dire montrerait l'inverse de ce qu'on vient vérifier.
  Le libellé, lui, est **hors** du cadre, sur la surface de l'écran : à l'intérieur, il
  aurait fallu deux couleurs figées elles aussi, dont l'une devenait illisible.
- **`content-start` sur la colonne d'aperçus.** Sans lui, ses rangées s'étirent à la
  hauteur des champs voisins et les deux cadres deviennent des bandes verticales avec le
  portrait tassé en haut. Mesuré à l'écran, invisible à la lecture du code - c'est le
  même piège que dans `Field` et `Fieldset`.

### Étape 12 - les témoignages

**Une collection administrable pour un contenu vide, et c'est la raison même.** Le
fichier statique porte un tableau vide : ses trois verbatims inventés - attribués à des
personnes nommées avec leur fonction et leur employeur - ont été retirés, et la section
d'accueil avec eux. Tant qu'elle vivait dans le dépôt, un client qui accepte d'être cité
demandait un commit et un déploiement. C'est exactement ce qu'un back-office doit retirer.

**La trace de l'accord est le champ qui compte, pas le verbatim.** `consent_at` et
`consent_note` - la date de la validation écrite, et où cet écrit se trouve - sont exigées
par `publish_testimonial`. Deux colonnes plutôt qu'une case à cocher : une case répond
« oui » sans dire quand ni où, ce qui ne vaut rien le jour où un auteur demande le retrait
de sa citation. Aucune base ne peut vérifier qu'un accord existe ; elle peut refuser de
publier tant qu'on ne l'a pas déclaré.

**La section d'accueil est rétablie et conditionnée à son contenu.** `Testimonials` rend
`null` sur une liste vide, donc l'accueil est inchangé aujourd'hui - il enchaîne les
garanties sur le CTA final, comme avant. Le composant est celui d'origine, repris tel quel
dans l'historique plutôt que réinventé, et il reprend sa place dans l'arc que
l'Architecture UX décrit : preuve, **pairs**, demande.

Ce que cette tranche a appris :

- **Le repli statique est vide, et c'est le bon comportement.** Une base muette fait
  disparaître la section au lieu d'en servir une version périmée. C'est le seul contenu du
  site où le repli ne doit rien ressusciter.
- **Les chevrons ne sont pas stockés.** La vue les pose. Les laisser à la saisie ferait
  dépendre le rendu de ce que la personne a recopié depuis sa messagerie - guillemets
  droits, courbes ou absents selon le passage. Et ils portent des **espaces insécables** :
  avec des espaces ordinaires, le chevron fermant passait seul à la ligne, mesuré à
  l'écran sur la carte du milieu.
- **Modifier un témoignage publié ne le dépublie pas.** Une correction de coquille ne doit
  pas retirer une citation du site. La conséquence - l'accord porte sur le texte validé -
  est portée par le journal d'audit et par le rappel de l'écran, pas par une dépublication
  automatique qui ferait disparaître la section sans qu'on comprenne pourquoi.
- **Aucune clé unique sur le nom**, à la différence des références et de l'équipe : la même
  personne peut témoigner deux fois, sur deux projets.
- **Un conteneur rendu vide coûte une rangée de grille.** Le compteur de caractères ne se
  montre qu'à 70 % de la limite, mais sa boîte ajoutait un blanc sous chaque citation
  courte. Le seuil est donc répété à l'appelant, ce que le commentaire assume.
- `tests/db/separation.test.ts` couvre désormais **aussi** l'équipe et les témoignages :
  leurs procédures d'écriture et les deux `list_*` qui montrent les brouillons sont
  refusées à `app_read`. Le plan l'affirmait pour l'équipe sans qu'aucun test ne le tienne.

### Ce qu'il reste, et pourquoi c'est presque rien

Le tableau ci-dessus est complet : **tout ce qui change à un rythme humain est
administrable.** Restent dans `lib/content/*.ts` la méthode, les engagements, les
principes, le groupe et les textes de sections - décidés non administrables ci-dessous -
plus deux points ouverts qui ne sont pas du contenu :

- **Les comptes**, entrée de nav marquée « à venir ». La question à trancher d'abord est
  celle des rôles : un seul, ou éditeur / administrateur ?
- **Le téléphone public du studio**, encore un numéro de remplissage dans `lib/site.ts`,
  affiché tel quel sur `/contact`. Décision, pas développement.

**Ce qui ne sera pas rendu administrable, et pourquoi :**

- **Les sections légales.** Une page qui engage juridiquement gagne à rester relue et
  versionnée : le dépôt garde la trace de qui a écrit quoi et quand. Un champ modifiable
  en deux clics sur le seul contenu du site qui expose échangerait une commodité rare
  contre un risque permanent.
- **Méthode, engagements, principes, groupe.** Ils ne changent quasi jamais. Le coût
  d'un écran par contenu ne se rembourse pas.

Les **témoignages** étaient le dernier qui bougeait à un rythme humain, quand un client
accepte d'être cité : ils sont faits. Il ne reste donc rien à considérer dans cette liste.

Ce qui a été vérifié contre la base en marche, et n'a pas à l'être deux fois :

- **La séparation lecture / écriture.** `app_read` se voit refuser toute procédure
  d'écriture, `list_case_studies` et `list_articles` - celles qui montrent les
  brouillons - `get_session`, `create_user`, `list_audit`, ainsi que `SELECT`,
  `UPDATE` et `CREATE` sur toute table. Seule exception : `pub_count_article_view`,
  qui ne peut qu'incrémenter deux compteurs.
- **La propagation.** Publication dans l'administration, puis apparition sur le site
  public sans redémarrage ni rebuild : 6 fiches avant, 7 après.
- **Le parcours d'administration complet** en navigateur : connexion, création,
  édition par onglets, dépôt d'image, aperçu de brouillon, publication.
- **Le comptage de vues** : total et ligne du jour incrémentés ensemble, sans effet
  sur un brouillon ni sur un slug inconnu, et emportés avec l'article supprimé.

Constats acquis, à ne pas redécouvrir :

- `SQL SECURITY DEFINER` est **la** condition du modèle. En `INVOKER`, la procédure
  s'exécute avec les droits de l'appelant, donc un compte sans droit de table échoue
  à l'intérieur même de la procédure.
- `DROP PROCEDURE` emporte ses privilèges : `pnpm db:migrate` rejoue toujours les
  grants après les procédures.
- `UUID_v7()` n'existe qu'à partir de MariaDB 11.7, l'image est en 11.4 LTS.
  `GenerateKey()` assemble donc le v7 à la main. Ne pas « simplifier ».
- L'entrypoint MariaDB ne substitue pas les variables d'environnement dans les
  fichiers `.sql`. D'où `01-users.sh`, un script.
- `LIMIT` n'accepte qu'un littéral ou une variable, jamais une expression.
- `LEAVE` exige un bloc étiqueté.
- `IFNULL(STR_TO_DATE(...), colonne)` ne protège de rien en mode strict : la forme
  se vérifie par une expression régulière avant la conversion.
- Next analyse `revalidate` statiquement : ce doit être un littéral.
- Next 16 pose un verrou par répertoire de build : `pnpm dev:both` donne un
  `NEXT_DIST_DIR` à chaque processus.

## Décisions actées

| Sujet                           | Choix                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Périmètre de la première étape  | infrastructure + authentification + collection Réalisations, images comprises |
| Lecture par le site public      | cache par tag, invalidé à l'écriture. Les pages restent prérendues            |
| Premier compte administrateur   | commande `pnpm admin:create`, aucun identifiant dans le dépôt                 |
| Accès base depuis l'application | utilisateur `app_exec`, `EXECUTE` seul, aucun accès table                     |
| Hachage des mots de passe       | argon2id côté application, la base ne voit jamais de clair                    |
| Jetons de session               | aléatoire 32 octets, seul le SHA-256 est stocké                               |

## Conventions non négociables

Elles viennent du projet de référence et s'appliquent à tout le SQL.

- **Trois comptes base** : `db_admin` (ALL, maintenance, jamais l'application), `db_migrate`
  (DDL, routines, DML, déploiement), `app_exec` (`EXECUTE` seul, l'application).
- **Procédures stockées uniquement.** Aucune requête SQL écrite côté application, ni en
  lecture ni en écriture. Une nouvelle donnée à lire suppose une nouvelle procédure.
- **Identifiants en `BINARY(16)`**, en entrée comme en sortie : l'API SQL reste agnostique
  du langage appelant, chaque client convertit de son côté. `GenerateKey()` pour les
  identifiants créés par la base.
- **Dates en `BIGINT`**, toujours des `UNIX_TIMESTAMP()`. Jamais de `DATETIME`.
- **Nommage** : `p_` pour les paramètres, `v_` pour les variables locales, colonnes en
  `snake_case`.
- **Transactions et remontée d'erreurs** : `DECLARE EXIT HANDLER FOR SQLEXCEPTION` avec
  `ROLLBACK` puis `RESIGNAL`, `SIGNAL SQLSTATE '45000'` pour les erreurs métier.
- **Journal d'audit** sur toute écriture : qui, quoi, quand, ancienne et nouvelle valeur.

## Étape 0 - Infrastructure

Fait. Le détail opérationnel - ports, cycle de vie de `db/init`, comptes, politique du
seau - est consigné dans `CLAUDE.md`, section « Administration des contenus ».

```text
docker-compose.yml
  mariadb      11.4 LTS, publiée sur 3307, volume db_data, healthcheck
  minio        API 9000, console 9001, volume minio_data, healthcheck
  minio-init   crée le seau et ouvre `public/` en lecture anonyme, puis sort

db/init/     monté dans /docker-entrypoint-initdb.d, exécuté une fois sur volume vierge
  01-users.sh        les trois comptes et leurs privilèges
  02-functions.sql   GenerateKey(), Uuid2Bin(), Bin2Uuid(), Slugify()

package.json   pnpm db:up / db:down / db:reset / db:shell / db:logs
.env.example   toutes les variables attendues, sans valeur. `.env` hors du dépôt
```

## Étape 1 - Schéma et procédures d'authentification

`db/init/03-schema.sql`

- `user` : identifiants, `password_hash`, rôle, `email_verified`, jetons de vérification et
  de réinitialisation (hachés), `suspended_at`, horodatages Unix.
- `session` : `token_hash CHAR(64)`, `expires_at`, adresse et agent, purge à l'expiration.
- `audit_log` : acteur, action, ressource, ancienne et nouvelle valeur en JSON, adresse.

`db/init/04-proc-auth.sql` : `create_user`, `get_user_for_login`, `create_session`,
`get_session`, `delete_session`, `delete_user_sessions`, `create_password_reset`,
`reset_password`, plus l'audit associé.

## Étape 2 - Couche d'accès

| Fichier           | Rôle                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `lib/db/pool.ts`  | `mysql2/promise`, connecté en `app_exec`, pool unique réutilisé                                                  |
| `lib/db/call.ts`  | `call('proc', [...])`, gère les jeux de résultats multiples, traduit les `SQLSTATE 45000` en erreur métier typée |
| `lib/db/id.ts`    | l'utilitaire demandé : UUID ↔ `BINARY(16)`, hex ↔ binaire, génération                                            |
| `lib/db/cases.ts` | un module typé par domaine, qui n'appelle que des procédures                                                     |

Les types exposés reprennent exactement ceux de `lib/content/cases.ts` : les pages publiques
ne changent pas de forme, seule la source change.

## Étape 3 - Authentification applicative

- `lib/auth/password.ts` : argon2id via `@node-rs/argon2`.
- `lib/auth/session.ts` : création du jeton, hachage SHA-256, pose et lecture du cookie
  `httpOnly` `secure` `sameSite=lax`.
- `proxy.ts` : **contrôle optimiste seulement**. La documentation Next 16 est explicite,
  le proxy ne doit pas porter la gestion de session. Il redirige vers la connexion en
  l'absence de cookie, rien de plus.
- **L'autorisation réelle vit dans la couche d'accès** : `app/admin/layout.tsx` vérifie la
  session en base, et chaque action serveur la revérifie avant d'appeler une procédure
  d'écriture. Une action serveur est une route publique.
- `scripts/admin-create.ts` et l'entrée `pnpm admin:create`.

## Étape 4 - Médias

- Table `media` : clé d'objet, seau, type MIME, poids, dimensions, texte alternatif, nom
  d'origine, empreinte, auteur, horodatage.
- Procédures `create_media`, `get_media`, `delete_media`, `list_media`.
- `lib/s3.ts` : client MinIO, URL présignée en écriture, URL publique en lecture.
- Téléversement par **URL présignée** : le navigateur envoie directement à MinIO, l'action
  serveur ne fait que signer puis enregistrer les métadonnées. Le fichier ne traverse pas
  l'application.
- Validation : type MIME et poids maximum vérifiés à la signature **et** à l'enregistrement.

## Étape 5 - Réalisations

Modèle de données, une table par collection enfant plutôt qu'un JSON opaque, pour que
chaque champ reste requêtable et contraignable :

```
case_study      slug, secteur, année, badge, titre, titre de hero, teaser, résumé,
                chiffre, mesure, halo, accent, mise en avant, carte large,
                libellé de résultats, témoignage (verbatim, nom, rôle, initiales),
                média de hero, position, statut, date de publication
case_chapter    numéro, titre, corps, encadré facultatif, position
case_result     valeur, libellé, position
case_meta       libellé, valeur, position
case_lesson     texte, position
case_media      média, rôle (hero ou galerie), légende, position
```

Procédures : `list_case_studies`, `get_case_study_full` (jeux de résultats multiples, un
seul appel par page), `create_case_study`, `update_case_study`, `delete_case_study`,
`publish_case_study`, `reorder_case_studies`, et `set_case_chapters` /
`set_case_results` / `set_case_meta` / `set_case_lessons` / `set_case_media` qui
remplacent une collection enfant en une transaction, à partir d'un tableau JSON lu par
`JSON_TABLE` (MariaDB 10.6+).

Écrans : `/admin/login`, `/admin` (tableau de bord), `/admin/realisations` (liste,
réordonnancement, statut), `/admin/realisations/[id]` (édition complète, collections
enfants, téléversement et galerie).

Formulaires en zod et react-hook-form, schéma partagé avec l'action serveur qui le rejoue,
comme le formulaire de contact.

## Étape 6 - Bascule du site public

- `lib/content/cases.ts` devient une lecture base, mise en cache et étiquetée `cases`.
- Chaque écriture d'administration invalide le tag concerné.
- `generateStaticParams` lit la base : les études de cas restent prérendues.
- Repli explicite si la base est injoignable au build, pour ne pas casser un déploiement.

## Étape 9 - Interface de saisie

Les trois collections étaient administrables et pénibles à administrer. Le défaut
n'était pas le nombre de champs, c'était leur **opacité** et un découpage qui suivait
la plomberie plutôt que le travail.

Ce qui a changé, et pourquoi - le détail des pièces est dans `CLAUDE.md`, section
« Administration », sous-section « Interface » :

| Défaut constaté                                                                       | Remède                                                                     |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Un onglet par procédure d'écriture, donc trente champs d'affilée dans le premier      | `StepEditor` : des étapes qui suivent le récit, et l'état hissé au-dessus  |
| « Résumé court » et « Résumé long » indistinguables sans savoir lequel atterrit où    | `placement.tsx` : le bloc du site dessiné à côté du champ                  |
| La base disait ce qu'il manquait pour publier **après** le clic, en message d'erreur  | `PublishPanel` : les exigences listées avant, chacune liée à son étape     |
| Trois en-têtes d'éditeur recopiés, dont trois comportements de suppression différents | `EditorHeader`                                                             |
| Trois créations de trois formes : deux dialogues divergents et un formulaire en ligne | `CreateDialog` + `SlugField`, et `slugify` sorti dans `lib/slug.ts`        |
| `data-selected` visé par les barres d'onglets, attribut que Base UI ne pose pas       | `data-active` - aucun onglet actif n'était marqué, et rien ne le signalait |
| Une erreur sur le huitième bloc d'un article ne s'affichait qu'en tête de formulaire  | `anyErrorAt` sur les collections, message sous la ligne concernée          |

Trois constats à ne pas redécouvrir :

- **Un sélecteur Tailwind qui ne correspond à rien ne produit ni erreur ni
  avertissement.** `data-selected:` était mort dans les quatre barres d'onglets de
  l'administration ; cela ne se voit qu'en relevant les attributs dans le DOM.
- **Hisser l'état hors des panneaux est ce qui autorise le découpage libre.** Tant
  qu'un onglet était un formulaire, le découpage des écrans était dicté par les
  procédures : `update_case_study` prend la fiche entière, donc tous ses champs
  devaient tenir dans un seul écran. Voir `components/admin/editor-state.ts`.
- **Les aperçus de placement sont calculés sur la saisie, l'état des étapes sur les
  données enregistrées.** Le premier doit suivre la frappe, le second non : la
  publication interroge la base, et une pastille qui verdirait à la frappe promettrait
  ce que la base refuserait encore.

## Étapes suivantes

Cette liste annonçait : équipe, témoignages, clients, chiffres, méthode et engagements,
groupe et marques, sections légales, textes de pages. **Les trois premiers sont faits ; les
suivants ont été écartés**, chacun pour la raison écrite plus haut - les pages légales
gagnent à rester relues et versionnées, et le reste ne change quasi jamais.

Ce qui reste est donc hors du contenu : les **comptes** et leurs rôles, et les quatre
points ci-dessous.

## Points à confirmer en cours de route

- Rôles d'administration : un seul rôle, ou une distinction éditeur / administrateur ?
- Faut-il un aperçu des brouillons sur le site public, par lien signé ?
- Variantes d'images générées au téléversement, ou redimensionnement à la demande ?
- Conservation des médias supprimés : suppression immédiate dans MinIO, ou corbeille ?
