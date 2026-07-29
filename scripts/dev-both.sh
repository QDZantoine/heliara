#!/bin/bash
# ============================================================
# HELIARA - Lance les deux déploiements côte à côte
#
# `pnpm dev:both`
#
#   http://localhost:3000   HELIARA_ROLE=read    le site public
#   http://localhost:3001   HELIARA_ROLE=write   l'administration
#
# Deux processus et non un seul, parce que le rôle est lu au démarrage et
# détermine quel compte de base est utilisé. C'est aussi la configuration de
# production, à ceci près qu'en production le 3001 n'est joignable que par VPN.
#
# **Ce que permet ce mode**, et qui n'a pas d'autre moyen d'être vérifié : publier
# une fiche dans l'administration, cliquer sur « Voir le site », et constater
# qu'elle apparaît. En développement il n'y a pas de cache, donc le changement est
# immédiat ; en production, la fraîcheur vient d'un délai d'une minute - les deux
# processus n'ayant pas le même cache, une invalidation par tag ne franchit pas la
# frontière.
#
# Les journaux des deux processus sont préfixés. Ctrl+C arrête les deux.
#
# Chaque processus a son propre répertoire de build (`.next-read`, `.next-write`) :
# Next 16 pose un verrou par répertoire et refuserait le second serveur sinon.
# ============================================================
set -uo pipefail

cd "$(dirname "$0")/.."

READ_PORT="${READ_PORT:-3000}"
WRITE_PORT="${WRITE_PORT:-3001}"

# `-sTCP:LISTEN` est indispensable : sans lui, `lsof` compte aussi les sockets en
# cours de fermeture, et le script refuse de démarrer juste après un arrêt.
for port in "$READ_PORT" "$WRITE_PORT"; do
  if lsof -ti:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Le port $port est déjà pris. Libérez-le, ou changez READ_PORT / WRITE_PORT."
    echo "  lsof -ti:$port -sTCP:LISTEN | xargs kill"
    exit 1
  fi
done

pids=()

stop() {
  echo
  echo "Arrêt des deux serveurs."
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  exit 0
}

# Sur Ctrl+C, on arrête les deux : sans ce piège, l'un des deux survivrait et
# garderait son port - et le lancement suivant se rattacherait à un serveur périmé.
trap stop INT TERM

echo "site public     http://localhost:$READ_PORT"
echo "administration  http://localhost:$WRITE_PORT/admin"
echo

# `NEXT_DIST_DIR` distinct par processus : Next 16 pose un verrou par répertoire
# de build et refuse un second serveur de dev sans cela - « Another next dev server
# is already running ».
HELIARA_ROLE=read NEXT_DIST_DIR=.next-read \
  node_modules/.bin/next dev --port "$READ_PORT" 2>&1 |
  sed "s/^/[public] /" &
pids+=($!)

HELIARA_ROLE=write NEXT_DIST_DIR=.next-write \
  node_modules/.bin/next dev --port "$WRITE_PORT" 2>&1 |
  sed "s/^/[admin ] /" &
pids+=($!)

wait
