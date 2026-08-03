#!/bin/bash
# ============================================================
# HELIARA - Comptes MariaDB (modèle database-centric)
#
# Exécuté une seule fois, à l'initialisation du conteneur sur volume vierge.
#
#  db_admin   : administration et maintenance (ALL). Jamais utilisé par
#               l'application.
#  db_migrate : migrations, procédures et seed (DDL + routines + DML). Sert au
#               déploiement, pas à l'exécution.
#  app_read   : le site public. `EXECUTE` sur les seules procédures `pub_*`, qui
#               ne rendent que du contenu publié. Aucun droit de table, et aucun
#               accès à la moindre procédure d'écriture.
#  app_write  : l'administration. `EXECUTE` sur toutes les procédures. Ses
#               identifiants n'existent que dans l'environnement du déploiement
#               d'administration, jamais dans celui du site public.
#
# **La séparation lecture / écriture est portée par la base, pas seulement par le
# réseau.** Le site public ne peut pas écrire même entièrement compromis : le
# compte qu'il utilise n'a le droit d'exécuter aucune procédure d'écriture, et il
# ne détient pas d'identifiant qui en soit capable.
#
# Les privilèges des deux comptes applicatifs sont accordés procédure par
# procédure dans `09-grants.sql`, jamais au niveau du schéma : une procédure
# nouvellement écrite n'est donc atteignable par personne tant qu'on ne l'a pas
# décidé explicitement.
#
# Les mots de passe viennent de l'environnement, jamais du dépôt. C'est la raison
# pour laquelle ce fichier est un script et non un `.sql` : l'entrypoint MariaDB
# ne substitue pas les variables dans les fichiers SQL.
# ============================================================
set -euo pipefail

DB="${MARIADB_DATABASE:-heliara}"

mariadb --protocol=socket -uroot -p"${MARIADB_ROOT_PASSWORD}" <<SQL
CREATE USER IF NOT EXISTS 'db_admin'@'%' IDENTIFIED BY '${DB_ADMIN_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB}\`.* TO 'db_admin'@'%';

CREATE USER IF NOT EXISTS 'db_migrate'@'%' IDENTIFIED BY '${DB_MIGRATE_PASSWORD}';
GRANT CREATE, ALTER, DROP, INDEX, REFERENCES,
      CREATE ROUTINE, ALTER ROUTINE, EXECUTE,
      SELECT, INSERT, UPDATE, DELETE
  ON \`${DB}\`.* TO 'db_migrate'@'%';

-- Les deux comptes applicatifs sont créés sans aucun privilège. `09-grants.sql`
-- est le seul endroit qui décide de ce que chacun peut appeler.
CREATE USER IF NOT EXISTS 'app_read'@'%'  IDENTIFIED BY '${DB_READ_PASSWORD}';
CREATE USER IF NOT EXISTS 'app_write'@'%' IDENTIFIED BY '${DB_WRITE_PASSWORD}';

FLUSH PRIVILEGES;
SQL

echo "Comptes db_admin, db_migrate, app_read et app_write créés sur ${DB}."
