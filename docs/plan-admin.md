# Plan d'action - administration des contenus

Objectif : rendre modifiable l'intégralité des contenus du site (textes, projets et
leurs images, articles) depuis une interface d'administration, sur une base MariaDB
accédée **exclusivement par procédures stockées** et un stockage objet MinIO.

État de départ : site 100 % statique, contenu en dur dans `lib/content/*.ts`, 24 commits,
36 pages prérendues.

## Avancement

Ce tableau est la première chose à lire pour reprendre le chantier. Le convenu et le
vérifié y sont distingués : « fait » signifie éprouvé contre l'infrastructure en marche,
pas seulement écrit.

| Étape                                  | État                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| 0 - Infrastructure                     | **fait**, vérifié sur la base et le stockage en marche  |
| 1 - Schéma et procédures d'authentification | à faire, prochaine étape                           |
| 2 - Couche d'accès                     | à faire                                                 |
| 3 - Authentification applicative       | à faire                                                 |
| 4 - Médias                             | à faire                                                 |
| 5 - Réalisations                       | à faire                                                 |
| 6 - Bascule du site public             | à faire                                                 |

Ce qui a été vérifié à l'étape 0, et n'a donc pas à être revérifié :

- Les trois comptes existent. `app_exec` se voit refuser `SELECT` comme `CREATE` sur
  toute table, et ne dispose que de `GRANT EXECUTE ON heliara.*`.
- `GenerateKey()`, `Uuid2Bin()`, `Bin2Uuid()` et `Slugify()` répondent, **appelées par
  `app_exec`**. Aller-retour UUID conforme, entrée invalide à `NULL`, 16 octets, chiffre
  de version à 7, ordre temporel respecté.
- Le seau MinIO `heliara` est créé, son préfixe `public/` ouvert en lecture anonyme.

Deux constats acquis à ne pas redécouvrir :

- `UUID_v7()` n'existe qu'à partir de MariaDB 11.7, l'image est en 11.4 LTS.
  `GenerateKey()` assemble donc le v7 à la main, ce qui rend l'API portable sur tout hôte
  11.x. Ne pas « simplifier » en rappelant la fonction native.
- L'entrypoint MariaDB ne substitue pas les variables d'environnement dans les fichiers
  `.sql`. D'où `01-users.sh`, un script : c'est ce qui garde les mots de passe hors du
  dépôt.

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

## Étapes suivantes

Sur le même moule, dans cet ordre : articles (avec leurs blocs typés), expertises, équipe,
témoignages, clients, chiffres, méthode et engagements, groupe et marques, sections
légales, puis les textes de pages restants.

## Points à confirmer en cours de route

- Rôles d'administration : un seul rôle, ou une distinction éditeur / administrateur ?
- Faut-il un aperçu des brouillons sur le site public, par lien signé ?
- Variantes d'images générées au téléversement, ou redimensionnement à la demande ?
- Conservation des médias supprimés : suppression immédiate dans MinIO, ou corbeille ?
