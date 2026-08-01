import type { Metadata } from "next"

import { TeamBoard } from "@/components/admin/team-board"
import { requireSession } from "@/lib/auth/session"
import { listMembers } from "@/lib/db/team"

export const metadata: Metadata = { title: "Équipe" }

/**
 * Les personnes de `/a-propos`, dont les associés que `/contact` présente.
 *
 * Une seule liste, sans onglets : la collection est plate et tient à l'écran. Le
 * décompte est sous la liste, où la question se pose - ce qui compte n'est pas le
 * nombre de fiches saisies mais le nombre en ligne, et combien d'associés parmi elles.
 */
export default async function AdminEquipePage() {
  await requireSession()
  const members = await listMembers()

  return (
    <div className="grid max-w-4xl gap-6">
      <header className="grid gap-1">
        <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
          Équipe
        </h1>
        <p className="text-[0.9rem] text-body">
          Les personnes présentées sur À propos, et les associés qui répondent
          aux messages de contact.
        </p>
      </header>

      <TeamBoard members={members} />
    </div>
  )
}
