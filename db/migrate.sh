#!/bin/bash
# ============================================================
# HELIARA - Rejoue le schéma, les procédures et les privilèges
#
# `pnpm db:migrate`
#
# **Pourquoi cette commande existe.** `DROP PROCEDURE` emporte avec lui les
# privilèges accordés sur cette procédure : ils vivent dans `mysql.procs_priv`, et
# rien ne les restaure. Rejouer un fichier de procédures à la main révoque donc
# silencieusement l'accès des comptes applicatifs, et l'application se met à
# répondre « execute command denied » sur une procédure qui existe pourtant. Le
# symptôme est déroutant, la cause invisible.
#
# La seule protection fiable est de ne jamais rejouer un fichier de procédures
# sans rejouer les privilèges juste après. C'est ce que fait cette commande, dans
# le bon ordre, sans qu'on ait à y penser.
#
# Les fichiers de schéma sont idempotents (`CREATE TABLE IF NOT EXISTS`) sauf
# `08-schema-media.sql`, dont l'`ALTER TABLE` final échoue si la contrainte
# existe déjà : c'est sans conséquence, l'erreur est signalée et ignorée.
#
# Les privilèges demandent `root` : `GRANT` et `REVOKE` exigent `GRANT OPTION`,
# que `db_migrate` n'a pas - et ne doit pas avoir.
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${DB_NAME:=heliara}"
: "${DB_MIGRATE_PASSWORD:?DB_MIGRATE_PASSWORD manquant, voir .env.example}"
: "${DB_ROOT_PASSWORD:?DB_ROOT_PASSWORD manquant, voir .env.example}"

# ------------------------------------------------------------
# Deux façons d'atteindre la base, et le script choisit seul
# ------------------------------------------------------------
# **En production, il n'y a pas de Docker** - le guide de déploiement dit même qu'il n'en
# faut pas. Ce script passait inconditionnellement par `docker compose exec`, donc la
# commande que ce même guide demande de jouer échouait sur un serveur.
#
# La détection porte sur le client local d'abord : s'il existe, c'est qu'on est sur un hôte
# qui parle à sa base directement. Le conteneur n'est le bon chemin qu'en développement, où
# MariaDB n'est joignable que par lui.
#
# `DB_CLIENT=docker` ou `DB_CLIENT=local` force le choix, pour le cas où un poste de
# développement a les deux.
if [ "${DB_CLIENT:-}" = "docker" ]; then
  MODE=docker
elif [ "${DB_CLIENT:-}" = "local" ]; then
  MODE=local
elif command -v mariadb >/dev/null 2>&1 || command -v mysql >/dev/null 2>&1; then
  MODE=local
elif docker compose ps mariadb >/dev/null 2>&1; then
  MODE=docker
else
  echo "Aucun moyen d'atteindre la base : ni client mariadb local, ni conteneur." >&2
  echo "Installer mariadb-client, ou lancer pnpm db:up." >&2
  exit 1
fi

CLIENT=$(command -v mariadb || command -v mysql || true)

run_as() {
  # Quatrième argument facultatif, passé tel quel au client (`--force`).
  local user="$1" password="$2" file="$3" extra="${4:-}"
  if [ "$MODE" = "local" ]; then
    # `MYSQL_PWD` plutôt que `-p<mot de passe>` : un mot de passe en argument est visible
    # de tout le système dans la liste des processus.
    MYSQL_PWD="$password" "$CLIENT" $extra \
      --host="${DB_HOST:-127.0.0.1}" --port="${DB_PORT:-3306}" \
      --user="$user" "$DB_NAME" < "$file"
  else
    docker compose exec -T mariadb \
      mariadb $extra -u "$user" -p"$password" "$DB_NAME" < "$file"
  fi
}

echo "Accès à la base : $MODE."

# **Les deux connexions sont vérifiées avant de toucher à quoi que ce soit.** Sans cela,
# un mot de passe `db_migrate` faux faisait échouer chaque fichier de schéma - signalé,
# ignoré - puis l'étape des privilèges tournait quand même : elle retire tous les droits
# des comptes applicatifs et les réaccorde un à un, et s'arrêtait sur la première
# procédure jamais créée. Vécu en production : l'administration a perdu 80 droits.
probe=$(mktemp)
echo "SELECT 1;" > "$probe"
for account in db_migrate root; do
  password="$DB_MIGRATE_PASSWORD"
  [ "$account" = "root" ] && password="$DB_ROOT_PASSWORD"
  if ! run_as "$account" "$password" "$probe" >/dev/null 2>/tmp/heliara-migrate.err; then
    echo "Connexion refusée pour $account : rien n'a été modifié." >&2
    sed 's/^/  /' /tmp/heliara-migrate.err | head -3 >&2
    rm -f "$probe"
    exit 1
  fi
done
rm -f "$probe"

echo "Schéma et procédures, en db_migrate."
# Tous les fichiers SQL numérotés, dans l'ordre. Le motif était `0[2-9]` puis
# `1[0-9]`, ce qui aurait ignoré en silence un fichier `20-` le jour où il existe -
# un schéma non joué ne se voit qu'à la première erreur de l'application.
for file in db/init/[0-9][0-9]-*.sql; do
  case "$file" in
    # 01-users.sh crée les comptes et n'est pas rejouable.
    *01-users.sh) continue ;;
    # 10-grants.sql demande root, il passe à la fin.
    *-grants.sql) continue ;;
  esac
  printf '  %-28s' "$(basename "$file")"
  if run_as db_migrate "$DB_MIGRATE_PASSWORD" "$file" 2>/tmp/heliara-migrate.err; then
    echo "ok"
  else
    # L'ALTER de 08 échoue quand la contrainte est déjà posée : on le dit et on
    # continue, plutôt que d'arrêter une migration par ailleurs saine.
    echo "signalé"
    sed 's/^/      /' /tmp/heliara-migrate.err | head -3
  fi
done

echo "Privilèges, en root - indispensable après tout DROP PROCEDURE."
printf '  %-28s' "10-grants.sql"
# `--force` : une ligne en échec - une procédure qui manque - ne doit pas laisser les
# comptes vidés par le `REVOKE` du début de fichier. Les autres droits passent, et
# l'échec est montré puis remonté en code de sortie.
if run_as root "$DB_ROOT_PASSWORD" db/init/10-grants.sql --force 2>/tmp/heliara-migrate.err; then
  echo "ok"
else
  echo "signalé - les autres droits ont été accordés"
  sed 's/^/      /' /tmp/heliara-migrate.err | head -6
  grants_failed=1
fi

echo
echo "Surface accordée :"
# Le même aiguillage que `run_as`, pour une requête et non un fichier. C'est le contrôle
# qui compte après une migration : un `DROP PROCEDURE` emporte ses privilèges, et une
# surface tombée à zéro est exactement le symptôme à voir tout de suite.
surface="SELECT User AS compte, COUNT(*) AS routines
FROM mysql.procs_priv
WHERE User IN ('app_read', 'app_write')
GROUP BY User;"

if [ "$MODE" = "local" ]; then
  MYSQL_PWD="$DB_ROOT_PASSWORD" "$CLIENT" \
    --host="${DB_HOST:-127.0.0.1}" --port="${DB_PORT:-3306}" \
    --user=root --table -e "$surface" 2>/dev/null
else
  docker compose exec -T mariadb mariadb -uroot -p"$DB_ROOT_PASSWORD" \
    --table -e "$surface" 2>/dev/null
fi

exit "${grants_failed:-0}"
