"use client"

import * as React from "react"
import Link from "next/link"
import { Tabs } from "@base-ui/react/tabs"
import {
  Archive,
  Check,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  Trash2,
} from "lucide-react"

import {
  deleteArticle,
  publishArticle,
  setBlocks,
  updateArticle,
} from "@/app/admin/(protected)/articles/actions"
import {
  BlockEditor,
  withBlockId,
  type BlockRow,
} from "@/components/admin/block-editor"
import {
  MediaDropzone,
  type UploadedMedia,
} from "@/components/admin/media-dropzone"
import { Button } from "@/components/ui/button"
import type { ArticleDetail, ArticleViews } from "@/lib/db/articles"
import { publicSiteUrl } from "@/lib/public-url"
import { articleCategories, frenchDateLabel } from "@/lib/schemas/article"
import { cn } from "@/lib/utils"

const input =
  "border-line-strong bg-surface text-ink placeholder:text-label h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"
const area =
  "border-line-strong bg-surface text-ink placeholder:text-label w-full rounded-sm border px-3.5 py-3 text-[0.94rem] leading-relaxed aria-invalid:border-danger"

/**
 * Éditeur d'article : la fiche, le corps, l'audience.
 *
 * Trois onglets seulement, contre cinq pour une réalisation : un article est un
 * texte, pas une fiche à collections multiples. Chacun s'enregistre séparément, pour
 * la même raison qu'ailleurs - une saisie invalide dans un onglet ne doit pas coûter
 * le travail fait dans un autre.
 */
function ArticleEditor({
  item,
  views,
  caseSlugs,
}: {
  item: ArticleDetail
  views: ArticleViews
  /** Les slugs de réalisations publiées, pour proposer le rebond de fin d'article. */
  caseSlugs: string[]
}) {
  return (
    <div className="grid max-w-4xl gap-6">
      <Header item={item} />

      <Tabs.Root defaultValue="fiche">
        <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-line">
          {[
            ["fiche", "Fiche"],
            ["corps", `Corps (${item.blocks.length})`],
            ["audience", "Audience"],
          ].map(([value, label]) => (
            <Tabs.Tab
              key={value}
              value={value}
              className="-mb-px min-h-11 border-b-2 border-transparent px-3 text-[0.9rem] font-medium text-body transition-colors duration-100 hover:text-ink data-selected:border-brand data-selected:text-ink"
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="fiche">
          <FicheForm item={item} caseSlugs={caseSlugs} />
        </Tabs.Panel>
        <Tabs.Panel value="corps">
          <BodyForm item={item} />
        </Tabs.Panel>
        <Tabs.Panel value="audience">
          <Audience item={item} views={views} />
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  )
}

function Header({ item }: { item: ArticleDetail }) {
  const [busy, setBusy] = React.useState<"publish" | "delete" | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  return (
    <header className="grid gap-3">
      <div className="flex items-center gap-2 text-[0.82rem] text-label">
        <Link href="/admin/articles" className="hover:text-ink hover:underline">
          Articles
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-mono">{item.slug}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="max-w-[40rem] font-display text-[1.5rem] leading-tight font-bold tracking-[-0.02em] text-ink">
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 font-semibold tracking-[0.06em] uppercase",
                item.status === "published"
                  ? "bg-success-subtle text-success-text"
                  : "bg-inset text-label"
              )}
            >
              {item.status === "published" ? (
                <>
                  <Check className="size-2.5" strokeWidth={2.5} /> En ligne
                </>
              ) : (
                "Brouillon"
              )}
            </span>
            <Link
              href={`/admin/articles/${item.slug}/apercu`}
              className="inline-flex items-center gap-1 text-info-text hover:underline"
            >
              <Eye className="size-3" strokeWidth={1.75} />
              Aperçu
            </Link>
            {item.status === "published" ? (
              <a
                href={publicSiteUrl(`/ressources/${item.slug}`)}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-info-text hover:underline"
              >
                Voir en ligne
                <ExternalLink className="size-3" strokeWidth={1.75} />
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={item.status === "published" ? "secondary" : "brand"}
            size="md"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("publish")
              setError(null)
              const result = await publishArticle(
                item.id,
                item.status !== "published"
              )
              if (result.status === "error") {
                setError(result.formError ?? "L'action a échoué.")
              }
              setBusy(null)
            }}
          >
            {busy === "publish" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : item.status === "published" ? (
              <Archive className="size-4" strokeWidth={1.5} />
            ) : (
              <Globe className="size-4" strokeWidth={1.5} />
            )}
            {item.status === "published" ? "Dépublier" : "Publier"}
          </Button>

          {confirming ? (
            <span className="flex items-center gap-2 rounded-sm border border-danger bg-danger-subtle px-2 py-1">
              <span className="text-[0.82rem] text-danger-text">
                Supprimer définitivement ?
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy("delete")
                  const result = await deleteArticle(item.id)
                  if (result?.status === "error") {
                    setError(result.formError ?? "La suppression a échoué.")
                    setBusy(null)
                  }
                }}
              >
                {busy === "delete" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Oui
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
              >
                Annuler
              </Button>
            </span>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setConfirming(true)}
              className="text-danger-text"
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}
    </header>
  )
}

/** Barre d'enregistrement, identique à celle des réalisations. */
function SaveBar({
  onSave,
  dirty,
  saved,
  error,
}: {
  onSave: () => void
  dirty: boolean
  saved: boolean
  error: string | null
}) {
  const [pending, startTransition] = React.useTransition()

  return (
    <div className="sticky bottom-0 -mx-1 mt-2 flex flex-wrap items-center gap-3 border-t border-line bg-page/95 px-1 py-3 backdrop-blur">
      <Button
        type="button"
        size="md"
        onClick={() => startTransition(() => onSave())}
        disabled={pending || !dirty}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>

      {error ? (
        <p role="alert" className="text-[0.845rem] text-danger-text">
          {error}
        </p>
      ) : saved && !dirty ? (
        <p
          role="status"
          className="flex items-center gap-1.5 text-[0.845rem] text-success-text"
        >
          <Check className="size-3.5" strokeWidth={2} />
          Enregistré.
        </p>
      ) : dirty ? (
        <p className="text-[0.845rem] text-label">
          Modifications non enregistrées.
        </p>
      ) : null}
    </div>
  )
}

function useSaver(
  save: () => Promise<{
    status: string
    formError?: string
    fieldErrors?: Record<string, string>
  }>
) {
  const [dirty, setDirty] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )

  const touch = React.useCallback(() => {
    setDirty(true)
    setSaved(false)
  }, [])

  const run = React.useCallback(async () => {
    setError(null)
    setFieldErrors({})
    const result = await save()
    if (result.status === "error") {
      setError(
        result.formError ?? Object.values(result.fieldErrors ?? {})[0] ?? null
      )
      setFieldErrors(result.fieldErrors ?? {})
      return
    }
    setDirty(false)
    setSaved(true)
  }, [save])

  return { dirty, saved, error, fieldErrors, touch, run }
}

// ------------------------------------------------------------
// Onglet Fiche
// ------------------------------------------------------------

function FicheForm({
  item,
  caseSlugs,
}: {
  item: ArticleDetail
  caseSlugs: string[]
}) {
  const [values, setValues] = React.useState({
    slug: item.slug,
    category: item.category,
    title: item.title,
    lead: item.lead,
    author: item.author,
    authorRole: item.authorRole,
    authorInitials: item.authorInitials,
    publishedOn: item.publishedOn,
    dateLabel: item.dateLabel,
    readingTime: item.readingTime,
    relatedCase: item.relatedCase,
  })
  const [hero, setHero] = React.useState<UploadedMedia[]>(
    item.heroMedia
      ? [
          {
            id: item.heroMedia.id,
            url: item.heroMedia.url,
            alt: item.heroMedia.alt,
            width: item.heroMedia.width,
            height: item.heroMedia.height,
            originalName: item.heroMedia.originalName,
          },
        ]
      : []
  )

  const saver = useSaver(() =>
    updateArticle(item.id, { ...values, heroMediaId: hero[0]?.id ?? null })
  )

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    saver.touch()
  }

  return (
    <div className="grid gap-6">
      <Section title="Identité">
        <Field label="Titre" error={saver.fieldErrors.title}>
          <textarea
            rows={2}
            className={area}
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field
            label="Identifiant d'URL"
            hint={`/ressources/${values.slug}`}
            error={saver.fieldErrors.slug}
          >
            <input
              className={cn(input, "font-mono text-[0.875rem]")}
              value={values.slug}
              onChange={(event) => set("slug", event.target.value)}
            />
          </Field>
          <Field label="Catégorie" error={saver.fieldErrors.category}>
            <select
              className={cn(input, "cursor-pointer appearance-none")}
              value={values.category}
              onChange={(event) =>
                set("category", event.target.value as typeof values.category)
              }
            >
              {articleCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Chapô"
          hint="La promesse de l'article, en une phrase ou deux"
          error={saver.fieldErrors.lead}
        >
          <textarea
            rows={3}
            className={area}
            value={values.lead}
            onChange={(event) => set("lead", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Signature">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_5rem]">
          <Field label="Auteur" error={saver.fieldErrors.author}>
            <input
              className={input}
              value={values.author}
              onChange={(event) => set("author", event.target.value)}
            />
          </Field>
          <Field label="Rôle" error={saver.fieldErrors.authorRole}>
            <input
              className={input}
              value={values.authorRole}
              onChange={(event) => set("authorRole", event.target.value)}
            />
          </Field>
          <Field label="Initiales" error={saver.fieldErrors.authorInitials}>
            <input
              maxLength={4}
              className={cn(input, "text-center font-mono uppercase")}
              value={values.authorInitials}
              onChange={(event) => set("authorInitials", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Date et durée"
        hint="Deux champs pour la date : celui qui trie, et celui qui s'affiche."
      >
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr_8rem]">
          <Field label="Date (tri)" error={saver.fieldErrors.publishedOn}>
            <input
              type="date"
              className={cn(input, "font-mono")}
              value={values.publishedOn}
              onChange={(event) => {
                const iso = event.target.value
                setValues((current) => ({
                  ...current,
                  publishedOn: iso,
                  // Le libellé suit la date tant que personne ne l'a personnalisé :
                  // c'est le cas courant, et une date affichée qui contredit la date
                  // de tri est un défaut qu'on ne repère qu'en production.
                  dateLabel:
                    current.dateLabel ===
                      frenchDateLabel(current.publishedOn) ||
                    current.dateLabel === ""
                      ? frenchDateLabel(iso)
                      : current.dateLabel,
                }))
                saver.touch()
              }}
            />
          </Field>
          <Field
            label="Date affichée"
            hint="Modifiable : « été 2026 » est parfois plus juste"
            error={saver.fieldErrors.dateLabel}
          >
            <input
              className={input}
              value={values.dateLabel}
              onChange={(event) => set("dateLabel", event.target.value)}
            />
          </Field>
          <Field label="Lecture" hint="« 18 min »">
            <input
              className={input}
              value={values.readingTime}
              onChange={(event) => set("readingTime", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Visuel">
        <MediaDropzone
          label="Image de l'article"
          hint="Facultative. Une seule."
          value={hero}
          onChange={(media) => {
            setHero(media)
            saver.touch()
          }}
        />
      </Section>

      <Section
        title="Rebond"
        hint="Aucune impasse : un article finit sur une réalisation ou une action."
      >
        <Field label="Réalisation liée" hint="Facultative">
          <select
            className={cn(input, "cursor-pointer appearance-none")}
            value={values.relatedCase}
            onChange={(event) => set("relatedCase", event.target.value)}
          >
            <option value="">Aucune</option>
            {caseSlugs.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <SaveBar
        onSave={saver.run}
        dirty={saver.dirty}
        saved={saver.saved}
        error={saver.error}
      />
    </div>
  )
}

// ------------------------------------------------------------
// Onglet Corps
// ------------------------------------------------------------

function BodyForm({ item }: { item: ArticleDetail }) {
  const [rows, setRows] = React.useState<BlockRow[]>(() =>
    item.blocks.map(withBlockId)
  )
  const saver = useSaver(() =>
    setBlocks(item.id, item.slug, { items: rows.map((row) => row.block) })
  )

  return (
    <div className="grid gap-4">
      <BlockEditor
        rows={rows}
        onChange={(next) => {
          setRows(next)
          saver.touch()
        }}
      />
      <SaveBar
        onSave={saver.run}
        dirty={saver.dirty}
        saved={saver.saved}
        error={saver.error}
      />
    </div>
  )
}

// ------------------------------------------------------------
// Onglet Audience
// ------------------------------------------------------------

/**
 * Les vues, présentées pour ce qu'elles sont.
 *
 * Un total depuis toujours ne dit pas si l'article est lu **maintenant** : les
 * fenêtres à 7 et 30 jours sont ce qui rend le chiffre lisible. Et le compteur est
 * annoncé comme approximatif, parce qu'il l'est - tout compteur public l'est.
 */
function Audience({
  item,
  views,
}: {
  item: ArticleDetail
  views: ArticleViews
}) {
  const peak = Math.max(1, ...views.daily.map((day) => day.views))

  return (
    <div className="grid gap-6">
      {item.status === "published" ? null : (
        <p className="rounded-sm border-l-2 border-info bg-info-subtle px-4 py-3 text-[0.845rem] text-info-text">
          Cet article est en brouillon : il n&apos;est pas atteignable, donc
          rien n&apos;est compté.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat value={views.total} label="vues au total" />
        <Stat value={views.last30} label="sur trente jours" />
        <Stat value={views.last7} label="sur sept jours" />
      </div>

      {views.daily.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
            Trente derniers jours
          </h2>
          {/* Un histogramme en CSS pur, sans bibliothèque : trente barres ne
              justifient pas d'embarquer un moteur de graphiques. */}
          <ol className="flex h-24 items-end gap-1">
            {views.daily.map((day) => (
              <li
                key={day.day}
                title={`${day.day} : ${day.views} vue${day.views > 1 ? "s" : ""}`}
                className="flex-1 rounded-t-xs bg-brand/70"
                style={{ height: `${Math.max(4, (day.views / peak) * 100)}%` }}
              >
                <span className="sr-only">
                  {day.day} : {day.views} vues
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="text-[0.9rem] text-label">Aucune vue enregistrée.</p>
      )}

      <p className="text-xs text-label">
        Le compteur est une indication de lecture, pas une mesure
        d&apos;audience : il est incrémenté par le navigateur, une fois par
        article et par session, après deux secondes de présence. Il reste
        approximatif, et gonflable comme tout compteur public.
      </p>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-line bg-surface p-5">
      <span className="font-display text-[1.75rem] leading-none font-extrabold text-ink">
        {value.toLocaleString("fr-FR")}
      </span>
      <span className="text-[0.82rem] text-label">{label}</span>
    </div>
  )
}

// ------------------------------------------------------------
// Petites pièces
// ------------------------------------------------------------

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-0.5">
        <h2 className="font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {hint ? <p className="text-xs text-label">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  const id = React.useId()
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[0.82rem] font-medium text-ink">
        {label}
        {hint ? <span className="font-normal text-label"> {hint}</span> : null}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              id?: string
              "aria-invalid"?: boolean
            }>,
            { id, "aria-invalid": error ? true : undefined }
          )
        : children}
      {error ? (
        <p className="text-[0.78rem] text-danger-text">{error}</p>
      ) : null}
    </div>
  )
}

export { ArticleEditor }
