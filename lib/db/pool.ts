import "server-only"

import mysql from "mysql2/promise"

/**
 * Deux pools, deux comptes, deux rôles.
 *
 *   `read`  → `app_read`,  le site public. `EXECUTE` sur les seules procédures
 *             `pub_*`, qui ne rendent que du contenu publié.
 *   `write` → `app_write`, l'administration. `EXECUTE` sur toutes les procédures.
 *
 * **La séparation n'est pas une convention de code, c'est un privilège de base.**
 * Le compte `app_read` se voit refuser l'exécution de toute procédure d'écriture,
 * refuser `SELECT` sur toute table, et refuser jusqu'à `list_case_studies`, qui
 * pourrait montrer un brouillon. Vérifié sur la base en marche.
 *
 * Trois barrières se cumulent, de la plus faible à la plus forte :
 *
 *   1. Le proxy renvoie 404 sur `/admin` dans le déploiement de lecture.
 *   2. `getPool("write")` refuse de s'ouvrir hors du rôle `write`.
 *   3. Le déploiement de lecture ne reçoit pas `DB_WRITE_PASSWORD` : même en
 *      contournant les deux premières, il n'a pas d'identifiant capable d'écrire.
 *
 * `server-only` fait échouer le build si un composant client importe ce module,
 * même indirectement. C'est la garde qui compte le plus ici : les identifiants de
 * connexion ne doivent jamais partir dans un bundle navigateur.
 */

export type DbRole = "read" | "write"

/**
 * Rôle du processus courant, lu une fois. `read` par défaut : la valeur sûre est
 * celle qui ne peut rien écrire, donc un oubli de configuration dégrade vers moins
 * de droits, jamais vers plus.
 */
export function currentRole(): DbRole {
  return process.env.HELIARA_ROLE === "write" ? "write" : "read"
}

function required(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example.`
    )
  }
  return value
}

/**
 * Les pools sont mémorisés sur `globalThis` et non dans de simples variables de
 * module : en développement, le rechargement à chaud réévalue les modules et l'on
 * accumulerait un pool par édition jusqu'à épuiser les connexions du serveur.
 */
const store = globalThis as typeof globalThis & {
  __heliaraPools?: Partial<Record<DbRole, mysql.Pool>>
}

function credentials(role: DbRole) {
  if (role === "write") {
    // Le garde-fou qui compte : un chemin de code du site public qui tenterait
    // d'écrire échoue ici, avant même d'ouvrir une connexion.
    if (currentRole() !== "write") {
      throw new Error(
        "Le pool d'écriture est refusé : ce processus tourne en rôle « read ». " +
          "Les écritures ne sont servies que par le déploiement d'administration."
      )
    }
    return {
      user: process.env.DB_WRITE_USER ?? "app_write",
      password: required("DB_WRITE_PASSWORD"),
    }
  }
  return {
    user: process.env.DB_READ_USER ?? "app_read",
    password: required("DB_READ_PASSWORD"),
  }
}

export function getPool(role: DbRole = "read"): mysql.Pool {
  store.__heliaraPools ??= {}

  store.__heliaraPools[role] ??= mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3307),
    database: process.env.DB_NAME ?? "heliara",
    ...credentials(role),
    // Toujours faux : rien ne justifie d'envoyer plusieurs instructions dans un
    // même paquet, et l'interdire retire une classe entière d'injections. Un
    // `CALL` rend malgré tout ses jeux de résultats multiples, ce dont
    // `pub_get_case_study` a besoin.
    multipleStatements: false,
    // Le pool de lecture sert toutes les pages publiques, celui d'écriture
    // quelques rédacteurs : il n'a pas besoin de la même largeur.
    connectionLimit: role === "read" ? 10 : 4,
    waitForConnections: true,
    queueLimit: 0,
    charset: "utf8mb4",
    // Les `BIGINT` du schéma sont des secondes Unix, très loin de la limite de
    // précision d'un nombre : les laisser en nombres évite de convertir partout.
    supportBigNumbers: true,
    bigNumberStrings: false,
  })

  return store.__heliaraPools[role]!
}

/** Ferme les pools ouverts. Pour les scripts en ligne de commande et les tests. */
export async function closePool() {
  const pools = store.__heliaraPools
  if (!pools) {
    return
  }
  await Promise.all(Object.values(pools).map((pool) => pool?.end()))
  store.__heliaraPools = undefined
}
