"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

/**
 * Entrée de navigation de l'administration.
 *
 * Elle ne réutilise pas `NavLink` du site public parce que la règle d'activité
 * diffère : « Tableau de bord » pointe sur `/admin`, qui préfixe toutes les autres
 * routes. Un simple `startsWith` l'allumerait en permanence. La racine se compare
 * donc à l'identique, les autres par préfixe.
 */
function AdminNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isCurrent =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-[0.9rem] transition-colors duration-100",
        isCurrent
          ? "bg-inset font-medium text-ink"
          : "text-body hover:bg-inset hover:text-ink"
      )}
    >
      {children}
    </Link>
  )
}

export { AdminNavLink }
