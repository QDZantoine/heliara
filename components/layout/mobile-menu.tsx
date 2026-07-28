"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog } from "@base-ui/react/dialog"
import { Menu, X } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { Halo } from "@/components/primitives/halo"
import { buttonVariants } from "@/components/ui/button"
import { cta, expertiseNav, group, legalNav, mainNav } from "@/lib/site"
import { cn } from "@/lib/utils"

const iconButton =
  "inline-flex size-11 items-center justify-center rounded-sm border border-line-strong bg-surface text-ink transition-colors duration-100 hover:bg-inset"

/**
 * Menu plein écran sous 900 px.
 * `Dialog` de Base UI fournit role=dialog, aria-modal, le piège à focus,
 * la fermeture par Échap et le verrou de scroll (Responsive Guidelines 04).
 */
function MobileMenu() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const close = () => setOpen(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Ouvrir le menu"
        className={cn(iconButton, "menu:hidden")}
      >
        <Menu className="size-[1.125rem]" strokeWidth={1.5} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Popup
          aria-label="Menu"
          className="fixed inset-0 z-400 flex flex-col overflow-y-auto bg-page transition-[opacity,transform] duration-[240ms] ease-expo data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0"
        >
          <Halo variant="warm" className="fixed" />

          <div className="relative flex h-17 flex-none items-center justify-between border-b border-line pr-5 pl-5 md:pl-6">
            <Logo />
            <Dialog.Close aria-label="Fermer le menu" className={iconButton}>
              <X className="size-4" strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          <nav
            aria-label="Menu principal"
            className="relative flex flex-1 flex-col px-5 py-7 md:px-6"
          >
            {mainNav.map((item, index) => {
              const isCurrent = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-center justify-between border-b border-line px-1 py-2 font-display text-[1.8125rem] font-bold tracking-[-0.025em]",
                    isCurrent ? "text-brand-text" : "text-ink"
                  )}
                >
                  {item.label}
                  <span className="font-mono text-[0.6875rem] font-normal tracking-normal text-label">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              )
            })}

            <div className="mt-6 grid grid-cols-1 gap-x-5 sm:grid-cols-2">
              {expertiseNav.map((family) => (
                <Link
                  key={family.href}
                  href={family.href}
                  onClick={close}
                  className="flex min-h-11 items-center text-[0.9rem] text-body hover:text-ink"
                >
                  {family.label}
                </Link>
              ))}
              <Link
                href="/expertises"
                onClick={close}
                className="flex min-h-11 items-center text-[0.9rem] text-body hover:text-ink"
              >
                Toutes les expertises
              </Link>
            </div>
          </nav>

          <div className="relative flex-none border-t border-line px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-6">
            <Link
              href={cta.primary.href}
              onClick={close}
              className={cn(buttonVariants({ size: "block" }), "mb-4")}
            >
              {cta.primary.label}
            </Link>
            <div className="flex flex-wrap justify-between gap-3 text-xs text-label">
              <Link
                href={group.href}
                onClick={close}
                className="inline-flex min-h-11 items-center hover:text-body"
              >
                Une marque du groupe {group.name}
              </Link>
              <Link
                href={legalNav[0].href}
                onClick={close}
                className="inline-flex min-h-11 items-center hover:text-body"
              >
                {legalNav[0].label}
              </Link>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { MobileMenu }
