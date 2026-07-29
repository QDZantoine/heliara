"use client"

import * as React from "react"
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react"

import {
  confirmUpload,
  requestUpload,
} from "@/app/admin/(protected)/realisations/actions"
import { cn } from "@/lib/utils"

export type UploadedMedia = {
  id: string
  url: string
  alt: string
  width: number | null
  height: number | null
  originalName: string
}

type DropzoneProps = {
  label: string
  hint?: string
  /** Un seul fichier (visuel de hero) ou plusieurs (galerie). */
  multiple?: boolean
  value: UploadedMedia[]
  onChange: (media: UploadedMedia[]) => void
  className?: string
}

/** Les formats acceptés, repris de `lib/s3.ts`. */
const ACCEPT = "image/webp,image/avif,image/png,image/jpeg,image/svg+xml"
const MAX_BYTES = 8 * 1024 * 1024

type Pending = {
  key: string
  name: string
  progress: number
  error?: string
}

type Dimensions = { width?: number; height?: number }

/**
 * Lit les dimensions d'une image dans le navigateur.
 *
 * C'est le seul endroit où elles peuvent être connues sans décoder le fichier
 * côté serveur, et elles comptent : sans `width` et `height`, `next/image` ne peut
 * pas réserver la place et l'arrivée de l'image décale la mise en page.
 *
 * Un SVG n'a pas toujours de dimensions intrinsèques : l'absence est acceptée
 * plutôt que de refuser le fichier.
 */
async function readDimensions(file: File): Promise<Dimensions> {
  if (typeof createImageBitmap !== "function") {
    return {}
  }
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return {}
  }
}

/**
 * Empreinte SHA-256 du contenu, calculée par le navigateur.
 *
 * Elle permet à la base de reconnaître un fichier déjà présent et de ne pas
 * stocker deux fois le même octet. `crypto.subtle` n'existe qu'en contexte sûr -
 * HTTPS ou localhost - donc l'absence est tolérée : la déduplication est un
 * agrément, pas une exigence.
 */
async function checksumOf(file: File) {
  if (!globalThis.crypto?.subtle) {
    return undefined
  }
  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      await file.arrayBuffer()
    )
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  } catch {
    return undefined
  }
}

/**
 * Dépôt d'images par glisser-déposer.
 *
 * **Le fichier ne traverse pas l'application.** L'action serveur signe une URL,
 * le navigateur envoie l'octet directement à MinIO, puis une seconde action
 * confirme. D'où la progression réelle plutôt qu'estimée : elle vient de
 * l'évènement `progress` de la requête de dépôt.
 *
 * `XMLHttpRequest` et non `fetch` : c'est la seule API qui rapporte la progression
 * d'un envoi. `fetch` ne sait le faire que pour la réception.
 *
 * Trois choses restent vraies quoi qu'il arrive : le champ de fichier natif reste
 * atteignable au clavier, une erreur par fichier n'empêche pas les autres
 * d'aboutir, et un dépôt interrompu ne laisse rien d'affichable - le média n'est
 * `ready` qu'après confirmation.
 */
function MediaDropzone({
  label,
  hint,
  multiple = false,
  value,
  onChange,
  className,
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [pending, setPending] = React.useState<Pending[]>([])
  /** Compteur d'entrées/sorties : `dragleave` se déclenche aussi sur les enfants. */
  const depth = React.useRef(0)

  const upload = React.useCallback(async (file: File) => {
    const key = `${file.name}-${file.size}-${Math.random()}`
    setPending((list) => [...list, { key, name: file.name, progress: 0 }])

    const fail = (message: string) =>
      setPending((list) =>
        list.map((item) =>
          item.key === key ? { ...item, error: message } : item
        )
      )
    const done = () =>
      setPending((list) => list.filter((item) => item.key !== key))

    if (file.size > MAX_BYTES) {
      fail(`Ce fichier dépasse ${MAX_BYTES / 1024 / 1024} Mo.`)
      return null
    }

    const [checksum, dimensions] = await Promise.all([
      checksumOf(file),
      readDimensions(file),
    ])

    const ticket = await requestUpload({
      mimeType: file.type,
      byteSize: file.size,
      originalName: file.name,
      checksum,
    })

    if (ticket.status === "error") {
      fail(ticket.formError)
      return null
    }

    // Le fichier était déjà stocké : rien à envoyer.
    if (ticket.status === "exists") {
      done()
      return {
        id: ticket.mediaId,
        url: ticket.objectUrl,
        alt: "",
        width: dimensions.width ?? null,
        height: dimensions.height ?? null,
        originalName: file.name,
      }
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open("PUT", ticket.url)
        request.setRequestHeader("Content-Type", file.type)
        request.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable) {
            return
          }
          const progress = Math.round((event.loaded / event.total) * 100)
          setPending((list) =>
            list.map((item) =>
              item.key === key ? { ...item, progress } : item
            )
          )
        })
        request.addEventListener("load", () =>
          request.status >= 200 && request.status < 300
            ? resolve()
            : reject(new Error(`Dépôt refusé (${request.status}).`))
        )
        request.addEventListener("error", () =>
          reject(new Error("Le dépôt a échoué."))
        )
        request.addEventListener("abort", () =>
          reject(new Error("Dépôt interrompu."))
        )
        request.send(file)
      })
    } catch (error) {
      fail(error instanceof Error ? error.message : "Le dépôt a échoué.")
      return null
    }

    const confirmed = await confirmUpload(ticket.mediaId, {
      ...dimensions,
      byteSize: file.size,
    })

    if (confirmed.status === "error" || !confirmed.url) {
      fail(confirmed.formError ?? "La confirmation a échoué.")
      return null
    }

    done()
    return {
      id: ticket.mediaId,
      url: confirmed.url,
      alt: "",
      width: dimensions.width ?? null,
      height: dimensions.height ?? null,
      originalName: file.name,
    }
  }, [])

  const handleFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      const accepted = multiple ? list : list.slice(0, 1)
      // Les dépôts partent en parallèle : un fichier lent ne retarde pas les autres.
      const results = await Promise.all(accepted.map(upload))
      const uploaded = results.filter((item): item is UploadedMedia =>
        Boolean(item)
      )
      if (uploaded.length === 0) {
        return
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded)
    },
    [multiple, onChange, upload, value]
  )

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="grid gap-0.5">
        <span className="text-[0.82rem] font-medium text-ink">{label}</span>
        {hint ? <span className="text-xs text-label">{hint}</span> : null}
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault()
          depth.current += 1
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault()
          depth.current -= 1
          if (depth.current <= 0) {
            depth.current = 0
            setDragging(false)
          }
        }}
        onDrop={(event) => {
          event.preventDefault()
          depth.current = 0
          setDragging(false)
          if (event.dataTransfer.files.length) {
            handleFiles(event.dataTransfer.files)
          }
        }}
        className={cn(
          "grid place-items-center gap-2 rounded-lg border-2 border-dashed px-5 py-8 text-center transition-colors duration-100",
          dragging
            ? "border-brand bg-brand-subtle"
            : "border-line-strong bg-inset"
        )}
      >
        <Upload
          aria-hidden="true"
          className={cn("size-5", dragging ? "text-brand-text" : "text-label")}
          strokeWidth={1.5}
        />
        <p className="text-[0.9rem] text-body">
          Glissez {multiple ? "des images" : "une image"} ici, ou{" "}
          {/* Le bouton pilote le champ natif : le clavier garde un chemin. */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-info-text underline underline-offset-2 hover:no-underline"
          >
            parcourez vos fichiers
          </button>
        </p>
        <p className="text-xs text-label">
          WebP, AVIF, PNG, JPEG ou SVG. {MAX_BYTES / 1024 / 1024} Mo maximum.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) {
              handleFiles(event.target.files)
            }
            // Remis à zéro pour que redéposer le même fichier déclenche l'évènement.
            event.target.value = ""
          }}
        />
      </div>

      {pending.length > 0 ? (
        <ul className="grid gap-1.5">
          {pending.map((item) => (
            <li
              key={item.key}
              className="grid gap-1 rounded-sm border border-line bg-surface px-3 py-2"
            >
              <div className="flex items-center gap-2 text-[0.82rem]">
                {item.error ? null : (
                  <Loader2
                    aria-hidden="true"
                    className="size-3.5 animate-spin text-label"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-body">
                  {item.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-xs",
                    item.error ? "text-danger-text" : "text-label"
                  )}
                >
                  {item.error ?? `${item.progress} %`}
                </span>
              </div>
              {item.error ? null : (
                <div
                  role="progressbar"
                  aria-label={`Envoi de ${item.name}`}
                  aria-valuenow={item.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-0.5 overflow-hidden rounded-full bg-inset"
                >
                  <div
                    className="h-full bg-brand transition-[width] duration-200 ease-out"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {value.length > 0 ? (
        <ul
          className={cn(
            "grid gap-2.5",
            multiple ? "grid-cols-2 sm:grid-cols-3" : "max-w-64"
          )}
        >
          {value.map((media) => (
            <li
              key={media.id}
              className="group/media relative overflow-hidden rounded-sm border border-line bg-inset"
            >
              {/* `img` et non `next/image` : l'optimiseur n'a rien à apporter sur
                  une vignette d'administration, et il faudrait déclarer l'hôte
                  MinIO dans la configuration pour un gain nul. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.url}
                alt={media.alt}
                className="aspect-4/3 w-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((item) => item.id !== media.id))
                }
                aria-label={`Retirer ${media.originalName}`}
                className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-sm bg-inverse/80 text-inverse-fg opacity-0 transition-opacity duration-100 group-hover/media:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-label">
          <ImagePlus
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={1.5}
          />
          Aucune image pour l&apos;instant.
        </p>
      )}
    </div>
  )
}

export { MediaDropzone }
