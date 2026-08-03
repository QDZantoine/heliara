# Déployer Heliara - ce qu'il faut fournir

Écrit pour être lu par quelqu'un qui n'a pas le code sous les yeux, et suffisant pour
déployer sans poser de question. `.env.example` reste la référence de détail : il décrit
chaque variable une par une, avec la forme attendue.

**Aucune valeur réelle ne figure dans ce document ni dans le dépôt.** Les secrets vivent
dans le gestionnaire de secrets du déploiement.

---

## Ce qu'il faut retenir avant tout le reste

**Un seul artefact applicatif, deux processus.** Le même build sert le site public et
l'administration. Ils ne diffèrent que par la variable `HELIARA_ROLE` et par les
identifiants de base qu'ils reçoivent. Ne pas construire deux images.

**La séparation lecture / écriture est portée par la base, pas par le réseau.** Le
processus public utilise un compte SQL qui n'a le droit d'exécuter que 15 procédures
nommées une par une - 14 lectures et un compteur de vues - plus deux fonctions de
conversion d'identifiants, et **aucun droit de table**. Le réseau n'est que la première des
trois barrières.
Conséquence à respecter : **le déploiement public ne doit jamais recevoir
`DB_WRITE_PASSWORD`**. Entièrement compromis, il ne détiendrait alors aucun identifiant
capable d'écrire.

---

## 0. Les services à fournir

Cinq, dont trois seulement sont indispensables au démarrage.

| Service                | Rôle                                        | Indispensable ?                          |
| ---------------------- | ------------------------------------------- | ---------------------------------------- |
| **Node.js 22 LTS**     | les deux processus applicatifs              | oui                                      |
| **MariaDB 11.4 LTS**   | tout le contenu éditorial                   | oui - sinon le site sert son repli figé  |
| **Stockage S3**        | images déposées dans l'administration       | oui - sinon aucune image ne s'affiche    |
| **Reverse proxy TLS**  | terminaison HTTPS, redirections, filtrage   | oui pour la production                   |
| **Resend**             | acheminement du formulaire de contact       | non - sans lui, le formulaire refuse net |

Rien d'autre. Pas de Redis, pas de file de messages, pas de CDN obligatoire : voir la
section 9.

---

## 0 bis. Les variables d'environnement, par processus

Le tableau qui décide de tout. **Une variable absente de la colonne d'un processus ne doit
pas y être placée** - ce n'est pas de la propreté, c'est le modèle de sécurité.

| Variable                    | public (`read`) | admin (`write`) | Sans elle                                            |
| --------------------------- | :-------------: | :-------------: | ---------------------------------------------------- |
| `HELIARA_ROLE`              |     `read`      |     `write`     | vaut `read` : l'administration répondrait 404         |
| `PORT`                      |    optionnel    |    optionnel    | 3000                                                 |
| `DB_HOST` `DB_PORT` `DB_NAME` |       oui       |       oui       | pas de base : repli sur le contenu figé du dépôt      |
| `DB_READ_USER` `DB_READ_PASSWORD` |    **oui**    |       oui       | idem                                                 |
| `DB_WRITE_USER` `DB_WRITE_PASSWORD` | **jamais** |    **oui**     | l'administration ne peut rien écrire                  |
| `S3_ENDPOINT` `S3_REGION` `S3_BUCKET` |     oui      |       oui       | aucune image ne s'affiche                            |
| `S3_ROOT_USER` `S3_ROOT_PASSWORD` |   non\*     |     **oui**     | aucun dépôt d'image possible                         |
| `S3_PUBLIC_URL`             |     **oui**     |       oui       | images et aperçus de lien cassés - voir la section 3 |
| `SITE_ORIGIN`               |     **oui**     |    optionnel    | les URL absolues pointent vers `heliara.fr`          |
| `NEXT_PUBLIC_SITE_ORIGIN`   |       non       |     **oui**     | « Voir le site » reste sur le port d'administration   |
| `RESEND_API_KEY` `CONTACT_FROM` |    **oui**    |       non       | le formulaire refuse et affiche l'e-mail public       |
| `CONTACT_TO`                |    optionnel    |       non       | l'adresse publique du site reçoit                    |
| `GOOGLE_SITE_VERIFICATION` `BING_SITE_VERIFICATION` | optionnel |    non    | aucune balise émise ; la vérification DNS reste possible |

\* Le processus public lit les images par leur URL publique, jamais par l'API S3 : il n'a
donc pas besoin des identifiants du stockage. Ne pas les lui donner.

**`DB_ROOT_PASSWORD`, `DB_ADMIN_PASSWORD` et `DB_MIGRATE_PASSWORD` ne vont dans aucun des
deux processus.** Ils ne servent qu'à l'initialisation et aux migrations, depuis un poste
d'administration ou un travail de déploiement.

**Ce qui échoue silencieusement**, et qu'il faut donc vérifier après coup plutôt que de le
supposer : `SITE_ORIGIN` et `S3_PUBLIC_URL`. Mal réglées, le site se sert parfaitement et
annonce des adresses injoignables - aucun aperçu de lien sur les réseaux sociaux, sans
qu'aucun journal ne le signale. La section 8 dit comment le contrôler.

---

## 0 ter. La séquence de commandes, dans l'ordre

Un premier déploiement, de bout en bout. Chaque étape suppose la précédente réussie.

```bash
# 1. Construire - une seule fois, le même artefact sert les deux processus.
pnpm install --frozen-lockfile
SITE_ORIGIN=https://heliara.fr pnpm build      # au build ET à l'exécution, voir §0 bis

# 2. Base : schéma, procédures, privilèges. Demande root et db_migrate.
pnpm db:migrate

# 3. Contenu. Choisir UNE des deux voies (§2).
pnpm db:import <dossier-export>                # reproduire un site existant
pnpm db:seed                                   # ou amorcer depuis le dépôt

# 4. Le premier compte d'administration, mot de passe saisi sans écho.
pnpm admin:create

# 5. Démarrer les deux processus.
HELIARA_ROLE=read  PORT=3000 pnpm start        # public
HELIARA_ROLE=write PORT=3001 pnpm start        # administration, VPN seulement
```

Une mise à jour applicative ensuite : étapes 1, 2 et 5. L'étape 2 est **obligatoire à
chaque déploiement** qui touche à `db/init/` - et sans danger sinon, elle est idempotente.

---

## 1. Exécution

| Élément         | Version / valeur                                   |
| --------------- | -------------------------------------------------- |
| Node.js         | 22 LTS (développé et testé sur 22.19)              |
| Gestionnaire    | pnpm 10                                            |
| Build           | `pnpm install --frozen-lockfile` puis `pnpm build` |
| Démarrage       | `pnpm start` (soit `next start`)                   |
| Port par défaut | 3000, réglable par `PORT`                          |

Deux processus à lancer depuis le **même** répertoire de build :

| Processus      | `HELIARA_ROLE` | Exposition        | Sert               | Identifiants base         |
| -------------- | -------------- | ----------------- | ------------------ | ------------------------- |
| public         | `read`         | Internet, en TLS  | tout sauf `/admin` | `DB_READ_*` **seulement** |
| administration | `write`        | VPN ou liste d'IP | `/admin` seulement | `DB_WRITE_*`              |

`read` est la valeur par défaut : un oubli de configuration dégrade vers moins de droits,
jamais vers plus.

**Si les deux processus partagent un système de fichiers**, leur donner deux répertoires de
build distincts par `NEXT_DIST_DIR` (par exemple `.next-read` et `.next-write`). Next pose
un verrou par répertoire et refuse de démarrer deux fois sur le même. Sur deux conteneurs
séparés, rien à faire.

---

## 2. Base de données

**MariaDB 11.4 LTS.** La version compte : les procédures assemblent des identifiants
UUID v7 à la main plutôt que d'utiliser `UUID_v7()`, qui n'existe qu'à partir de 11.7.
Le seul prérequis réel est `RANDOM_BYTES()`, présent depuis 11.3. **Ne pas descendre sous
11.3.**

- Encodage `utf8mb4`, collation `utf8mb4_uca1400_ai_ci`.
- Une base nommée `heliara` (réglable par `DB_NAME`).
- Joignable depuis les deux processus applicatifs. Elle n'a **aucune raison** d'être
  joignable depuis Internet.

**Cinq comptes, et leur séparation est le cœur du modèle de sécurité :**

| Compte       | Privilèges                                  | Qui l'utilise                      |
| ------------ | ------------------------------------------- | ---------------------------------- |
| `root`       | tout, dont `GRANT OPTION`                   | l'initialisation et les privilèges |
| `db_admin`   | `ALL` sur la base                           | maintenance humaine. Jamais l'app  |
| `db_migrate` | DDL, routines, DML - **pas** `GRANT`        | migrations, amorçage, import       |
| `app_read`   | `EXECUTE` sur 17 routines, dont 14 lectures | le site public                     |
| `app_write`  | `EXECUTE` sur 101 routines                  | l'administration                   |

Ordre de grandeur du schéma : 23 tables, 98 procédures, 4 fonctions.

Les comptes applicatifs n'ont **aucun droit de table** : ils ne peuvent qu'appeler des
procédures stockées. Vérifié par `tests/db/separation.test.ts`, qui contrôle aussi que
`app_read` se voit refuser les procédures d'écriture et celles qui montreraient un
brouillon.

**La seule écriture accordée au site public est `pub_count_article_view`**, un compteur de
lectures : elle ne rend aucune ligne, n'accepte qu'un identifiant d'URL et ne touche que
deux compteurs. Le pire qu'un appelant hostile en tire est un chiffre gonflé.

### Initialisation, dans cet ordre

1. Les fichiers de `db/init/` créent le schéma, les procédures et les privilèges. Sur un
   volume MariaDB vierge, l'entrée d'image les exécute seule, en `root`.
2. **Sur une base existante**, jouer `pnpm db:migrate`. Il rejoue schéma et procédures en
   `db_migrate`, puis **les privilèges en `root`**.
3. `pnpm admin:create` crée le premier compte d'administration. Le mot de passe est saisi
   sans écho, jamais passé en argument.
4. Le contenu, par **l'une des deux voies** ci-dessous. Ce ne sont pas des variantes de la
   même chose : voir le tableau juste après.

**`db/init/` n'est joué qu'une fois, sur volume vierge.** Modifier un de ces fichiers n'a
aucun effet sur une base existante : il faut passer par `pnpm db:migrate`.

### Amorcer, ou transporter : deux commandes qui ne font pas la même chose

|                     | `pnpm db:seed`                        | `pnpm db:export` puis `pnpm db:import`      |
| ------------------- | ------------------------------------- | ------------------------------------------- |
| Source              | les fichiers du dépôt                 | une base et un stockage réels               |
| Ce qui arrive       | le contenu de `lib/content/*.ts`      | **tout** ce que la base contient            |
| Images              | celles de `public/`                   | celles du stockage, déposées comprises      |
| Textes de l'admin   | non                                   | oui                                         |

**Pour reproduire en production le site tel qu'il est aujourd'hui, c'est la seconde voie.**
`db:seed` ne connaît que le dépôt : les images de tête déposées dans l'administration n'y
sont pas, et les fiches concernées arriveraient sans couverture - cinq sur neuf au moment
où ces lignes sont écrites. Le repli sur le croquis fait que le défaut ne casse rien et ne
se voit qu'en comparant les deux sites.

```text
pnpm db:export [dossier]        # écrit dossier/{contenu.sql, objets/, manifeste.json}
pnpm db:import <dossier>        # pousse les objets, puis joue le contenu
```

Trois choses à savoir :

- **`pnpm db:migrate` d'abord.** L'export ne porte ni schéma ni procédures : elles
  viennent du dépôt, et les dumper créerait une seconde source de vérité.
- **Aucun compte n'est transporté**, et les colonnes d'auteur sont remises à `NULL`. Un
  hash de développement n'a rien à faire en production. Le premier compte se crée avec
  `pnpm admin:create`, avant ou après l'import.
- **L'import vérifie ses comptes** table par table contre le manifeste, et sort en erreur
  s'il en manque un. Ce n'est pas du zèle : un import partiel ne lève aucune erreur SQL,
  les contraintes étant satisfaites - seul un comptage le voit. Le défaut est arrivé, neuf
  réalisations arrivaient à deux.

Le journal d'audit et les compteurs de lecture quotidiens ne sont pas exportés : des
évènements de développement, et des chiffres qui gonfleraient l'audience d'un site neuf.

### Le piège des migrations, à connaître

`DROP PROCEDURE` **emporte les privilèges accordés sur cette procédure**. Ils vivent dans
`mysql.procs_priv` et rien ne les restaure. Rejouer un fichier de procédures à la main
révoque donc silencieusement l'accès des comptes applicatifs, et l'application répond
« execute command denied » sur une procédure qui existe pourtant.

**Ne jamais jouer un fichier de procédures sans rejouer les privilèges juste après.**
`pnpm db:migrate` le fait dans le bon ordre. Il demande un accès `root`, `GRANT` exigeant
`GRANT OPTION` que `db_migrate` n'a pas - et ne doit pas avoir.

### Sauvegardes

Une sauvegarde logique quotidienne suffit (`mariadb-dump`, routines comprises :
`--routines`). Le contenu éditorial est la seule donnée irremplaçable ; les images vivent
dans le stockage objet et se sauvegardent séparément.

---

## 3. Stockage objet

**Compatible S3.** Développé sur MinIO, sans dépendance à une API propre à un
fournisseur : S3 d'AWS, Scaleway, OVH ou un MinIO auto-hébergé conviennent.

- Un seau, nommé `heliara` par défaut (`S3_BUCKET`).
- **Seul le préfixe `public/` est ouvert en lecture anonyme.** Le reste demeure privé.
  Conséquence assumée : les images d'un brouillon sont accessibles à qui connaît leur URL,
  qui n'est ni listée ni devinable.
- Un compte de service **restreint à ce seul seau**, avec lecture, écriture et
  `PutObject` présigné. Ne pas utiliser le compte racine.
- CORS : autoriser `PUT` depuis l'origine de l'administration. Le navigateur envoie le
  fichier **directement** au stockage, par URL présignée - il ne traverse jamais
  l'application.

**`S3_PUBLIC_URL` doit être joignable depuis Internet, en HTTPS.** Ce n'est pas qu'une
question d'affichage : une réalisation ou un article qui porte une image de tête donne
**cette URL** comme carte de partage OpenGraph. Un stockage joignable seulement depuis le
serveur donne des pages qui s'affichent parfaitement et ne produisent **aucun aperçu de
lien** sur WhatsApp, LinkedIn ou Slack. En HTTP sur un site HTTPS, c'est du contenu mixte,
que plusieurs explorateurs refusent sans le dire.

---

## 4. Réseau, DNS et TLS

| Nom                          | Vers                         | Exposition                   |
| ---------------------------- | ---------------------------- | ---------------------------- |
| `heliara.fr`, `www`          | processus `read`, port 3000  | Internet, TLS obligatoire    |
| un nom pour l'administration | processus `write`, port 3001 | VPN ou liste d'IP            |
| un nom pour les médias       | le stockage objet            | Internet, TLS, lecture seule |

- **Rediriger `www` vers le nom nu, ou l'inverse, en 301.** Une page servie sous deux noms
  se dédouble dans l'index ; l'URL canonique de chaque page est déjà absolue et unique,
  mais la redirection évite au moteur de la découvrir deux fois.
- **HTTP vers HTTPS en 301.**
- Le proxy doit transmettre `X-Forwarded-For` : c'est l'adresse que le journal d'audit
  enregistre pour chaque écriture.
- Aucun cache partagé n'est nécessaire devant l'application. Un cache de CDN sur les
  réponses HTML est possible mais doit respecter les en-têtes de Next.

**L'administration n'est pas protégée par son adresse.** Sur le processus public, tout ce
qui commence par `/admin` répond **404** - pas 403, qui confirmerait l'existence. Mais
c'est la barrière la plus faible des trois : la restriction réseau reste nécessaire.

### En-têtes de sécurité : l'application les pose déjà

`next.config.ts` émet HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy` et une politique de contenu partielle, et retire
`X-Powered-By`. **Rien n'est à configurer côté proxy pour les obtenir**, et c'est
voulu : un en-tête qui n'existe que dans la configuration d'un proxy disparaît au
premier changement d'hébergement, sans que rien casse ni que personne le voie.

Deux points restent au proxy, parce qu'ils dépendent du certificat et des
sous-domaines :

- **`includeSubDomains` sur HSTS** est délibérément absent de l'application :
  l'administration et les médias vivent sur des sous-domaines, et l'en-tête est
  mémorisé deux ans. À élargir ici, une fois tous les sous-domaines certifiés. Le
  `preload` est irréversible en pratique - ne pas s'y inscrire à la légère.
- **Ne pas dédoubler les en-têtes.** Si le proxy ajoute les siens, vérifier qu'ils
  ne s'additionnent pas : deux `Content-Security-Policy` se combinent par
  intersection, deux `Strict-Transport-Security` sont ignorés par certains
  navigateurs.

**Ce qui n'est pas couvert, et qu'il faut savoir** : la politique de contenu ne porte
ni `script-src` ni `style-src`. Les couvrir demande un nonce par requête, donc un
middleware qui réécrit chaque réponse. Une politique approximative se termine
toujours en `unsafe-inline`, qui ne protège de rien tout en donnant l'apparence du
contraire. À traiter comme un chantier à part, pas comme une ligne de configuration.

---

## 5. Envoi d'e-mails

Le formulaire de contact passe par **Resend**.

1. Créer une clé API en **envoi seul** (`sending_access`). C'est le bon niveau : elle ne
   peut ni lire ni administrer le compte.
2. **Vérifier le domaine d'envoi chez Resend**, ce qui demande des enregistrements DNS -
   SPF et DKIM, plus un `MX` de retour si l'on veut les rapports. Sans cette vérification,
   l'API **refuse** tout envoi depuis une adresse de ce domaine.
3. `CONTACT_FROM` doit appartenir à ce domaine vérifié.
4. `CONTACT_TO` est facultative : à défaut, l'adresse publique du site reçoit. Cette
   adresse doit être une boîte réelle qui relève son courrier.

**Sans configuration valide, le formulaire ne prétend jamais avoir envoyé** : il affiche
une erreur explicite qui renvoie vers l'adresse e-mail publique. Il ne perd donc jamais
un message en silence, mais il n'en transmet aucun non plus.

---

## 6. Fraîcheur du contenu et cache

Le contenu éditorial est lu en base et **régénéré au plus tard une minute** après une
modification (`revalidate = 60`). Une publication depuis l'administration n'est donc pas
instantanée sur le site public.

**C'est voulu, et c'est une limite du modèle à deux processus** : le cache d'un processus
n'est pas celui de l'autre, une invalidation par tag ne franchit pas la frontière. Ne pas
chercher à raccourcir ce délai par un cache partagé sans mesurer d'abord si le besoin est
réel.

Le site **ne tombe pas si la base ne répond pas.** Cinq des six collections
administrables - réalisations, articles, expertises, références clientes, équipe - portent
un repli sur le contenu figé du dépôt. Le repli est silencieux pour le visiteur et
**bruyant dans les journaux** : une ligne « repli sur le contenu statique » signale un
incident, pas un fonctionnement normal. À faire remonter par la supervision.

Une exception à connaître : **le repli des témoignages est vide**, délibérément. Une base
muette fait disparaître leur section de l'accueil au lieu d'en servir une version périmée -
c'est le seul contenu du site où le repli ne doit rien ressusciter. La page reste cohérente,
simplement plus courte.

---

## 7. Supervision

Il n'y a pas de route de santé dédiée. Surveiller :

| Signal                                                   | Ce qu'il veut dire                |
| -------------------------------------------------------- | --------------------------------- |
| `GET /` répond 200                                       | l'application est debout          |
| `GET /sitemap.xml` répond 200 et contient plus de 20 URL | la base répond                    |
| « repli sur le contenu statique » dans les journaux      | la base est muette ou vide        |
| « execute command denied »                               | des privilèges perdus, voir §2    |
| 5xx sur `/_next/image`                                   | le stockage objet est injoignable |

Les journaux d'application vont sur la sortie standard. Aucun secret n'y est écrit.

---

## 8. Vérifications après un premier déploiement

Dans cet ordre, parce que chacune dépend de la précédente.

1. `GET /` répond 200 et affiche des réalisations.
2. `GET /sitemap.xml` porte des URL en `https://` sur le bon domaine. Si elles pointent
   ailleurs, `SITE_ORIGIN` n'est pas réglée.
3. `pnpm og --base=https://heliara.fr /` : chaque carte de partage doit répondre **200**.
   Une balise correcte qui pointe vers une adresse injoignable donne une page parfaite et
   aucun aperçu de lien.
4. Sur `/admin`, depuis le réseau autorisé : la connexion aboutit, et une image déposée
   apparaît sur le site public après une minute.
5. Depuis l'extérieur du réseau autorisé, `GET /admin` sur le domaine public doit répondre
   **404**.
6. Le formulaire de contact : envoyer un message et vérifier qu'il arrive. En cas d'échec,
   la page affiche l'adresse e-mail de repli - le message n'est jamais perdu en silence.
7. Une page inexistante affiche la page 404 du site, avec en-tête et pied de page.
8. Les en-têtes de sécurité arrivent, et une seule fois chacun :
   `curl -sD - -o /dev/null https://heliara.fr/ | grep -iE 'strict-transport|content-security|nosniff|referrer|permissions'`.
   `X-Powered-By` ne doit pas apparaître.

---

## 9. Ce qui n'est **pas** nécessaire

Pour éviter du travail inutile.

- **Aucun Redis, aucun cache externe.** Le cache est celui de Next, sur disque.
- **Aucune file de messages.** Il n'y a pas de traitement asynchrone.
- **Aucun runtime Docker en production** si les deux processus Node tournent nativement.
  Le `docker-compose.yml` du dépôt sert le poste de développement.
- **Aucun serveur de fichiers pour les images.** Elles sont servies par le stockage objet.
- **Aucun cron.** Rien n'est planifié côté application.
