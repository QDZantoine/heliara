"use client"

import * as React from "react"
import { Heading2, List, Plus, Quote, Text, Trash2 } from "lucide-react"

import { RemoveButton } from "@/components/admin/form-kit"
import { RichText } from "@/components/admin/rich-text"
import { SortableList } from "@/components/admin/sortable"
import {
  blockLabels,
  emptyBlock,
  type BlockInput,
  type BlockKind,
} from "@/lib/schemas/article"
import { cn } from "@/lib/utils"

const input =
  "border-line-strong bg-surface text-ink placeholder:text-faint h-10 w-full rounded-sm border px-3 text-[0.94rem] transition-colors duration-100"
const area =
  "border-line-strong bg-surface text-ink placeholder:text-faint w-full rounded-sm border px-3 py-2.5 text-[0.94rem] leading-relaxed"

/** Un bloc muni d'une clé locale, pour que dnd-kit et React puissent le suivre. */
export type BlockRow = { id: string; block: BlockInput }

let counter = 0
export function withBlockId(block: BlockInput): BlockRow {
  counter += 1
  return { id: `block-${counter}`, block }
}

const icons: Record<BlockKind, React.ComponentType<{ className?: string }>> = {
  paragraph: Text,
  heading: Heading2,
  callout: Quote,
  numbered: List,
}

/**
 * Éditeur du corps d'un article, en blocs typés.
 *
 * **Pourquoi des blocs et non un seul champ de texte riche.** Le rendu du site
 * distingue quatre formes : un paragraphe, un intertitre, un encadré à chapô, et une
 * grille numérotée. Les deux dernières portent une structure - `lead` + `text`,
 * puis des triplets `num` / `title` / `text` - qu'aucun HTML de corps de texte ne
 * saurait exprimer. Écraser tout cela en une chaîne HTML ferait perdre deux formes
 * de la DA et rendrait le contenu impossible à re-styler.
 *
 * Le corps des paragraphes et des encadrés passe malgré tout par l'éditeur riche :
 * à l'intérieur d'un bloc, le gras, l'italique et les liens ont leur place.
 */
function BlockEditor({
  rows,
  onChange,
  errorAt,
}: {
  rows: BlockRow[]
  onChange: (rows: BlockRow[]) => void
  /**
   * L'erreur portant sur un bloc, affichée sous lui.
   *
   * Sans elle, un intertitre vide au huitième bloc ne se signalait qu'en tête de
   * formulaire, sous la forme du premier message rencontré : il fallait deviner
   * lequel des blocs était en cause, et un corps long en compte vingt.
   */
  errorAt?: (index: number) => string | undefined
}) {
  const update = (id: string, block: BlockInput) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, block } : row)))

  const remove = (id: string) => onChange(rows.filter((row) => row.id !== id))

  const add = (kind: BlockKind) =>
    onChange([...rows, withBlockId(emptyBlock(kind))])

  return (
    <div className="grid gap-4">
      {/* Le rôle du corps est dit par l'en-tête de l'étape : ne reste ici que ce
          qui ne se devine pas, le geste clavier. */}
      <p className="text-[0.8rem] text-label">
        Attrapez une poignée pour déplacer un bloc, ou saisissez-la au clavier
        avec Espace puis les flèches.
      </p>

      {rows.length > 0 ? (
        <SortableList id="blocks" items={rows} onReorder={onChange}>
          {(row, index) => {
            const error = errorAt?.(index)
            return (
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <BlockBadge kind={row.block.kind} />
                  <span className="font-mono text-xs text-label">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1" />
                  <RemoveButton
                    label={`Retirer le bloc ${index + 1}`}
                    onClick={() => remove(row.id)}
                  />
                </div>

                <BlockFields
                  block={row.block}
                  index={index}
                  onChange={(block) => update(row.id, block)}
                />

                {error ? (
                  <p className="text-[0.8rem] text-danger-text">{error}</p>
                ) : null}
              </div>
            )
          }}
        </SortableList>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-5 py-6 text-center text-[0.9rem] text-label">
          Aucun bloc. Commencez par un paragraphe.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(blockLabels) as BlockKind[]).map((kind) => {
          const Icon = icons[kind]
          return (
            <button
              key={kind}
              type="button"
              onClick={() => add(kind)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3.5 text-[0.875rem] font-medium text-body transition-colors duration-100 hover:border-ink hover:text-ink"
            >
              <Plus className="size-3.5" />
              <Icon className="size-3.5" />
              {blockLabels[kind]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BlockBadge({ kind }: { kind: BlockKind }) {
  const Icon = icons[kind]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase",
        kind === "callout"
          ? "bg-brand-subtle text-brand-text"
          : "bg-inset text-label"
      )}
    >
      <Icon className="size-2.5" />
      {blockLabels[kind]}
    </span>
  )
}

/** Les champs propres à chaque type. L'union discriminée guide le rendu. */
function BlockFields({
  block,
  index,
  onChange,
}: {
  block: BlockInput
  index: number
  onChange: (block: BlockInput) => void
}) {
  if (block.kind === "heading") {
    return (
      <input
        aria-label={`Intertitre du bloc ${index + 1}`}
        placeholder="Les sept questions qui tranchent"
        className={cn(input, "font-display font-bold")}
        value={block.text}
        onChange={(event) =>
          onChange({ kind: "heading", text: event.target.value })
        }
      />
    )
  }

  if (block.kind === "paragraph") {
    return (
      <RichText
        value={block.text}
        onChange={(html) => onChange({ kind: "paragraph", text: html })}
        placeholder="Le paragraphe…"
      />
    )
  }

  if (block.kind === "callout") {
    return (
      <div className="grid gap-2 border-l-2 border-brand pl-3">
        <input
          aria-label={`Phrase mise en exergue du bloc ${index + 1}`}
          placeholder="La phrase mise en exergue."
          className={cn(input, "font-medium")}
          value={block.lead}
          onChange={(event) => onChange({ ...block, lead: event.target.value })}
        />
        <RichText
          value={block.text}
          onChange={(html) => onChange({ ...block, text: html })}
          placeholder="Ce qui l'explique…"
        />
      </div>
    )
  }

  // `numbered`. Les entrées se gèrent à plat : elles n'ont pas d'identité, donc pas
  // de réordonnancement à la souris - la liste est courte et l'ordre se corrige en
  // retapant.
  return (
    <div className="grid gap-2">
      {block.items.map((item, position) => (
        <div
          key={position}
          className="grid gap-2 rounded-sm border border-line bg-inset/50 p-2.5"
        >
          <div className="flex items-center gap-2">
            <input
              aria-label={`Numéro de l'entrée ${position + 1}`}
              placeholder={String(position + 1).padStart(2, "0")}
              maxLength={4}
              className={cn(input, "w-16 text-center font-mono")}
              value={item.num ?? ""}
              onChange={(event) =>
                onChange({
                  ...block,
                  items: block.items.map((one, at) =>
                    at === position ? { ...one, num: event.target.value } : one
                  ),
                })
              }
            />
            <input
              aria-label={`Titre de l'entrée ${position + 1}`}
              placeholder="Titre de l'entrée"
              className={cn(input, "flex-1 font-medium")}
              value={item.title}
              onChange={(event) =>
                onChange({
                  ...block,
                  items: block.items.map((one, at) =>
                    at === position
                      ? { ...one, title: event.target.value }
                      : one
                  ),
                })
              }
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  items: block.items.filter((_, at) => at !== position),
                })
              }
              aria-label={`Retirer l'entrée ${position + 1}`}
              className="grid size-8 shrink-0 place-items-center rounded-xs text-label hover:bg-danger-subtle hover:text-danger-text"
            >
              <Trash2 className="size-3" strokeWidth={1.5} />
            </button>
          </div>
          <textarea
            rows={2}
            aria-label={`Texte de l'entrée ${position + 1}`}
            placeholder="Ce que dit cette entrée."
            className={area}
            value={item.text}
            onChange={(event) =>
              onChange({
                ...block,
                items: block.items.map((one, at) =>
                  at === position ? { ...one, text: event.target.value } : one
                ),
              })
            }
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange({
            ...block,
            items: [...block.items, { num: "", title: "", text: "" }],
          })
        }
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-sm border border-dashed border-line-strong text-[0.845rem] font-medium text-body hover:border-ink hover:text-ink"
      >
        <Plus className="size-3.5" />
        Ajouter une entrée
      </button>
    </div>
  )
}

export { BlockEditor }
