import { cn } from "@/lib/utils"

/**
 * Un titre d'affiche qui entre mot à mot, terminé par le point orange.
 *
 * Chaque mot est un `span` avec son rang `--w` (`hel-title-word`) : il monte de
 * quelques dixièmes d'em, **par translation seule** - le titre d'en-tête est le LCP de
 * sa page, et Chrome n'élit pas un élément peint à opacité nulle. L'espace reste dans
 * le span : la phrase se replie comme un texte ordinaire, et un lecteur d'écran la lit
 * d'un trait.
 *
 * Sans JavaScript ni sous mouvement réduit, le titre est simplement là.
 */
function DisplayTitle({
  text,
  as: Tag = "h1",
  dot = true,
  className,
  id,
}: {
  text: string
  as?: "h1" | "h2"
  /** Le point orange final : le geste de l'écran. */
  dot?: boolean
  className?: string
  id?: string
}) {
  const words = text.split(" ")

  return (
    <Tag id={id} className={cn(className)}>
      {words.map((word, index) => (
        <span
          key={index}
          className="hel-title-word"
          style={{ "--w": index } as React.CSSProperties}
        >
          {word}
          {dot && index === words.length - 1 ? (
            <span className="text-brand">.</span>
          ) : null}
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  )
}

export { DisplayTitle }
