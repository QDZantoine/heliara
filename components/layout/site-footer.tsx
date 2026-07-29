import Link from "next/link"

import { Logo } from "@/components/layout/logo"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Container } from "@/components/primitives/container"
import { footerNav, group, legalNav, site } from "@/lib/site"

/**
 * Filet de sécurité + endossement (Architecture UX, S10).
 * L'appartenance au groupe Hexceos vit ici : visible pour qui cherche la
 * solidité, absente du récit principal.
 *
 * Ordre mobile imposé par les Responsive Guidelines : marque, Contact,
 * Expertises, Studio, puis ligne légale et endossement en dernier.
 */
function SiteFooter({
  expertiseNav,
}: {
  expertiseNav: readonly { label: string; href: string }[]
}) {
  const year = new Date().getFullYear()

  /*
    La colonne « Expertises » est reconstruite à partir des familles lues en base ;
    les deux autres restent celles de `lib/site.ts`.

    `footerNav[0]` conserve son dernier lien - « Maintenance évolutive » - qui pointe
    un service et non une famille : il n'a pas d'entrée de nav, mais il mérite sa place
    dans le pied de page.
  */
  const columns = footerNav.map((column, index) =>
    index === 0
      ? {
          ...column,
          links: [
            ...expertiseNav,
            ...column.links.filter(
              (link) => !expertiseNav.some((one) => one.href === link.href)
            ),
          ],
        }
      : column
  )

  return (
    <footer className="border-t border-inverse-line bg-inverse">
      <Container className="pt-16 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="inverse" />
            <p className="mt-3 max-w-60 text-sm leading-relaxed text-inverse-fg-faint">
              {site.baseline}
            </p>
          </div>

          {/* La colonne « Expertises » vient de la base : ses entrées sont les
              familles administrables. Les deux autres sont statiques - elles
              pointent des pages, pas du contenu. */}
          {columns.map((column, index) => (
            <div
              key={column.title}
              className={index === 2 ? "max-md:order-1" : "max-md:order-2"}
            >
              <p className="mb-3.5 text-[0.6875rem] font-semibold tracking-[0.12em] text-inverse-fg-faint uppercase">
                {column.title}
              </p>
              <ul className="grid gap-1">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-inverse-fg-muted transition-colors duration-100 hover:text-inverse-fg md:min-h-0 md:py-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-inverse-line pt-5 text-xs text-inverse-fg-faint">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="flex flex-wrap items-center gap-x-2">
              <span>© {year} Heliara. Tous droits réservés.</span>
              {legalNav.map((item) => (
                <span key={item.href} className="flex items-center gap-x-2">
                  <span aria-hidden="true">·</span>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center transition-colors duration-100 hover:text-inverse-fg-muted md:min-h-0"
                  >
                    {item.label}
                  </Link>
                </span>
              ))}
            </p>
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-6">
              <ThemeToggle />
              <Link
                href={group.href}
                className="inline-flex min-h-11 items-center transition-colors duration-100 hover:text-inverse-fg-muted md:min-h-0"
              >
                {group.endorsement}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export { SiteFooter }
