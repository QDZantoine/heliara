import {
  accentOfIndex,
  partners as staticPartners,
  team as staticTeam,
  type Person,
} from "@/lib/content/team"
import { read } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"
import { publicUrl } from "@/lib/s3"

/**
 * L'équipe lue en base, **avec repli sur `lib/content/team.ts`**.
 *
 * Même contrat que les autres collections : le repli est silencieux pour le visiteur et
 * bruyant dans les journaux. Il est « tout ou rien » - dès qu'une personne est publiée en
 * base, les fiches statiques cessent de s'appliquer, d'où l'amorçage par `pnpm db:seed`.
 *
 * **Deux listes, une seule lecture.** `/a-propos` affiche tout le monde, `/contact` les
 * seuls associés. Les deux sortent du même appel : c'est ce qui garantit qu'une personne
 * ne peut pas figurer dans l'une avec un texte et dans l'autre avec un autre.
 */

type MemberRow = {
  id: Buffer
  name: string
  role: string
  initials: string
  bio: string
  is_partner: number
  light_key: string
  light_alt: string
  dark_key: string
  dark_alt: string
}

type SkillRow = { member_id: Buffer; label: string }

const text = (value: unknown) => (typeof value === "string" ? value : "")

function fallback(reason: string, error?: unknown) {
  console.warn(
    `Équipe : repli sur le contenu statique (${reason}).`,
    error ?? ""
  )
}

export type PublicTeam = {
  /** Tout le monde, dans l'ordre : ce que `/a-propos` affiche. */
  all: readonly Person[]
  /** Les associés seuls : ce que `/contact` affiche sous « Vos interlocuteurs ». */
  partners: readonly Person[]
}

const staticTeamValue: PublicTeam = {
  all: staticTeam,
  partners: staticPartners,
}

export async function listPublicTeam(): Promise<PublicTeam> {
  try {
    const sets = await read.sets("pub_list_team_members")
    const rows = (sets[0] as MemberRow[] | undefined) ?? []

    if (rows.length === 0) {
      fallback("aucune personne publiée")
      return staticTeamValue
    }

    /*
      Les spécialités arrivent dans un second jeu, à répartir par identifiant.

      **Le regroupement passe par l'identifiant et non par le nom.** Une première version
      distribuait les puces en suivant l'ordre des personnes, ce qui supposait de savoir
      où finit la liste de l'une et où commence celle de l'autre - une information que
      l'ordre seul ne porte pas. La procédure rend `member_id` des deux côtés : le lier
      est à la fois plus court et juste.
    */
    const parMembre = new Map<string, string[]>()
    for (const skill of (sets[1] as SkillRow[] | undefined) ?? []) {
      const key = toHex(skill.member_id)
      parMembre.set(key, [...(parMembre.get(key) ?? []), skill.label])
    }

    const all: Person[] = rows.map((row, index) => ({
      name: row.name,
      role: row.role,
      initials: text(row.initials),
      bio: text(row.bio),
      skills: parMembre.get(toHex(row.id)) ?? [],
      // La teinte vient du rang, jamais d'une colonne : voir `accentOfIndex` et
      // l'en-tête de `db/init/18-schema-team.sql`.
      accent: accentOfIndex(index),
      photo: {
        white: publicUrl(row.light_key),
        orange: publicUrl(row.dark_key),
      },
    }))

    return { all, partners: all.filter((_, i) => rows[i]?.is_partner === 1) }
  } catch (error) {
    fallback("base injoignable", error)
    return staticTeamValue
  }
}
