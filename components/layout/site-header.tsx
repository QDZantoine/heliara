import Link from "next/link"

import { Logo } from "@/components/layout/logo"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { NavLink } from "@/components/layout/nav-link"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import { cta, mainNav } from "@/lib/site"

/**
 * Sticky translucide : le CTA primaire vit dans la nav dès la première seconde
 * (Architecture UX, S1). Six entrées, un seul élément accentué.
 *
 * Les entrées d'expertise ne sont transmises qu'au menu mobile : la nav horizontale
 * n'a pas de sous-menu, elle mène au hub. Elles arrivent du layout, qui les lit en
 * base.
 */
function SiteHeader({
  expertiseNav,
}: {
  expertiseNav: readonly { label: string; href: string }[]
}) {
  return (
    <header className="sticky top-0 z-200 border-b border-line bg-[color-mix(in_srgb,var(--hel-page)_82%,transparent)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-17 max-w-page items-center justify-between gap-4 pr-5 pl-5 md:pl-6">
        <Link
          href="/"
          aria-label="Heliara, retour à l’accueil"
          className="flex items-center"
        >
          <Logo alt="" />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-5 menu:flex lg:gap-6"
        >
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="text-[0.845rem] font-medium text-body transition-colors duration-100 hover:text-ink"
              activeClassName="text-ink font-semibold"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ButtonLink href={cta.primary.href} variant="brand" size="md">
            <CtaIcon />
            <span className="hidden menu:inline">{cta.primary.label}</span>
            <span className="menu:hidden">{cta.primary.shortLabel}</span>
          </ButtonLink>
          <MobileMenu expertiseNav={expertiseNav} />
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }
