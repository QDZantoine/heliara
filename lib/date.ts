/**
 * Jours calendaires, sans fuseau.
 *
 * Une colonne `DATE` de MariaDB est un jour, pas un instant. `mysql2` la rend
 * pourtant en `Date`, positionnée à **minuit dans le fuseau du processus Node**. La
 * ramener en ISO par `toISOString()` la reconvertit en UTC, ce qui la fait reculer
 * d'un jour partout à l'est de Greenwich : minuit le 12 juillet à Paris est le 11
 * juillet à 22 h en UTC.
 *
 * Le défaut était réel et silencieux. La base contenait `2026-07-12`, le formulaire
 * d'article affichait le 11, et enregistrer la fiche écrivait le 11 : la date d'un
 * article reculait d'un jour à chaque passage dans l'éditeur. Il ne se voit ni au
 * build, ni au typecheck, et pas non plus en lisant le code - le commentaire d'origine
 * affirmait même l'inverse, qu'un formatage local risquerait de décaler. C'est
 * `toISOString` qui décale.
 *
 * D'où ces deux fonctions, qui ne raisonnent qu'en composantes locales.
 */

function pad(value: number) {
  return String(value).padStart(2, "0")
}

/** Le jour d'une valeur venue de la base, en `AAAA-MM-JJ`. */
export function isoDay(value: unknown): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }
  // Déjà une chaîne quand `dateStrings` est actif, ou pour un `DATETIME` textuel.
  return typeof value === "string" ? value.slice(0, 10) : ""
}

/** Aujourd'hui, tel que le lit la personne devant l'écran. */
export function todayIso(): string {
  return isoDay(new Date())
}
