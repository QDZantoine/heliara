import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CaseEditor } from "@/components/admin/case-editor"
import { requireSession } from "@/lib/auth/session"
import { getCase } from "@/lib/db/cases"

export async function generateMetadata(
  props: PageProps<"/admin/realisations/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const item = await getCase({ slug })
  return { title: item ? item.title : "Réalisation introuvable" }
}

export default async function EditCasePage(
  props: PageProps<"/admin/realisations/[slug]">
) {
  await requireSession()
  const { slug } = await props.params
  const item = await getCase({ slug })

  if (!item) {
    notFound()
  }

  return <CaseEditor item={item} />
}
