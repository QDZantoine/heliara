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
| 11 - Équipe                                 | **en cours**, voir ci-dessous                  |
| 12 - Le reste des contenus                  | à faire, et une partie ne le sera pas          |

### Étape 11 - l'équipe : où reprendre

**Deux décisions actées avec l'auteur, à ne pas rediscuter :**

- **La teinte de la pastille est déduite de la position** - 1re carte orange, 2e bleue,
  3e et suivantes encre. Il n'y a donc **aucune colonne `accent`** : la DA n'autorise
  qu'un geste orange par écran, une seule répartition est correcte, et un champ dont une
  seule valeur est juste n'est pas un réglage. Conséquence : réordonner change les
  couleurs, l'écran doit le dire.
- **Les personnes seulement.** Le titre de section, le manifeste et les convictions
  restent dans `lib/content/team.ts`. Les rendre administrables demanderait une table de
  réglages clé / valeur, forme nouvelle qui appellerait ensuite tous les textes fixes du
  site - une porte à n'ouvrir qu'avec une raison.

**Fait, et éprouvé contre la base en marche :**

- `db/init/18-schema-team.sql` : `team_member` et `team_member_skill`.
- `db/init/19-proc-team.sql` : neuf procédures.
- Privilèges accordés et vérifiés : `app_read` n'a que `pub_list_team_members`.
- `lib/schemas/team.ts`, `lib/db/team.ts`, `lib/db/public-team.ts`.
- `app/admin/(protected)/equipe/actions.ts`.

**Reste à faire, dans cet ordre :**

1. L'écran, sur le moule de `components/admin/client-board.tsx` - un tableau et non
   l'éditeur à étapes. **Deux dépôts de portrait par ligne**, plus les spécialités en
   collection. C'est le plus gros morceau.
2. L'entrée de nav dans `components/admin/admin-shell.tsx`, et
   `app/admin/(protected)/equipe/page.tsx`.
3. Le branchement de `/a-propos` (tout le monde) et `/contact` (les associés seuls),
   par `listPublicTeam()`. Les deux listes sortent du même appel : c'est ce qui garantit
   qu'une personne ne peut pas figurer dans l'une avec un texte et dans l'autre avec un
   autre.
4. L'amorçage des six portraits, sur le moule de `seedClients()` dans
   `scripts/db-seed.ts` - `seedMedia()` fait déjà le dépôt.
5. Tests, et vérification à l'écran **dans les deux thèmes** : c'est tout l'objet des
   deux portraits.

**Un piège déjà rencontré et corrigé**, pour ne pas le refaire : les spécialités
arrivent dans un second jeu de résultats et se répartissent **par `member_id`**, pas en
suivant l'ordre des personnes. L'ordre seul ne dit pas où finit la liste de l'une.

**Ce qui ne sera pas rendu administrable, et pourquoi :**

- **Les sections légales.** Une page qui engage juridiquement gagne à rester relue et
  versionnée : le dépôt garde la trace de qui a écrit quoi et quand. Un champ modifiable
  en deux clics sur le seul contenu du site qui expose échangerait une commodité rare
  contre un risque permanent.
- **Méthode, engagements, principes, groupe.** Ils ne changent quasi jamais. Le coût
  d'un écran par contenu ne se rembourse pas.

Restent donc à considérer : **témoignages** - le seul qui bouge encore à un rythme
humain, quand un client accepte d'être cité.

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

Sur le même moule, dans cet ordre : équipe, témoignages, clients, chiffres, méthode et
engagements, groupe et marques, sections légales, puis les textes de pages restants.

## Points à confirmer en cours de route

- Rôles d'administration : un seul rôle, ou une distinction éditeur / administrateur ?
- Faut-il un aperçu des brouillons sur le site public, par lien signé ?
- Variantes d'images générées au téléversement, ou redimensionnement à la demande ?
- Conservation des médias supprimés : suppression immédiate dans MinIO, ou corbeille ?
