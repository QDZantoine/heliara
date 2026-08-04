# syntax=docker/dockerfile:1

# ============================================================
# HELIARA - image applicative
#
# **Une seule image pour les deux rôles.** Le même artefact sert le site public et
# l'administration ; ils ne diffèrent que par `HELIARA_ROLE` et par les secrets qu'ils
# reçoivent. Ne pas construire deux images.
#
# Sur Coolify : deux applications depuis ce même dépôt, avec deux jeux de variables.
# ============================================================

FROM node:22-slim AS base

# Debian et non Alpine, délibérément. Trois dépendances de ce projet contiennent du code
# natif - `sharp` pour l'optimisation d'images, `@node-rs/argon2` pour le hachage des mots
# de passe, `@next/swc` pour la compilation - et leurs binaires officiels visent la glibc.
# Sur Alpine (musl), il faut des variantes spécifiques que pnpm ne résout pas toujours : le
# symptôme est un hachage de mot de passe qui échoue à l'exécution, pas au build.
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate


# ------------------------------------------------------------
# Dépendances
# ------------------------------------------------------------
# Séparées du code : elles ne sont réinstallées que si le manifeste ou le verrou changent,
# ce qui économise l'essentiel du temps de build sur un changement de code.
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


# ------------------------------------------------------------
# Build
# ------------------------------------------------------------
FROM deps AS builder
WORKDIR /app
COPY . .

# **`SITE_ORIGIN` est nécessaire ICI, au build, et c'est le piège de ce projet.**
#
# Les pages sont prérendues : l'origine des URL absolues - canonique, OpenGraph, plan du
# site, images de partage - est figée dans le HTML produit. Construite sans cette valeur,
# l'image annonce des adresses vers le domaine de repli, et **aucun aperçu de lien ne
# s'affiche** sur WhatsApp, LinkedIn ou Slack. Rien ne le signale : les balises sont
# présentes, bien formées, et pointent ailleurs.
#
# Conséquence à assumer : cette image est liée à une origine. Une préproduction se
# reconstruit avec sa propre valeur. La variable doit AUSSI être fournie à l'exécution -
# le premier `revalidate` la relit.
#
# Sur Coolify : Build Variables, et non Environment Variables seules.
ARG SITE_ORIGIN
ENV SITE_ORIGIN=${SITE_ORIGIN}

RUN pnpm build


# ------------------------------------------------------------
# Exécution
# ------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# `output: "standalone"` n'est pas activé, et l'image embarque donc `node_modules` en
# entier - environ 1 Go. C'est un choix, pas un oubli : le conteneur peut ainsi jouer
# `pnpm db:migrate`, `pnpm admin:create` et `pnpm db:import`, qui passent par `tsx` et par
# les scripts du dépôt. Sans eux, il faudrait un second chemin pour administrer la base.
#
# Si le poids devient un problème, la voie est d'activer `standalone` dans
# `next.config.ts` et de sortir les migrations dans une image d'outillage distincte. Ne pas
# se contenter d'élaguer `node_modules` : le tracing de Next ne voit pas ce que les scripts
# utilisent, et la panne n'apparaîtrait qu'au moment de migrer en production.
COPY --from=builder --chown=node:node /app ./

# Le cache de Next est écrit **à l'exécution** : `revalidate = 60` régénère les pages sur
# disque. Ce répertoire doit rester inscriptible par l'utilisateur du conteneur, sans quoi
# la régénération échoue en silence et le contenu se fige.
RUN mkdir -p .next/cache && chown -R node:node .next

USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# **`favicon.ico` et non `/`.** C'est la seule route qui répond 200 sur les deux rôles : sur
# le déploiement d'administration, `/` répond 404 puisqu'il ne sert que `/admin`. Un contrôle
# de santé sur la racine déclarerait ce conteneur en panne alors qu'il fonctionne. Les
# fichiers d'icônes échappent au proxy - voir son `matcher` dans `proxy.ts`.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/favicon.ico').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# `HELIARA_ROLE` n'est pas fixé ici, et c'est voulu : `read` est la valeur par défaut de
# l'application, donc un oubli de configuration dégrade vers moins de droits, jamais vers
# plus. Le conteneur d'administration doit la poser explicitement.
CMD ["pnpm", "start"]
