/**
 * Le paquet `server-only` lève à l'import dès qu'il n'est pas évalué dans un
 * contexte React Server. C'est exactement son rôle en production - il fait
 * échouer le build si un composant client importe le pool - mais sous vitest il
 * empêcherait de tester la couche d'accès. Cet équivalent inerte le remplace,
 * uniquement dans les tests.
 */
export {}
