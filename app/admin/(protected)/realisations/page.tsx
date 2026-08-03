import type { Metadata } from "next"

import { CaseBoard } from "@/components/admin/case-board"
import { CaseCreate } from "@/components/admin/case-create"
import { requireSession } from "@/lib/auth/session"
import { listCases } from "@/lib/db/cases"

export const metadata: Metadata = { title: "Réalisations" }

export default async function AdminCasesPage() {
  // Le layout a déjà vérifié la session ; une page ne doit pas supposer le
  // contexte de son parent, et la lecture est de toute façon nécessaire.
  await requireSession()
  const cases = await listCases()

  const published = cases.filter((item) => item.status === "published").length

  return (
    <div className="grid max-w-4xl gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
            Réalisations
          </h1>
          <p className="text-[0.9rem] text-body">
            {cases.length === 0
              ? "Aucune fiche pour l'instant."
              : `${cases.length} fiche${cases.length > 1 ? "s" : ""}, dont ${published} en ligne.`}
          </p>
        </div>
        <CaseCreate />
      </header>

      <CaseBoard cases={cases} />
    </div>
  )
}
