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

run_as() {
  local user="$1" password="$2" file="$3"
  docker compose exec -T mariadb \
    mariadb -u "$user" -p"$password" "$DB_NAME" < "$file"
}

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
run_as root "$DB_ROOT_PASSWORD" db/init/10-grants.sql
echo "ok"

echo
echo "Surface accordée :"
docker compose exec -T mariadb mariadb -uroot -p"$DB_ROOT_PASSWORD" --table -e "
SELECT User AS compte, COUNT(*) AS routines
FROM mysql.procs_priv
WHERE User IN ('app_read', 'app_write')
GROUP BY User;" 2>/dev/null
