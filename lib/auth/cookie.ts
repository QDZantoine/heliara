/**
 * Nom du cookie de session, isolé de `lib/auth/session.ts`.
 *
 * Le proxy en a besoin, et il ne peut pas importer `session.ts` : celui-ci tire
 * `server-only`, `next/headers` et la couche d'accès à la base, dont rien n'a sa
 * place dans le runtime du proxy. Une constante partagée évite de recopier la
 * chaîne à deux endroits, ce qui finirait par diverger.
 */
export const SESSION_COOKIE = "heliara_session"
