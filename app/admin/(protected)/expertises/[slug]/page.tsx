import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExpertiseEditor } from "@/components/admin/expertise-editor"
import { requireSession } from "@/lib/auth/session"
import { listCases } from "@/lib/db/cases"
import { getService, listFamilies } from "@/lib/db/expertises"

export async function generateMetadata(
  props: PageProps<"/admin/expertises/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params
  const item = await getService({ slug })
  return { title: item ? item.title : "Service introuvable" }
}

export default async function EditServicePage(
  props: PageProps<"/admin/expertises/[slug]">
) {
  await requireSession()
  const { slug } = await props.params
  const item = await getService({ slug })

  if (!item) {
    notFound()
  }

  const [families, cases] = await Promise.all([listFamilies(), listCases()])

  return (
    <ExpertiseEditor
      item={item}
      families={families}
      caseSlugs={cases.map((one) => one.slug)}
    />
  )
}
