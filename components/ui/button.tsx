import Link from "next/link"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Le focus visible vient de la règle globale `:focus-visible` (anneau bleu 2 px) :
 * pas d'anneau propre au bouton, pour ne jamais en cumuler deux.
 * Échelle de tailles pensée tactile d'abord : `md` = 44 px (cible minimale).
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-[background-color,border-color,box-shadow,transform,opacity] duration-[160ms] ease-expo select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Primaire : un seul par page en corps de page, plus la nav. */
        brand:
          "bg-brand-solid text-brand-on-solid hover:-translate-y-0.5 hover:bg-brand-solid-hover hover:shadow-glow active:translate-y-0 active:opacity-90",
        /** Secondaire : oriente vers la preuve, jamais en concurrence visuelle. */
        secondary:
          "border-line-strong bg-surface text-ink hover:border-ink active:bg-inset",
        ghost: "text-ink hover:bg-inset active:bg-inset",
        link: "text-brand-text underline-offset-4 hover:underline",
        outline:
          "border-line-strong bg-transparent text-ink hover:bg-inset active:bg-inset",
        destructive:
          "bg-danger-subtle text-danger-text hover:bg-danger hover:text-white",
        /** Sur fond encre : orange éclairci, texte encre. */
        inverse:
          "bg-inverse-brand text-inverse-on-brand hover:-translate-y-0.5 hover:shadow-glow hover:brightness-105 active:translate-y-0 active:opacity-90",
        "inverse-ghost":
          "text-inverse-fg-muted hover:text-inverse-fg active:opacity-80",
      },
      size: {
        /** Hors cible tactile : réservé aux zones denses (filtres inline, tags). */
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-[1.125rem] text-sm",
        lg: "h-12 px-[1.625rem] text-[0.97rem]",
        xl: "h-13 px-[1.875rem] text-base",
        /** Pleine largeur empilée sous 640 px (Responsive Guidelines 05). */
        block: "h-13 w-full px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

type ButtonLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>

/** Même habillage que Button, mais c'est un lien : navigation, pas action. */
function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return (
    <Link
      data-slot="button-link"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, ButtonLink, buttonVariants }
