/**
 * Le bandeau défilant de l'accueil (S3) : ce qui est garanti, pas ce qui est promis.
 *
 * **Deux bandes, deux registres, et c'est la condition pour qu'elles coexistent.**
 * L'accueil porte aussi les principes de conception en S7 (`lib/content/kpis.ts`) :
 * sur mesure, interlocuteur unique, aucun verrou, pensé pour évoluer. Ce sont des
 * **positions**. Les lignes ci-dessous sont des **artefacts** - un dépôt, un document,
 * une date, un chiffre au contrat - c'est-à-dire ce qui rend ces positions
 * vérifiables.
 *
 * La distinction n'est pas cosmétique. Une première version du bandeau reprenait
 * « développement sur mesure », « pensé pour évoluer » et « aucune dépendance
 * fournisseur » : quatre des sept lignes redisaient mot pour mot les quatre principes
 * de S7. Le visiteur lisait deux fois la même chose sur une page, ce qui affaiblit les
 * deux sections au lieu d'en renforcer une.
 *
 * **Règle pour éditer cette liste** : si une ligne peut se reformuler en principe,
 * elle appartient à `kpis.ts`. Si elle nomme une chose qu'on remet, une date qu'on
 * tient ou un document qu'on écrit, elle est ici. Et chacune doit pouvoir se vérifier
 * dans un contrat - un bandeau d'engagements qu'on ne peut pas opposer n'est qu'un
 * slogan qui défile.
 */
export const guarantees: readonly string[] = [
  "Code documenté, et 100 % à vous",
  "Réversibilité garantie",
  "Accessibilité AA à chaque livraison",
  "Jalons datés dès le cadrage",
  "Budget ferme par phase",
  "Hébergement souverain en France",
  "Sécurité auditée par des pentesters",
]
