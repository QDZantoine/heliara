import {
  BadgeCheck,
  BookOpen,
  ExternalLink,
  FolderOpen,
  LayoutDashboard,
  Layers,
  LogOut,
  Quote,
  Users,
  UsersRound,
} from "lucide-react"

import { logout } from "@/app/admin/actions"
import { AdminNavLink } from "@/components/admin/admin-nav-link"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import type { SessionUser } from "@/lib/auth/session"
import { publicSiteUrl } from "@/lib/public-url"

/**
 * Entrées de l'administration. Une par collection de contenu, dans l'ordre où
 * elles comptent : les réalisations d'abord, ce sont elles qui portent la preuve.
 *
 * Les entrées marquées `soon` ne sont pas encore construites : elles figurent
 * pour que la portée du chantier reste visible, et sont désactivées plutôt que
 * cachées.
 */
const nav = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/realisations", label: "Réalisations", icon: FolderOpen },
  { href: "/admin/articles", label: "Articles", icon: BookOpen },
  { href: "/admin/expertises", label: "Expertises", icon: Layers },
  { href: "/admin/references", label: "Références", icon: BadgeCheck },
  { href: "/admin/equipe", label: "Équipe", icon: UsersRound },
  { href: "/admin/temoignages", label: "Témoignages", icon: Quote },
  { href: "/admin/comptes", label: "Comptes", icon: Users, soon: true },
] as const

/**
 * Coque de l'administration : une colonne de navigation, une zone de contenu.
 *
 * Sobre à dessein. Les règles de la DA - un seul geste orange, un seul halo,
 * arc affirmation vers preuve vers action - servent à convaincre un visiteur ;
 * un back-office doit surtout être lisible et prévisible. Les jetons de couleur
 * restent les mêmes, le dark mode fonctionne, mais aucun halo et aucune
 * apparition au scroll.
 */
function AdminShell({
  session,
  children,
}: {
  session: SessionUser
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-page lg:grid lg:grid-cols-[16rem_1fr]">
      {/* `sticky` avec une hauteur propre : sans cela, la colonne s'étire à la
          hauteur du contenu - un formulaire d'édition fait plusieurs écrans - et
          le bloc du bas, compte et déconnexion, part hors de vue. Elle défile
          pour elle-même si jamais ses entrées dépassent l'écran. */}
      <aside className="flex flex-col gap-6 border-line bg-surface px-4 py-5 lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:overflow-y-auto lg:border-r">
        <div className="flex items-center justify-between gap-3 px-1">
          <Logo />
          <span className="rounded-xs bg-inset px-2 py-1 font-mono text-[0.6875rem] tracking-[0.06em] text-label uppercase">
            Admin
          </span>
        </div>

        <nav aria-label="Administration" className="flex-1">
          <ul className="grid gap-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                {"soon" in item && item.soon ? (
                  <span
                    aria-disabled="true"
                    className="flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-[0.9rem] text-faint"
                  >
                    <item.icon className="size-4 shrink-0" strokeWidth={1.5} />
                    {item.label}
                    <span className="ml-auto text-[0.6875rem] text-faint">
                      à venir
                    </span>
                  </span>
                ) : (
                  <AdminNavLink href={item.href}>
                    <item.icon className="size-4 shrink-0" strokeWidth={1.5} />
                    {item.label}
                  </AdminNavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-2 border-t border-line pt-4">
          {/* Une ancre et non `next/link` : la cible est une autre origine, celle
              du déploiement de lecture. Un lien relatif resterait sur le port
              d'écriture, où tout ce qui n'est pas `/admin` répond 404. */}
          <a
            href={publicSiteUrl("/")}
            target="_blank"
            rel="noopener"
            className="flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-[0.845rem] text-body hover:bg-inset hover:text-ink"
          >
            <ExternalLink className="size-4 shrink-0" strokeWidth={1.5} />
            Voir le site
          </a>

          <div className="px-3 pt-1">
            <p className="truncate text-[0.845rem] font-medium text-ink">
              {session.displayName}
            </p>
            <p className="truncate text-xs text-label">{session.email}</p>
          </div>

          {/* Une déconnexion modifie l'état du serveur : c'est un POST, donc un
              formulaire, jamais un lien. */}
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="md"
              className="w-full justify-start px-3 text-[0.845rem] text-body"
            >
              <LogOut className="size-4 shrink-0" strokeWidth={1.5} />
              Se déconnecter
            </Button>
          </form>
        </div>
      </aside>

      <main
        id="contenu"
        className="min-w-0 px-5 py-8 md:px-8 lg:px-10 lg:py-10"
      >
        {children}
      </main>
    </div>
  )
}

export { AdminShell }
