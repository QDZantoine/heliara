/**
 * Les engagements de l'accueil : ce qui est garanti, pas ce qui est promis.
 *
 * **Règle pour éditer cette liste**, et elle est vérifiée par un test. Si une ligne peut
 * se reformuler en principe, elle appartient à `kpis.ts` (S7) ; si elle nomme une chose
 * qu'on remet, une date qu'on tient ou un document qu'on écrit, elle est ici. Le défaut
 * est arrivé : quatre des sept lignes redisaient mot pour mot les quatre principes de S7,
 * et le visiteur lisait deux fois la même promesse.
 *
 * Chacune doit pouvoir se vérifier dans un contrat - un engagement qu'on ne peut pas
 * opposer n'est qu'un slogan.
 */

/** L'en-tête de la section. Ici plutôt que dans le JSX, comme tout l'éditorial. */
export const guaranteesSection = {
  eyebrow: "Nos garanties",
  title: "Des engagements, pas des intentions.",
  lead: "Chacun se vérifie dans un contrat plutôt que dans une promesse commerciale. C'est la différence entre ce qu'un prestataire affirme et ce qu'on peut lui opposer.",
}
export const guarantees: readonly string[] = [
  "Code documenté, et 100 % à vous",
  "Réversibilité garantie",
  "Accessibilité AA à chaque livraison",
  "Jalons datés dès le cadrage",
  "Budget ferme par phase",
  "Hébergement souverain en France",
  "Sécurité auditée par des pentesters",
]
