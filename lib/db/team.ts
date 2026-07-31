import { write } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"
import { publicUrl } from "@/lib/s3"

/**
 * Lecture de l'équipe côté administration : brouillons compris.
 *
 * Deux appels, et non un par personne : les membres puis toutes les spécialités, que
 * l'appelant répartit. Une jointure aurait dupliqué chaque personne autant de fois
 * qu'elle a de puces, pour un gain nul sur trois lignes.
 */

type MemberRow = {
  id: Buffer
  name: string
  role: string
  initials: string
  bio: string
  is_partner: number
  position: number
  status: "draft" | "published"
  published_at: number | null
  updated_at: number
  photo_light_media_id: Buffer | null
  photo_dark_media_id: Buffer | null
  light_key: string | null
  light_alt: string | null
  light_name: string | null
  dark_key: string | null
  dark_alt: string | null
  dark_name: string | null
}

type SkillRow = { member_id: Buffer; label: string }

/** Un portrait, tel que l'écran de dépôt le consomme. */
export type MemberPhoto = {
  id: string
  url: string
  alt: string
  width: null
  height: null
  originalName: string
}

export type MemberDetail = {
  id: string
  name: string
  role: string
  initials: string
  bio: string
  isPartner: boolean
  position: number
  status: "draft" | "published"
  publishedAt: number | null
  updatedAt: number
  skills: string[]
  /** Le portrait du thème clair. Absent tant qu'aucun n'a été déposé. */
  photoLight: MemberPhoto | null
  /** Celui du thème sombre. Les deux sont exigés à la publication. */
  photoDark: MemberPhoto | null
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

/**
 * Les dimensions restent nulles, comme pour les logos.
 *
 * Les portraits sont cadrés par la carte - `aspect-4/3`, `object-cover`, `object-top` -
 * donc aucun rendu ne consomme les dimensions du fichier. Les lire demanderait une
 * bibliothèque de décodage pour rien.
 */
function toPhoto(
  id: Buffer,
  key: string,
  alt: string,
  name: string
): MemberPhoto {
  return {
    id: toHex(id),
    url: publicUrl(key),
    alt: text(alt),
    width: null,
    height: null,
    originalName: text(name),
  }
}

export async function listMembers(): Promise<MemberDetail[]> {
  const [rows, skills] = await Promise.all([
    write.rows<MemberRow>("list_team_members"),
    write.rows<SkillRow>("list_team_skills"),
  ])

  const parSkill = new Map<string, string[]>()
  for (const skill of skills) {
    const key = toHex(skill.member_id)
    parSkill.set(key, [...(parSkill.get(key) ?? []), skill.label])
  }

  return rows.map((row) => {
    const id = toHex(row.id)
    return {
      id,
      name: row.name,
      role: row.role,
      initials: text(row.initials),
      bio: text(row.bio),
      isPartner: row.is_partner === 1,
      position: Number(row.position),
      status: row.status,
      publishedAt: row.published_at === null ? null : Number(row.published_at),
      updatedAt: Number(row.updated_at),
      skills: parSkill.get(id) ?? [],
      photoLight:
        row.photo_light_media_id && row.light_key
          ? toPhoto(
              row.photo_light_media_id,
              row.light_key,
              text(row.light_alt),
              text(row.light_name)
            )
          : null,
      photoDark:
        row.photo_dark_media_id && row.dark_key
          ? toPhoto(
              row.photo_dark_media_id,
              row.dark_key,
              text(row.dark_alt),
              text(row.dark_name)
            )
          : null,
    }
  })
}
