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
#  app_exec   : l'application. EXECUTE seul, aucun accès direct aux tables :
#               tout passe par les procédures stockées.
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

CREATE USER IF NOT EXISTS 'app_exec'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';
-- EXECUTE sur toutes les routines, existantes et futures. Aucun privilège de
-- table : l'application ne peut littéralement pas lire une table en direct.
GRANT EXECUTE ON \`${DB}\`.* TO 'app_exec'@'%';

FLUSH PRIVILEGES;
SQL

echo "Comptes db_admin, db_migrate et app_exec créés sur ${DB}."
