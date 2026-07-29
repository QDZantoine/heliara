import "server-only"

import { write } from "@/lib/db/call"
import { toHex } from "@/lib/db/id"

/**
 * Accès aux expertises pour l'administration.
 *
 * Deux niveaux : une **famille** regroupe des services et porte une entrée de nav du
 * site ; un **service** est une page. C'est la seule collection dont une écriture
 * peut casser la navigation, ce qui explique les garde-fous côté procédures -
 * `nav_service_slug` doit désigner un service existant, une famille non vide ne se
 * supprime pas, un service cible de nav ne se supprime pas non plus.
 */

export type FamilySummary = {
  id: string
  slug: string
  label: string
  title: string
  summary: string
  tag: string
  halo: "warm" | "cool"
  sketch: [number, number, number]
  navServiceSlug: string
  position: number
  serviceCount: number
  publishedCount: number
  updatedAt: number
}

export type ServiceSummary = {
  id: string
  slug: string
  title: string
  tagline: string
  relatedCase: string
  ctaTitle: string
  status: "draft" | "published"
  position: number
  familyId: string
  familySlug: string
  familyLabel: string
  deliverableCount: number
  faqCount: number
  updatedAt: number
  updatedByName: string | null
}

export type ServiceDetail = ServiceSummary & {
  problem: string
  deliverables: { title: string; text: string }[]
  techChoices: { title: string; text: string }[]
  faq: { question: string; answer: string }[]
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

type FamilyRow = {
  id: Buffer
  slug: string
  label: string
  title: string
  summary: string
  tag: string
  halo: "warm" | "cool"
  sketch_1: number
  sketch_2: number
  sketch_3: number
  nav_service_slug: string | null
  position: number
  service_count: number
  published_count: number
  updated_at: number
}

export async function listFamilies(): Promise<FamilySummary[]> {
  const rows = await write.rows<FamilyRow>("list_expertise_families")
  return rows.map((row) => ({
    id: toHex(row.id),
    slug: row.slug,
    label: row.label,
    title: text(row.title) || row.label,
    summary: text(row.summary),
    tag: text(row.tag),
    halo: row.halo,
    sketch: [Number(row.sketch_1), Number(row.sketch_2), Number(row.sketch_3)],
    navServiceSlug: row.nav_service_slug ?? "",
    position: Number(row.position),
    serviceCount: Number(row.service_count),
    publishedCount: Number(row.published_count),
    updatedAt: Number(row.updated_at),
  }))
}

type ServiceRow = {
  id: Buffer
  slug: string
  title: string
  tagline: string
  problem?: string
  related_case_slug: string | null
  cta_title: string
  status: "draft" | "published"
  position: number
  family_id: Buffer
  family_slug: string
  family_label: string
  deliverable_count?: number
  faq_count?: number
  updated_at: number
  updated_by_name?: string | null
}

function toServiceSummary(row: ServiceRow): ServiceSummary {
  return {
    id: toHex(row.id),
    slug: row.slug,
    title: row.title,
    tagline: text(row.tagline),
    relatedCase: row.related_case_slug ?? "",
    ctaTitle: text(row.cta_title),
    status: row.status,
    position: Number(row.position),
    familyId: toHex(row.family_id),
    familySlug: row.family_slug,
    familyLabel: row.family_label,
    deliverableCount: Number(row.deliverable_count ?? 0),
    faqCount: Number(row.faq_count ?? 0),
    updatedAt: Number(row.updated_at),
    updatedByName: row.updated_by_name ?? null,
  }
}

export async function listServices(
  status: "draft" | "published" | null = null
): Promise<ServiceSummary[]> {
  const rows = await write.rows<ServiceRow>("list_expertise_services", [status])
  return rows.map(toServiceSummary)
}

type PairRow = { title: string; text: string }
type FaqRow = { question: string; answer: string }

export async function getService(
  reference: { id: Buffer } | { slug: string }
): Promise<ServiceDetail | null> {
  const [id, slug] =
    "id" in reference ? [reference.id, null] : [null, reference.slug]

  const sets = await write.sets("get_expertise_service_full", [id, slug])
  const row = (sets[0] as ServiceRow[] | undefined)?.[0]
  if (!row) {
    return null
  }

  return {
    ...toServiceSummary(row),
    problem: text(row.problem),
    deliverables: ((sets[1] as PairRow[]) ?? []).map((item) => ({
      title: item.title,
      text: text(item.text),
    })),
    techChoices: ((sets[2] as PairRow[]) ?? []).map((item) => ({
      title: item.title,
      text: text(item.text),
    })),
    faq: ((sets[3] as FaqRow[]) ?? []).map((item) => ({
      question: item.question,
      answer: text(item.answer),
    })),
  }
}
