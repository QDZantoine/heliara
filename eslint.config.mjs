import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Un paramètre préfixé d'un tiret bas est délibérément inutilisé : c'est
      // le cas des doubles de test, dont la signature doit rester complète pour
      // que `mock.calls` soit typé.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Tout répertoire de build alternatif, réglé par NEXT_DIST_DIR : les deux de
    // `pnpm dev:both`, et ceux qu'une vérification ponctuelle peut créer. Nommer les
    // répertoires un par un laissait les autres se faire analyser comme du source.
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
