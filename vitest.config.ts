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
 * `db` n'est pas ici : les procédures SQL se testent contre la base en marche,
 * c'est de l'intégration. Voir `pnpm test:db`.
 */
export default defineConfig({
  resolve: {
    // Le même alias que tsconfig.json, sans dépendance supplémentaire.
    alias: { "@": path.resolve(import.meta.dirname) },
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
