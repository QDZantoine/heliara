import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

/**
 * Deux projets, parce que les deux moitiés du code n'ont pas les mêmes besoins.
 *
 * `unit` tourne en Node : contenu éditorial, schémas zod, actions serveur, plan
 * du site. Aucun DOM, donc rien à simuler et des tests rapides.
 *
 * `dom` tourne en jsdom avec le plugin React : composants, et les deux fonctions
 * de `lib/lottie` qui touchent à `window`.
 *
 * `db` parle à la vraie base : les procédures stockées ne se testent pas
 * autrement. Les fichiers se déclarent avec `describeDb`, qui les met en attente
 * plutôt qu'en échec quand la base n'est pas démarrée - `pnpm test` reste donc
 * vert sans Docker.
 */
export default defineConfig({
  resolve: {
    alias: {
      // Le même alias que tsconfig.json, sans dépendance supplémentaire.
      "@": path.resolve(import.meta.dirname),
      // `server-only` lève à l'import hors contexte React Server : c'est son
      // rôle en production, mais il empêcherait de tester la couche d'accès.
      "server-only": path.resolve(
        import.meta.dirname,
        "tests/stubs/server-only.ts"
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          environment: "node",
          include: ["tests/db/**/*.test.ts"],
          setupFiles: ["tests/setup-db.ts"],
          // Les tests d'intégration partagent une base : les faire tourner en
          // parallèle rendrait leurs jeux de données concurrents.
          fileParallelism: false,
          testTimeout: 20000,
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["tests/dom/**/*.test.tsx", "tests/dom/**/*.test.ts"],
          setupFiles: ["tests/setup-dom.tsx"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/**/*.ts"],
      // Les pages ne sont pas couvertes ici : ce sont des Server Components qui
      // ne font que composer des blocs déjà testés, et leur rendu se vérifie au
      // build et en CDP (voir CLAUDE.md, « Vérification visuelle »).
      exclude: ["app/**/page.tsx", "app/**/layout.tsx", "**/*.d.ts"],
    },
  },
})
