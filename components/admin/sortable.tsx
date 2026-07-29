"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Listes réordonnables à la souris **et au clavier**.
 *
 * C'est la raison d'être de dnd-kit ici plutôt que de l'API de glisser-déposer du
 * navigateur : celle-ci n'a aucun équivalent clavier, et une liste qu'on ne peut
 * réordonner qu'à la souris est inutilisable pour une partie des gens. Le capteur
 * clavier de dnd-kit donne Espace pour saisir, les flèches pour déplacer, Échap
 * pour annuler.
 *
 * Le composant ne connaît rien du contenu : il rend une poignée et délègue le reste
 * à l'appelant.
 */

type Identified = { id: string }

type SortableListProps<T extends Identified> = {
  items: T[]
  onReorder: (items: T[]) => void
  children: (item: T, index: number) => React.ReactNode
  /**
   * Identifiant du contexte, **obligatoire en pratique**.
   *
   * dnd-kit fabrique les identifiants de ses descriptions d'accessibilité à partir
   * d'un compteur de module : celui du serveur et celui du client ne coïncident
   * pas, et React signale une divergence d'hydratation sur `aria-describedby`.
   * Un identifiant explicite et stable règle le problème, et il doit être unique
   * par liste dans la page.
   */
  id: string
  className?: string
}

function SortableList<T extends Identified>({
  items,
  onReorder,
  children,
  id,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    // 6 px avant de saisir : sans ce seuil, un simple clic sur un bouton de la
    // ligne serait pris pour un début de glissement.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const from = items.findIndex((item) => item.id === active.id)
    const to = items.findIndex((item) => item.id === over.id)
    if (from === -1 || to === -1) {
      return
    }
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={cn("grid gap-2", className)}>
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id}>
              {children(item, index)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

/** Une ligne, avec sa poignée. Le contenu est libre. */
function SortableRow({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-start gap-2 rounded-lg border bg-surface",
        // La ligne saisie passe au-dessus des autres et prend de l'ombre : sans
        // cela, elle glisse sous ses voisines et on perd le fil.
        isDragging ? "z-10 border-brand shadow-3" : "border-line"
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        // Le libellé est explicite parce que la poignée porte tout le geste : sans
        // lui, un lecteur d'écran annoncerait un bouton sans objet.
        aria-label="Déplacer cet élément"
        className="mt-2 ml-1 grid size-8 shrink-0 cursor-grab place-items-center rounded-xs text-label transition-colors duration-100 hover:bg-inset hover:text-ink active:cursor-grabbing"
      >
        <GripVertical className="size-4" strokeWidth={1.5} />
      </button>
      <div className="min-w-0 flex-1 py-2 pr-2">{children}</div>
    </li>
  )
}

export { SortableList }
