/** Évitement du bandeau de navigation au clavier (WCAG 2.4.1). */
function SkipLink() {
  return (
    <a
      href="#contenu"
      className="sr-only rounded-sm border-line-strong bg-surface px-4 py-3 text-sm font-medium text-ink focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-500 focus-visible:border focus-visible:shadow-3"
    >
      Aller au contenu
    </a>
  )
}

export { SkipLink }
