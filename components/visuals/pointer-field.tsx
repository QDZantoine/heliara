"use client"

import { useEffect, useRef } from "react"

/**
 * Une zone qui suit le pointeur, et ne fait rien d'autre que poser deux variables CSS.
 *
 * `--px` et `--py` vont de -1 à 1, du coin haut gauche au coin bas droit de la zone ;
 * le CSS en tire la profondeur des écrans du hero et la position de sa lueur. **Aucun
 * état React** : la position change soixante fois par seconde, la faire passer par un
 * rendu serait payer une réconciliation par image pour deux nombres.
 *
 * Trois gardes, et sans elles rien ne se passe :
 *
 * - **pointeur fin seulement** (`pointer: fine`) : au doigt il n'y a pas de survol, et
 *   un toucher ferait sauter la composition vers le point touché ;
 * - **`prefers-reduced-motion`** respecté, relu à chaque mouvement pour suivre un
 *   changement de préférence sans recharger ;
 * - **une écriture par image** au plus, regroupée dans un `requestAnimationFrame`.
 *
 * Sans JavaScript, les variables restent absentes et le CSS retombe sur zéro : la
 * composition est celle de départ.
 */
function PointerField({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const fine = window.matchMedia("(pointer: fine)")
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0

    const write = (x: number, y: number) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        node.style.setProperty("--px", x.toFixed(3))
        node.style.setProperty("--py", y.toFixed(3))
      })
    }

    const onMove = (event: PointerEvent) => {
      if (!fine.matches || reduce.matches) return
      const box = node.getBoundingClientRect()
      write(
        ((event.clientX - box.left) / box.width) * 2 - 1,
        ((event.clientY - box.top) / box.height) * 2 - 1
      )
    }
    const onLeave = () => write(0, 0)

    node.addEventListener("pointermove", onMove)
    node.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(frame)
      node.removeEventListener("pointermove", onMove)
      node.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export { PointerField }
