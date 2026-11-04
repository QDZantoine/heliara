import Link from "next/link"

import { Logo } from "@/components/layout/logo"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { NavLink } from "@/components/layout/nav-link"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ButtonLink } from "@/components/ui/button"
import { CtaIcon } from "@/components/ui/cta-icon"
import { cta, mainNav } from "@/lib/site"

/**
 * Sticky translucide : le CTA primaire vit dans la nav dès la première seconde
 * (Architecture UX, S1). Six entrées, un seul élément accentué, plus le sélecteur
 * de thème.
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
    <header className="sticky top-0 z-200">
      {/*
        La plaque porte le fond, le filet et le flou, et c'est elle qui bouge : au
        défilement, elle se détache du bord et devient une pilule flottante au-dessus de
        la page (`hel-header-float`, piloté par le défilement en CSS). Le contenu descend
        d'autant pour rester centré dedans. Là où le navigateur ne sait pas piloter une
        animation au défilement, la barre reste celle d'origine.
      */}
      <div
        aria-hidden="true"
        className="hel-header-plate absolute inset-0 border border-transparent border-b-line bg-[color-mix(in_srgb,var(--hel-page)_82%,transparent)] backdrop-blur-[14px]"
      />
      <div className="hel-header-inner relative mx-auto flex h-17 max-w-page items-center justify-between gap-4 pr-5 pl-5 menu:grid menu:grid-cols-[1fr_auto_1fr] md:pl-6">
        <Link
          href="/"
          aria-label="Heliara, retour à l’accueil"
          className="flex items-center justify-self-start"
        >
          <Logo alt="" />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-1 menu:flex"
        >
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-[0.845rem] font-medium text-body transition-[color,background-color] duration-150 ease-expo hover:bg-inset hover:text-ink"
              activeClassName="bg-inset text-ink font-semibold"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 justify-self-end">
          {/* Le sélecteur de thème, le même interrupteur animé que dans le pied de
              page, sans libellé visible. Masqué sous 640 px, où la barre n'a plus
              la place : il passe dans le menu plein écran. */}
          <div className="flex items-center max-sm:hidden">
            <ThemeToggle variant="nav" />
          </div>
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
