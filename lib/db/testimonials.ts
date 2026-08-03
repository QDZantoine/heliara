import { write } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"
import { isoDay } from "@/lib/date"

/**
 * Lecture des témoignages côté administration : brouillons compris.
 *
 * Un seul appel rend tout, la table étant plate. La réalisation liée est jointe par la
 * procédure - son titre suffit à l'écran, qui n'a qu'à nommer le projet d'où vient la
 * citation.
 */

type TestimonialRow = {
  id: Buffer
  quote: string
  author_name: string
  author_role: string
  initials: string
  consent_at: number | null
  consent_note: string
  case_study_id: Buffer | null
  position: number
  status: "draft" | "published"
  published_at: number | null
  updated_at: number
  case_title: string | null
  case_slug: string | null
}

export type TestimonialDetail = {
  id: string
  quote: string
  authorName: string
  authorRole: string
  initials: string
  /**
   * La trace de l'accord. `consentAt` est un jour ISO, prêt pour un champ de date ;
   * `consentNote` dit où l'écrit se trouve. La publication exige les deux, et ni l'une
   * ni l'autre ne s'affiche sur le site.
   */
  consentAt: string
  consentNote: string
  /** La réalisation d'où vient la citation, quand elle est renseignée. */
  caseId: string | null
  caseTitle: string | null
  position: number
  status: "draft" | "published"
  publishedAt: number | null
  updatedAt: number
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

/**
 * Un horodatage de la base ramené au jour ISO, par `isoDay`.
 *
 * **Jamais `toISOString()`** : le champ de saisie est un jour de calendrier, et passer
 * par UTC le ferait reculer d'un jour partout à l'est de Greenwich - exactement le défaut
 * qui décalait la date des articles à chaque passage dans l'éditeur. `lib/date.ts` ne
 * raisonne qu'en composantes locales, et un test le verrouille dans n'importe quel
 * fuseau.
 */
function toConsentDay(seconds: number | null): string {
  return seconds === null ? "" : isoDay(new Date(Number(seconds) * 1000))
}

export async function listTestimonials(): Promise<TestimonialDetail[]> {
  const rows = await write.rows<TestimonialRow>("list_testimonials")

  return rows.map((row) => ({
    id: toHex(row.id),
    quote: row.quote,
    authorName: row.author_name,
    authorRole: row.author_role,
    initials: text(row.initials),
    consentAt: toConsentDay(row.consent_at),
    consentNote: text(row.consent_note),
    caseId: row.case_study_id ? toHex(row.case_study_id) : null,
    caseTitle: row.case_title ?? null,
    position: Number(row.position),
    status: row.status,
    publishedAt: row.published_at === null ? null : Number(row.published_at),
    updatedAt: Number(row.updated_at),
  }))
}
