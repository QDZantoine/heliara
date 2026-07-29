import { redirect } from "next/navigation"

import { AdminShell } from "@/components/admin/admin-shell"
import { getSession } from "@/lib/auth/session"

/**
 * **C'est ici que se joue l'autorisation de l'administration.**
 *
 * Le proxy ne fait qu'un contrôle optimiste sur la présence du cookie : la
 * documentation de Next est explicite, il ne doit pas porter la gestion de
 * session. La vérification en base a donc lieu dans ce layout, et chaque action
 * serveur d'écriture la refait de son côté - une action serveur est une route
 * publique, atteignable sans passer par la moindre page.
 *
 * `getSession()` interroge la base à chaque requête. C'est un aller-retour par
 * navigation dans l'administration, ce qui est sans importance là où le trafic se
 * compte en dizaines de requêtes par jour, et ce qui permet à une révocation de
 * session de prendre effet immédiatement.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession()

  if (!session) {
    redirect("/admin/login")
  }

  return <AdminShell session={session}>{children}</AdminShell>
}
