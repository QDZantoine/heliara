"use client"

import * as React from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react"

import { cn } from "@/lib/utils"

type RichTextProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Identifiant du champ, pour que le libellé pointe dessus. */
  id?: string
  invalid?: boolean
  describedBy?: string
  className?: string
}

/**
 * Éditeur de texte riche, bâti sur Tiptap.
 *
 * **Le jeu de marques est volontairement court** : gras, italique, lien, listes,
 * citation. Ni titres, ni couleurs, ni tailles - la hiérarchie et la typographie
 * appartiennent à la DA, pas à la personne qui rédige. Un éditeur qui laisse tout
 * faire produit des pages qui ne ressemblent plus au reste du site.
 *
 * Trois précautions qui comptent :
 *
 * - **`immediatelyRender: false`.** Tiptap rend au montage par défaut, ce qui
 *   provoque une erreur d'hydratation dans l'App Router : le serveur n'a pas
 *   d'éditeur, le client en a un. Next l'annonce en clair dans la console.
 * - **La valeur entrante n'est réappliquée que si elle diffère vraiment.**
 *   `setContent` replace le curseur en fin de document ; l'appeler à chaque rendu
 *   rendrait la frappe impossible.
 * - **Le contenu vide est rendu comme une chaîne vide**, pas comme `<p></p>`. Sans
 *   cela, un champ que personne n'a rempli passerait pour rempli et une validation
 *   `min(1)` ne verrait rien.
 */
function RichText({
  value,
  onChange,
  placeholder,
  id,
  invalid,
  describedBy,
  className,
}: RichTextProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // La hiérarchie de titres vient du gabarit de page, pas du corps de texte.
        heading: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener", target: "_blank" },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id: id ?? "",
        role: "textbox",
        "aria-multiline": "true",
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        class:
          "hel-prose min-h-32 px-3.5 py-3 text-[0.94rem] leading-relaxed text-ink outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      // `isEmpty` distingue un document réellement vide du paragraphe vide que
      // ProseMirror maintient toujours.
      onChange(current.isEmpty ? "" : current.getHTML())
    },
  })

  // Réapplique une valeur venue de l'extérieur - remise à zéro du formulaire,
  // chargement différé - sans perturber la frappe en cours.
  React.useEffect(() => {
    if (!editor) {
      return
    }
    const current = editor.isEmpty ? "" : editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    // Le temps que l'éditeur arrive, une boîte de la bonne hauteur : aucun
    // décalage de mise en page à son apparition.
    return (
      <div
        className={cn(
          "min-h-[calc(2.75rem+8rem)] rounded-sm border border-line-strong bg-surface",
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border bg-surface transition-colors duration-100",
        invalid ? "border-danger" : "border-line-strong",
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

/** Un bouton de barre d'outils. `aria-pressed` porte l'état, pas la couleur seule. */
function Tool({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      // `onMouseDown` avec `preventDefault` : sans lui, le clic retire le focus de
      // l'éditeur et la sélection est perdue avant que la commande s'applique.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-xs transition-colors duration-100 disabled:opacity-40",
        active ? "bg-ink text-page" : "text-body hover:bg-inset hover:text-ink"
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  /**
   * L'état des boutons dépend de la sélection, que React ne suit pas. On force un
   * rendu sur les évènements de l'éditeur plutôt que de recopier son état : c'est
   * lui la source de vérité, et le dupliquer les ferait divergerà la première
   * commande venue d'ailleurs.
   */
  const [, force] = React.useReducer((tick: number) => tick + 1, 0)

  React.useEffect(() => {
    editor.on("selectionUpdate", force)
    editor.on("transaction", force)
    return () => {
      editor.off("selectionUpdate", force)
      editor.off("transaction", force)
    }
  }, [editor])

  const setLink = () => {
    const current = editor.getAttributes("link").href as string | undefined
    const href = window.prompt("Adresse du lien", current ?? "https://")
    if (href === null) {
      return
    }
    if (href === "") {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-inset px-1.5 py-1">
      <Tool
        label="Gras"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" strokeWidth={2} />
      </Tool>
      <Tool
        label="Italique"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" strokeWidth={2} />
      </Tool>

      <span aria-hidden="true" className="mx-1 h-4 w-px bg-line-strong" />

      <Tool
        label="Liste à puces"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" strokeWidth={1.75} />
      </Tool>
      <Tool
        label="Liste numérotée"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" strokeWidth={1.75} />
      </Tool>
      <Tool
        label="Citation"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" strokeWidth={1.75} />
      </Tool>

      <span aria-hidden="true" className="mx-1 h-4 w-px bg-line-strong" />

      <Tool
        label="Insérer un lien"
        active={editor.isActive("link")}
        onClick={setLink}
      >
        <Link2 className="size-3.5" strokeWidth={1.75} />
      </Tool>
      <Tool
        label="Retirer le lien"
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Link2Off className="size-3.5" strokeWidth={1.75} />
      </Tool>

      <span className="flex-1" />

      <Tool
        label="Annuler"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-3.5" strokeWidth={1.75} />
      </Tool>
      <Tool
        label="Rétablir"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-3.5" strokeWidth={1.75} />
      </Tool>
    </div>
  )
}

export { RichText }
