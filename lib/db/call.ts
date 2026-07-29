import "server-only"

import type { RowDataPacket } from "mysql2"

import { getPool, type DbRole } from "@/lib/db/pool"

/**
 * L'unique porte d'entrée vers la base, en deux exemplaires.
 *
 *   `read`  pour le site public : seules les procédures `pub_*` lui sont
 *           accessibles, et le compte utilisé n'a le privilège d'exécuter aucune
 *           autre.
 *   `write` pour l'administration.
 *
 * **Le choix se lit sur chaque appel** - `read.rows("pub_list_case_studies")` face
 * à `write.void("delete_case_study", …)` - et c'est délibéré : la frontière entre
 * ce qui est public et ce qui ne l'est pas doit se voir à la relecture, pas se
 * déduire d'un import.
 *
 * Aucune requête SQL n'est écrite ailleurs dans l'application, ni en lecture ni en
 * écriture : tout passe par une procédure stockée. C'est le coût assumé du modèle,
 * et c'est ce qui permet aux comptes applicatifs de n'avoir qu'`EXECUTE`.
 *
 * Les paramètres sont toujours liés, jamais interpolés. Le nom de la procédure ne
 * peut pas l'être - ce n'est pas une valeur - il est donc validé contre un motif
 * strict avant d'être écrit dans l'instruction.
 */

/** Un nom de routine : lettres, chiffres, tirets bas. Rien d'autre. */
const PROCEDURE = /^[a-z_][a-z0-9_]{0,63}$/

/**
 * Erreur métier levée par une procédure via `SIGNAL SQLSTATE '45000'`.
 *
 * Le message est un code stable (`SLUG_TAKEN`, `CASE_INCOMPLETE`…), pas une
 * phrase : c'est l'appelant qui décide de la formulation affichée, en français et
 * au bon endroit du formulaire.
 */
export class BusinessError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = "BusinessError"
    this.code = code
  }
}

/** L'appel a échoué pour une raison technique : la base est muette ou fâchée. */
export class DatabaseError extends Error {
  constructor(procedure: string, cause: unknown) {
    super(`Échec de l'appel à ${procedure}.`)
    this.name = "DatabaseError"
    this.cause = cause
  }
}

export type Param = string | number | Buffer | null | undefined

async function runSets<T>(
  role: DbRole,
  procedure: string,
  params: Param[]
): Promise<T[][]> {
  if (!PROCEDURE.test(procedure)) {
    throw new Error(`Nom de procédure invalide : ${procedure}`)
  }

  const placeholders = params.map(() => "?").join(", ")
  const sql = `CALL \`${procedure}\`(${placeholders})`
  // `undefined` n'est pas liable : on l'envoie explicitement en NULL, ce qui
  // laisse la procédure appliquer sa valeur par défaut.
  const bound = params.map((value) => value ?? null)

  try {
    const [result] = await getPool(role).query(sql, bound)
    const sets = (Array.isArray(result) ? result : [result]) as unknown[]
    // MariaDB ajoute un jeu final décrivant le statut de l'appel : il n'est pas
    // un tableau, donc ce filtre le retire et `sets[0]` est bien le premier
    // `SELECT` de la procédure.
    return sets.filter(Array.isArray) as T[][]
  } catch (error) {
    // Une erreur métier remonte en SQLSTATE 45000 : elle est attendue, et
    // traduite en type dédié plutôt qu'enveloppée comme une panne.
    if (
      error &&
      typeof error === "object" &&
      "sqlState" in error &&
      error.sqlState === "45000"
    ) {
      const message =
        "sqlMessage" in error && typeof error.sqlMessage === "string"
          ? error.sqlMessage
          : "UNKNOWN"
      throw new BusinessError(message)
    }
    throw new DatabaseError(procedure, error)
  }
}

function createCaller(role: DbRole) {
  return {
    role,

    /** Tous les jeux de résultats. Pour `pub_get_case_study` et ses cinq jeux. */
    sets<T = RowDataPacket>(procedure: string, params: Param[] = []) {
      return runSets<T>(role, procedure, params)
    },

    /** Les lignes du premier jeu. Le cas courant. */
    async rows<T = RowDataPacket>(procedure: string, params: Param[] = []) {
      const sets = await runSets<T>(role, procedure, params)
      return sets[0] ?? []
    },

    /**
     * La première ligne, ou `null`. Zéro ligne n'est pas une erreur : c'est ainsi
     * que les procédures de lecture disent « rien trouvé », et c'est aussi ainsi
     * qu'elles disent « pas encore publié », sans les distinguer.
     */
    async row<T = RowDataPacket>(procedure: string, params: Param[] = []) {
      const sets = await runSets<T>(role, procedure, params)
      return sets[0]?.[0] ?? null
    },

    /**
     * La première ligne, en exigeant qu'elle existe. Pour les procédures de
     * création, qui rendent toujours ce qu'elles viennent d'écrire : une absence
     * de ligne signalerait un contrat rompu, pas une donnée manquante.
     */
    async rowStrict<T = RowDataPacket>(
      procedure: string,
      params: Param[] = []
    ) {
      const sets = await runSets<T>(role, procedure, params)
      const row = sets[0]?.[0]
      if (!row) {
        throw new DatabaseError(
          procedure,
          new Error("Aucune ligne rendue alors qu'une était attendue.")
        )
      }
      return row
    },

    /** Appelle une procédure qui ne rend rien. */
    async void(procedure: string, params: Param[] = []) {
      await runSets(role, procedure, params)
    },
  }
}

/** Le site public. Ne peut appeler que les procédures `pub_*`. */
export const read = createCaller("read")

/** L'administration. Refuse de s'ouvrir hors du déploiement d'écriture. */
export const write = createCaller("write")
