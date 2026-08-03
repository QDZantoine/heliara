# Installer Heliara sur une VM Debian 13

Écrit pour la VM de production réelle : Debian 13 (Trixie), 8 vCPU, 8 Go de RAM, 120 Go de
disque, **MariaDB 11.8 déjà installée**, ni Docker ni Node.

Tout est natif, sans Docker. Le `docker-compose.yml` du dépôt sert le poste de
développement et n'a rien à faire ici.

Les fichiers de ce dossier sont des **modèles** : aucun ne contient de secret, et chacun
porte des valeurs à remplacer, signalées par `À_REMPLACER`.

---

## Vue d'ensemble

| Quoi                | État sur la VM      | Ce qu'il reste à faire                     |
| ------------------- | ------------------- | ------------------------------------------ |
| MariaDB 11.8        | **déjà installée**  | vérifier et durcir, créer la base          |
| Node.js 22          | absent              | installer                                  |
| pnpm 10             | absent              | installer                                  |
| Stockage S3 (MinIO) | absent              | installer en service                       |
| Reverse proxy       | absent              | installer Caddy                            |

Deux processus applicatifs tourneront : le site public sur 3000, l'administration sur 3001.

---

## 1. Vérifier la MariaDB existante

**Elle convient**, et il vaut la peine de dire pourquoi : le projet exige au moins la 11.3
pour `RANDOM_BYTES()`, et il assemble ses identifiants UUID v7 à la main plutôt que
d'appeler `UUID_v7()` - ce qui le rend portable sur toute la série 11.x, 11.8 comprise.

Trois points à contrôler avant de s'en servir :

```bash
sudo mariadb -e "SELECT VERSION();"

# La collation du projet doit exister (introduite en 11.4).
sudo mariadb -e "SHOW COLLATION LIKE 'utf8mb4_uca1400_ai_ci';"

# Sur quelle interface écoute-t-elle ? Elle n'a aucune raison d'être joignable de l'extérieur.
sudo ss -tlnp | grep -E '3306|mariadb'

# La base est-elle vierge, ou héberge-t-elle déjà autre chose ?
sudo mariadb -e "SHOW DATABASES;"
```

Si `bind-address` n'est pas restreint, poser le fichier fourni :

```bash
sudo cp deploy/mariadb-heliara.cnf /etc/mysql/mariadb.conf.d/99-heliara.cnf
sudo systemctl restart mariadb
```

### Créer la base et les comptes

Les quatre comptes et leurs privilèges viennent du dépôt, mais `db/init/01-users.sh` est
écrit pour l'entrée d'image Docker. Sur cette VM, créer les comptes à la main - une seule
fois :

```bash
# Générer quatre mots de passe et les garder dans le gestionnaire de secrets.
for n in admin migrate read write; do echo "$n : $(openssl rand -base64 24)"; done

sudo mariadb <<'SQL'
CREATE DATABASE IF NOT EXISTS heliara
  CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

CREATE USER IF NOT EXISTS 'db_admin'@'localhost'   IDENTIFIED BY 'À_REMPLACER';
CREATE USER IF NOT EXISTS 'db_migrate'@'localhost' IDENTIFIED BY 'À_REMPLACER';
CREATE USER IF NOT EXISTS 'app_read'@'localhost'   IDENTIFIED BY 'À_REMPLACER';
CREATE USER IF NOT EXISTS 'app_write'@'localhost'  IDENTIFIED BY 'À_REMPLACER';

GRANT ALL PRIVILEGES ON heliara.* TO 'db_admin'@'localhost';
GRANT CREATE, ALTER, DROP, INDEX, REFERENCES, CREATE ROUTINE, ALTER ROUTINE,
      EXECUTE, SELECT, INSERT, UPDATE, DELETE
  ON heliara.* TO 'db_migrate'@'localhost';
FLUSH PRIVILEGES;
SQL
```

**Aucun `GRANT` pour `app_read` ni `app_write` ici**, et c'est le cœur du modèle : leurs
droits sont accordés **procédure par procédure** par `db/init/10-grants.sql`, que
`pnpm db:migrate` joue. Ils n'auront jamais aucun droit de table.

`db_migrate` n'a délibérément pas `GRANT OPTION` : c'est `root` qui accorde les privilèges,
et c'est ce qui empêche une migration de s'octroyer des droits.

---

## 2. Node 22 et pnpm

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git mariadb-client

# Node 22 depuis NodeSource. Vérifier la version proposée par Debian 13 d'abord :
# si `apt-cache policy nodejs` annonce déjà 22.x, l'installer depuis Debian suffit.
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version    # doit afficher v22.x

sudo corepack enable pnpm
pnpm --version    # doit afficher 10.x
```

**`mariadb-client` n'est pas optionnel** : `pnpm db:migrate` détecte ce client et s'en sert
au lieu de chercher un conteneur Docker. Sans lui, la migration refuse de partir avec un
message explicite.

---

## 3. Le stockage objet

Le projet parle **S3 standard**, sans dépendance à une API propriétaire. Deux voies :

- **Un S3 managé** (Scaleway, OVH) : rien à installer, la facture remplace l'exploitation,
  et aucune question de licence.
- **MinIO sur cette VM** : c'est ce que le développement utilise. Point à trancher côté
  Hexceos avant de s'engager : **MinIO est sous licence AGPL v3**, ce qui mérite une lecture
  attentive pour une société qui édite du logiciel. Vérifier l'état actuel de la licence et
  des versions sur min.io - il a changé, et ce document ne peut pas en être la référence.

Si MinIO est retenu, `deploy/minio.service` est prêt. Créer d'abord l'utilisateur, le
volume, et **un compte de service restreint au seul seau** plutôt que le compte racine :

```bash
sudo useradd -r -s /sbin/nologin minio-user
sudo mkdir -p /srv/minio/data && sudo chown -R minio-user: /srv/minio
sudo cp deploy/minio.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now minio
```

Le seau s'appelle `heliara`, et **seul le préfixe `public/` est ouvert en lecture anonyme** :
c'est ce qui permet aux images du site d'être servies sans signature, le reste demeurant
privé.

---

## 4. L'application

```bash
sudo mkdir -p /srv/heliara && sudo chown "$USER": /srv/heliara
git clone git@ssh.git.lnsh.in:hexceos-projects/heliara.git /srv/heliara
cd /srv/heliara

cp .env.example .env
chmod 600 .env        # il contiendra tous les secrets
# puis compléter : voir la table des variables de docs/deploiement.md §0 bis

pnpm install --frozen-lockfile
SITE_ORIGIN=https://heliara.fr pnpm build
```

**`SITE_ORIGIN` au build et à l'exécution.** Les pages sont prérendues : réglée seulement à
l'exécution, la première minute servirait des URL absolues fausses, et aucun aperçu de lien
ne s'afficherait sur les réseaux sociaux. Rien ne le signalerait.

Puis la base et le premier compte :

```bash
pnpm db:migrate        # schéma, procédures, privilèges. Demande root et db_migrate.
pnpm admin:create      # premier compte, mot de passe saisi sans écho
pnpm db:seed           # OU pnpm db:import <export>, voir docs/deploiement.md §2
```

---

## 5. Les deux services systemd

```bash
sudo cp deploy/heliara-read.service deploy/heliara-write.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now heliara-read heliara-write
systemctl status heliara-read --no-pager
```

**Les deux unités ne reçoivent pas les mêmes secrets, et c'est volontaire.** Elles lisent
deux fichiers d'environnement distincts :

| Fichier                   | Pour            | Contient                                     |
| ------------------------- | --------------- | -------------------------------------------- |
| `/etc/heliara/read.env`   | le site public  | `DB_READ_*`, **jamais** `DB_WRITE_*`         |
| `/etc/heliara/write.env`  | l'administration| `DB_WRITE_*` et les identifiants du stockage  |

C'est la troisième barrière du modèle de sécurité : entièrement compromis, le processus
public ne détient aucun identifiant capable d'écrire. Ne pas mutualiser ces deux fichiers
par commodité - ce serait défaire la garantie.

```bash
sudo install -d -m 750 /etc/heliara
sudo install -m 640 /dev/null /etc/heliara/read.env
sudo install -m 640 /dev/null /etc/heliara/write.env
# puis les remplir, chacun avec ce que sa colonne autorise
```

---

## 6. Le reverse proxy

```bash
sudo apt-get install -y caddy
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
# remplacer les trois noms de domaine et la liste d'IP autorisées
sudo systemctl reload caddy
```

Caddy obtient et renouvelle les certificats seul. Trois noms à faire pointer vers cette VM :
le site, l'administration, et les médias.

**L'administration doit être restreinte au réseau autorisé.** Sur le processus public, tout
ce qui commence par `/admin` répond 404 - mais c'est la plus faible des trois barrières, et
elle ne remplace pas le filtrage.

---

## 7. Vérifier, dans cet ordre

Les huit contrôles de `docs/deploiement.md` §8, dont les trois qui attrapent des défauts
invisibles autrement :

```bash
curl -s https://heliara.fr/sitemap.xml | grep -c '<loc>'     # doit dire 32 et plus
curl -sD - -o /dev/null https://heliara.fr/ | grep -i strict-transport
cd /srv/heliara && pnpm og --base=https://heliara.fr /       # chaque carte doit repondre 200
```

Et depuis l'extérieur du réseau autorisé, `GET /admin` sur le domaine public doit répondre
**404**.

---

## Ce qu'il ne faut pas faire

- **Ne pas lancer `docker-compose.yml`** : il publie la base et le stockage sur toutes les
  interfaces, avec des mots de passe de développement.
- **Ne pas donner `DB_WRITE_PASSWORD` au processus public.** Voir §5.
- **Ne pas exposer l'administration à Internet** en comptant sur le 404.
- **Ne pas jouer `pnpm db:reset` sur cette VM** : il détruit les données.
