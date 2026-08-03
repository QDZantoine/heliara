"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

type NavLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string
  /** Classes ajoutées quand la route courante est cette entrée ou une de ses filles. */
  activeClassName?: string
}

/**
 * Lien de navigation qui porte `aria-current="page"` sur la branche active.
 * Client uniquement pour lire le pathname : aucune autre logique.
 */
function NavLink({ href, className, activeClassName, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const isCurrent = href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(className, isCurrent && activeClassName)}
      {...props}
    />
  )
}

export { NavLink }
