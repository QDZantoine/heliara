import type { Metadata } from "next"

import { ClientBoard } from "@/components/admin/client-board"
import { requireSession } from "@/lib/auth/session"
import { listClients } from "@/lib/db/clients"

export const metadata: Metadata = { title: "Références" }

/**
 * Les références clientes du bandeau de l'accueil.
 *
 * Une seule liste, sans onglets : la collection est plate et tient à l'écran. Le
 * décompte des références en ligne est dans le tableau, sous la liste, où la question
 * se pose vraiment.
 */
export default async function AdminReferencesPage() {
  await requireSession()
  const clients = await listClients()

  return (
    <div className="grid max-w-4xl gap-6">
      <header className="grid gap-1">
        <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
          Références
        </h1>
        <p className="text-[0.9rem] text-body">
          Les logos du bandeau « Ils nous font confiance », sur l&apos;accueil.
        </p>
      </header>

      <ClientBoard clients={clients} />
    </div>
  )
}
