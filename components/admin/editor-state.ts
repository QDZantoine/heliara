"use client"

import * as React from "react"

/**
 * L'état de saisie des éditeurs, et la façon dont une étape l'enregistre.
 *
 * **Pourquoi hisser l'état hors des panneaux.** Les éditeurs étaient bâtis un
 * onglet = un formulaire = un enregistrement. C'était simple, mais cela imposait
 * le découpage : la fiche d'une réalisation passe par une seule procédure, donc
 * tous ses champs devaient tenir dans un seul écran - trente champs d'affilée.
 *
 * En remontant l'état au niveau de l'éditeur, le découpage des écrans redevient
 * une question de sens et non de plomberie : une étape peut ne montrer que quatre
 * champs de la fiche, et une autre peut en montrer trois autres plus une
 * collection. L'étape enregistre alors tout ce qu'elle touche, en une fois.
 */

/** Ce que rend une action d'écriture, quelle que soit la collection. */
export type SaveOutcome = {
  status: "ok" | "error"
  fieldErrors?: Record<string, string>
  formError?: string
}

/**
 * Une chose enregistrable : un jeu de champs, ou une collection.
 *
 * `commit` porte à la fois l'appel et la mise à jour de ses propres erreurs. C'est
 * ce qui permet à une étape d'en enregistrer plusieurs sans rien savoir d'elles.
 */
export type Saveable = {
  /** Ce que c'est, pour le dire dans un message d'erreur. */
  name: string
  dirty: boolean
  fieldErrors: Record<string, string>
  commit: () => Promise<SaveOutcome>
}

/**
 * Un élément de collection, muni d'un identifiant **local** stable.
 *
 * La base ne rend pas d'identifiant pour les lignes enfants - elles sont remplacées
 * en bloc à chaque enregistrement - mais dnd-kit et React en ont besoin pour suivre
 * une ligne pendant qu'on la déplace. Sans clé stable, réordonner remonterait les
 * champs de saisie dans le désordre. D'où cette clé de session, jamais envoyée.
 */
export type Row<T> = T & { id: string }

let counter = 0

export function withId<T>(item: T): Row<T> {
  counter += 1
  return { ...item, id: `row-${counter}` }
}

/** Retire la clé de session avant l'envoi. */
export function withoutIds<T>(rows: readonly Row<T>[]): T[] {
  return rows.map(({ id: _id, ...rest }) => rest as unknown as T)
}

/**
 * Un jeu de champs plats, enregistré en bloc.
 *
 * `save` reçoit les valeurs en argument plutôt que de les lire dans la portée : le
 * `commit` d'une étape peut être appelé juste après une frappe, et lire un état
 * périmé aurait enregistré la version d'avant.
 */
export function useFieldSet<T extends object>(
  name: string,
  initial: T,
  save: (values: T) => Promise<SaveOutcome>
) {
  const [values, setValues] = React.useState(initial)
  const [dirty, setDirty] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }

  const saveable: Saveable = {
    name,
    dirty,
    fieldErrors,
    commit: async () => {
      const outcome = await save(values)
      if (outcome.status === "error") {
        setFieldErrors(outcome.fieldErrors ?? {})
        return outcome
      }
      setFieldErrors({})
      setDirty(false)
      return outcome
    },
  }

  return { values, set, setValues, dirty, fieldErrors, saveable }
}

/**
 * Une collection ordonnée, telle que la manipule un écran.
 *
 * Le type est écrit à la main plutôt que déduit de `useCollection` : c'est lui que
 * prennent en paramètre les sous-composants d'un éditeur, et un `ReturnType` sur une
 * fonction générique donne des messages d'erreur illisibles quand il ne va pas.
 */
export type Collection<T extends object> = {
  rows: Row<T>[]
  setRows: React.Dispatch<React.SetStateAction<Row<T>[]>>
  update: (id: string, patch: Partial<T>) => void
  /** Rend la clé de session de la ligne créée, pour pouvoir l'ouvrir aussitôt. */
  add: (item: T) => string
  remove: (id: string) => void
  /**
   * Remplace la liste entière et la marque modifiée.
   *
   * Sert au réordonnancement, mais pas seulement : un éditeur qui gère lui-même
   * l'ajout, le retrait et la mise à jour de ses lignes - c'est le cas de
   * `BlockEditor`, dont les blocs sont une union discriminée - rend une liste neuve
   * à chaque geste. D'où ce nom plutôt que `reorder`, qui ne décrivait qu'un de ses
   * usages.
   */
  replace: (next: Row<T>[]) => void
  dirty: boolean
  fieldErrors: Record<string, string>
  errorAt: (index: number, field: string) => string | undefined
  /** La première erreur portant sur la ligne, quel que soit le champ visé. */
  anyErrorAt: (index: number) => string | undefined
  saveable: Saveable
  count: number
}

/**
 * Une collection ordonnée, remplacée en bloc à l'enregistrement.
 *
 * Les erreurs de champ arrivent indexées par chemin - `items.2.title` - parce que
 * c'est ce que produit zod. `errorAt` fait la traduction vers l'index de ligne,
 * pour que le message s'affiche sous la bonne ligne et non en tête de formulaire.
 */
export function useCollection<T extends object>(
  name: string,
  initial: readonly T[],
  save: (items: T[]) => Promise<SaveOutcome>
): Collection<T> {
  const [rows, setRows] = React.useState<Row<T>[]>(() => initial.map(withId))
  const [dirty, setDirty] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )

  const touch = () => setDirty(true)

  const update = (id: string, patch: Partial<T>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    )
    touch()
  }

  const add = (item: T) => {
    const row = withId(item)
    setRows((current) => [...current, row])
    touch()
    return row.id
  }

  const remove = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id))
    touch()
  }

  const replace = (next: Row<T>[]) => {
    setRows(next)
    touch()
  }

  const saveable: Saveable = {
    name,
    dirty,
    fieldErrors,
    commit: async () => {
      const outcome = await save(withoutIds(rows))
      if (outcome.status === "error") {
        setFieldErrors(outcome.fieldErrors ?? {})
        return outcome
      }
      setFieldErrors({})
      setDirty(false)
      return outcome
    },
  }

  /** L'erreur portant sur un champ d'une ligne donnée, s'il y en a une. */
  const errorAt = (index: number, field: string) =>
    fieldErrors[`items.${index}.${field}`]

  /**
   * Utile quand la ligne a une forme variable : un bloc d'article est une union
   * discriminée, et l'erreur peut tomber sur `text`, sur `lead`, ou plus profond
   * encore - `items.3.items.0.title`. Nommer les champs un par un au point
   * d'affichage aurait fait manquer ceux d'une variante.
   */
  const anyErrorAt = (index: number) => {
    const prefix = `items.${index}.`
    for (const [key, message] of Object.entries(fieldErrors)) {
      if (key.startsWith(prefix)) {
        return message
      }
    }
    return undefined
  }

  return {
    rows,
    setRows,
    update,
    add,
    remove,
    replace,
    dirty,
    fieldErrors,
    errorAt,
    anyErrorAt,
    saveable,
    count: rows.length,
  }
}

/**
 * Enregistre tout ce qu'une étape a modifié, et s'arrête à la première erreur.
 *
 * En séquence et non en parallèle, volontairement : chaque collection a sa
 * procédure, un échec sur l'une ne doit pas laisser croire que les suivantes sont
 * passées. On s'arrête, on affiche, la personne corrige et relance.
 */
export async function commitAll(savers: readonly Saveable[]): Promise<{
  status: "ok" | "error"
  formError?: string
}> {
  for (const saver of savers) {
    if (!saver.dirty) {
      continue
    }
    const outcome = await saver.commit()
    if (outcome.status === "error") {
      return {
        status: "error",
        formError:
          outcome.formError ??
          Object.values(outcome.fieldErrors ?? {})[0] ??
          `« ${saver.name} » n'a pas pu être enregistré.`,
      }
    }
  }
  return { status: "ok" }
}
