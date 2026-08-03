import Link from "next/link"

type BreadcrumbProps = {
  /** Le dernier élément est la page courante et n’est pas un lien. */
  items: { label: string; href?: string }[]
}

function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d’Ariane">
      <ol className="flex flex-wrap items-center gap-2 text-[0.82rem] text-label">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="text-body transition-colors duration-100 hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export { Breadcrumb }
