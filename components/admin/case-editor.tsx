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
  Plus,
  Trash2,
} from "lucide-react"

import {
  deleteCase,
  publishCase,
  setChapters,
  setGallery,
  setLessons,
  setMeta,
  setResults,
  updateCase,
  type ActionResult,
} from "@/app/admin/(protected)/realisations/actions"
import {
  MediaDropzone,
  type UploadedMedia,
} from "@/components/admin/media-dropzone"
import { RichText } from "@/components/admin/rich-text"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import type { CaseDetail } from "@/lib/db/cases"
import { publicSiteUrl } from "@/lib/public-url"
import { cn } from "@/lib/utils"

const input =
  "border-line-strong bg-surface text-ink placeholder:text-label h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"
const area =
  "border-line-strong bg-surface text-ink placeholder:text-label w-full rounded-sm border px-3.5 py-3 text-[0.94rem] leading-relaxed transition-colors duration-100 aria-invalid:border-danger"

/**
 * Un élément de collection, muni d'un identifiant **local** stable.
 *
 * La base ne rend pas d'identifiant pour les lignes enfants - elles sont remplacées
 * en bloc à chaque enregistrement - mais dnd-kit et React en ont besoin pour suivre
 * une ligne pendant qu'on la déplace. Sans clé stable, réordonner remonterait les
 * champs de saisie dans le désordre. D'où cette clé de session, jamais envoyée.
 */
type Row<T> = T & { id: string }

let counter = 0
function withId<T>(item: T): Row<T> {
  counter += 1
  return { ...item, id: `row-${counter}` }
}

/**
 * Éditeur d'une réalisation.
 *
 * **Chaque onglet s'enregistre séparément.** La fiche, les chapitres, les résultats
 * et les enseignements ont chacun leur procédure et leur bouton. C'est plus de
 * clics qu'un unique « Enregistrer », et c'est voulu : une saisie invalide dans un
 * onglet ne fait pas perdre le travail fait dans un autre, et les procédures de
 * remplacement en bloc restent simples parce qu'elles ne traitent qu'une collection.
 *
 * Les corps de chapitre passent par l'éditeur riche, le reste par des champs
 * simples : du gras dans un titre de carte ne servirait à rien.
 */
function CaseEditor({ item }: { item: CaseDetail }) {
  return (
    <div className="grid max-w-4xl gap-6">
      <Header item={item} />

      <Tabs.Root defaultValue="fiche">
        <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-line">
          {[
            ["fiche", "Fiche"],
            ["chapitres", `Chapitres (${item.chapters.length})`],
            ["resultats", `Résultats (${item.results.length})`],
            ["images", `Images (${item.gallery.length})`],
            ["annexes", "Annexes"],
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
          <FicheForm item={item} />
        </Tabs.Panel>
        <Tabs.Panel value="chapitres">
          <ChaptersForm item={item} />
        </Tabs.Panel>
        <Tabs.Panel value="resultats">
          <ResultsForm item={item} />
        </Tabs.Panel>
        <Tabs.Panel value="images">
          <GalleryForm item={item} />
        </Tabs.Panel>
        <Tabs.Panel value="annexes">
          <AnnexesForm item={item} />
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  )
}

/** En-tête : titre, statut, publication, suppression, lien vers la page publique. */
function Header({ item }: { item: CaseDetail }) {
  const [busy, setBusy] = React.useState<"publish" | "delete" | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  const onPublish = async () => {
    setBusy("publish")
    setError(null)
    const result = await publishCase(item.id, item.status !== "published")
    if (result.status === "error") {
      setError(result.formError ?? "L'action a échoué.")
    }
    setBusy(null)
  }

  const onDelete = async () => {
    setBusy("delete")
    const result = await deleteCase(item.id)
    // En cas de succès l'action redirige : rien ne s'exécute après.
    if (result?.status === "error") {
      setError(result.formError ?? "La suppression a échoué.")
      setBusy(null)
    }
  }

  return (
    <header className="grid gap-3">
      <div className="flex items-center gap-2 text-[0.82rem] text-label">
        <Link
          href="/admin/realisations"
          className="hover:text-ink hover:underline"
        >
          Réalisations
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-mono">{item.slug}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-ink">
            {item.title}
          </h1>
          <div className="flex items-center gap-2 text-xs">
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
            {/* L'aperçu vaut pour un brouillon comme pour une fiche en ligne :
                c'est le rendu exact de la page, servi par l'administration parce
                que seule elle a le droit de lire un brouillon. */}
            <Link
              href={`/admin/realisations/${item.slug}/apercu`}
              className="inline-flex items-center gap-1 text-info-text hover:underline"
            >
              <Eye className="size-3" strokeWidth={1.75} />
              Aperçu
            </Link>
            {item.status === "published" ? (
              <a
                href={publicSiteUrl(`/realisations/${item.slug}`)}
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
            onClick={onPublish}
            disabled={busy !== null}
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

          {/* Confirmation en deux temps plutôt qu'un `confirm()` natif : le libellé
              dit ce qui va disparaître, et l'annulation reste à portée. */}
          {confirming ? (
            <span className="flex items-center gap-2 rounded-sm border border-danger bg-danger-subtle px-2 py-1">
              <span className="text-[0.82rem] text-danger-text">
                Supprimer définitivement ?
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={busy !== null}
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

/** Barre d'enregistrement, commune à tous les onglets. */
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

/**
 * État d'enregistrement partagé par les onglets.
 *
 * `dirty` sert à deux choses : désactiver le bouton quand il n'y a rien à faire, et
 * faire disparaître la confirmation dès qu'on retouche un champ - sinon « Enregistré »
 * resterait affiché au-dessus d'une saisie qui ne l'est plus.
 */
function useSaver(save: () => Promise<ActionResult>) {
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

function FicheForm({ item }: { item: CaseDetail }) {
  const [values, setValues] = React.useState({
    slug: item.slug,
    title: item.title,
    heroTitle: item.heroTitle,
    sector: item.sector,
    year: item.year,
    badge: item.badge,
    teaser: item.teaser,
    summary: item.summary,
    figure: item.figure,
    measure: item.measure,
    halo: item.halo,
    accent: item.accent,
    featured: item.featured,
    wide: item.wide,
    resultsLabel: item.resultsLabel,
    testimonialQuote: item.testimonial.quote,
    testimonialName: item.testimonial.name,
    testimonialRole: item.testimonial.role,
    testimonialInitials: item.testimonial.initials,
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
    updateCase(item.id, { ...values, heroMediaId: hero[0]?.id ?? null })
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Titre court"
            hint="Cartes de listing"
            error={saver.fieldErrors.title}
          >
            <input
              className={input}
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
            />
          </Field>
          <Field
            label="Identifiant d'URL"
            hint={`/realisations/${values.slug}`}
            error={saver.fieldErrors.slug}
          >
            <input
              className={cn(input, "font-mono text-[0.875rem]")}
              value={values.slug}
              onChange={(event) => set("slug", event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Titre du hero"
          hint="Le résultat est dans le titre"
          error={saver.fieldErrors.heroTitle}
        >
          <input
            className={input}
            value={values.heroTitle}
            onChange={(event) => set("heroTitle", event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_7rem_1fr]">
          <Field label="Secteur" error={saver.fieldErrors.sector}>
            <input
              className={input}
              value={values.sector}
              onChange={(event) => set("sector", event.target.value)}
            />
          </Field>
          <Field label="Année" error={saver.fieldErrors.year}>
            <input
              className={cn(input, "font-mono")}
              value={values.year}
              onChange={(event) => set("year", event.target.value)}
            />
          </Field>
          <Field
            label="Étiquette du hero"
            hint="Secteur · type de produit"
            error={saver.fieldErrors.badge}
          >
            <input
              className={input}
              value={values.badge}
              onChange={(event) => set("badge", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Résumés">
        <Field
          label="Résumé court"
          hint="Carte du hub des réalisations"
          error={saver.fieldErrors.summary}
        >
          <textarea
            rows={2}
            className={area}
            value={values.summary}
            onChange={(event) => set("summary", event.target.value)}
          />
        </Field>
        <Field
          label="Résumé long"
          hint="Carte de l'accueil"
          error={saver.fieldErrors.teaser}
        >
          <textarea
            rows={3}
            className={area}
            value={values.teaser}
            onChange={(event) => set("teaser", event.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Le chiffre"
        hint="Facultatif. Toute mission ne se résume pas à une mesure, et en réclamer une pousserait à en inventer. Sans chiffre, les cartes n'affichent simplement pas le bloc."
      >
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Field
            label="Valeur"
            hint="« -38 % »"
            error={saver.fieldErrors.figure}
          >
            <input
              className={cn(input, "font-display font-extrabold")}
              value={values.figure}
              onChange={(event) => set("figure", event.target.value)}
            />
          </Field>
          <Field
            label="Ce qu'elle mesure"
            hint="« de temps de traitement »"
            error={saver.fieldErrors.measure}
          >
            <input
              className={input}
              value={values.measure}
              onChange={(event) => set("measure", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Visuel de hero">
        <MediaDropzone
          label="Image principale"
          hint="Une seule. Remplace la précédente."
          value={hero}
          onChange={(media) => {
            setHero(media)
            saver.touch()
          }}
        />
      </Section>

      <Section title="Témoignage" hint="Facultatif, mais tout ou rien">
        <Field label="Verbatim" error={saver.fieldErrors.testimonialQuote}>
          <textarea
            rows={3}
            className={area}
            value={values.testimonialQuote}
            onChange={(event) => set("testimonialQuote", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_5rem]">
          <Field label="Nom" error={saver.fieldErrors.testimonialName}>
            <input
              className={input}
              value={values.testimonialName}
              onChange={(event) => set("testimonialName", event.target.value)}
            />
          </Field>
          <Field label="Rôle" error={saver.fieldErrors.testimonialRole}>
            <input
              className={input}
              value={values.testimonialRole}
              onChange={(event) => set("testimonialRole", event.target.value)}
            />
          </Field>
          <Field
            label="Initiales"
            error={saver.fieldErrors.testimonialInitials}
          >
            <input
              maxLength={4}
              className={cn(input, "text-center font-mono uppercase")}
              value={values.testimonialInitials}
              onChange={(event) =>
                set("testimonialInitials", event.target.value)
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Présentation">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Halo" hint="Un seul halo par écran">
            <Select
              value={values.halo}
              onChange={(value) => set("halo", value as "warm" | "cool")}
              options={[
                ["warm", "Chaud (orange)"],
                ["cool", "Froid (bleu)"],
              ]}
            />
          </Field>
          <Field label="Accent">
            <Select
              value={values.accent}
              onChange={(value) => set("accent", value as "brand" | "info")}
              options={[
                ["brand", "Orange de marque"],
                ["info", "Bleu d'information"],
              ]}
            />
          </Field>
        </div>

        <Field
          label="Libellé du bloc de résultats"
          error={saver.fieldErrors.resultsLabel}
        >
          <input
            className={input}
            placeholder="Résultats"
            value={values.resultsLabel}
            onChange={(event) => set("resultsLabel", event.target.value)}
          />
        </Field>

        <div className="grid gap-2.5">
          <Toggle
            checked={values.featured}
            onChange={(checked) => set("featured", checked)}
            label="Mise en avant sur l'accueil"
            hint="La fiche apparaît dans la section Réalisations de la page d'accueil."
          />
          {/* Le libellé dit explicitement où l'option agit : sur l'accueil, la
              disposition alterne selon la position de la fiche, et cette case n'y
              change rien. Sans cette précision, on croit qu'elle est en cause. */}
          <Toggle
            checked={values.wide}
            onChange={(checked) => set("wide", checked)}
            label="Carte large sur /realisations"
            hint="Sans effet sur l'accueil, où le visuel alterne de côté un cas sur deux."
          />
        </div>
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
// Onglet Chapitres
// ------------------------------------------------------------

function ChaptersForm({ item }: { item: CaseDetail }) {
  const [rows, setRows] = React.useState(() => item.chapters.map(withId))
  const saver = useSaver(() =>
    setChapters(item.id, item.slug, {
      items: rows.map(({ id: _id, ...rest }) => rest),
    })
  )

  const update = (id: string, patch: Partial<(typeof rows)[number]>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    )
    saver.touch()
  }

  return (
    <div className="grid gap-4">
      <p className="text-[0.845rem] text-body">
        Le récit de la mission, dans l&apos;ordre. La numérotation est refaite à
        l&apos;enregistrement : réordonner suffit, il n&apos;y a rien à
        renuméroter à la main.
      </p>

      <SortableList
        id="chapters"
        items={rows}
        onReorder={(next) => {
          setRows(next)
          saver.touch()
        }}
      >
        {(row, index) => (
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-label">
                {String(index + 1).padStart(2, "0")}
              </span>
              <input
                aria-label={`Titre du chapitre ${index + 1}`}
                placeholder="Titre du chapitre"
                className={cn(input, "h-10 flex-1")}
                value={row.title}
                onChange={(event) =>
                  update(row.id, { title: event.target.value })
                }
              />
              <RemoveButton
                label={`Retirer le chapitre ${index + 1}`}
                onClick={() => {
                  setRows((current) =>
                    current.filter((one) => one.id !== row.id)
                  )
                  saver.touch()
                }}
              />
            </div>

            <RichText
              value={row.text}
              onChange={(html) => update(row.id, { text: html })}
              placeholder="Le corps du chapitre…"
            />

            <details className="text-[0.845rem]">
              <summary className="min-h-9 cursor-pointer list-none py-1.5 text-label hover:text-ink">
                Encadré de décision {row.callout ? "· rempli" : "· vide"}
              </summary>
              <textarea
                rows={2}
                aria-label={`Encadré du chapitre ${index + 1}`}
                placeholder="Une décision structurante, mise en exergue."
                className={cn(area, "mt-1.5")}
                value={row.callout}
                onChange={(event) =>
                  update(row.id, { callout: event.target.value })
                }
              />
            </details>
          </div>
        )}
      </SortableList>

      <AddButton
        label="Ajouter un chapitre"
        onClick={() => {
          setRows((current) => [
            ...current,
            withId({ num: "", title: "", text: "", callout: "" }),
          ])
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
// Onglet Résultats
// ------------------------------------------------------------

function ResultsForm({ item }: { item: CaseDetail }) {
  const [rows, setRows] = React.useState(() => item.results.map(withId))
  const saver = useSaver(() =>
    setResults(item.id, item.slug, {
      items: rows.map(({ id: _id, ...rest }) => rest),
    })
  )

  return (
    <div className="grid gap-4">
      <p className="text-[0.845rem] text-body">
        Les chiffres du bloc de résultats. Des valeurs exactes et vérifiables
        uniquement : la crédibilité du ton s&apos;applique aussi aux données.
      </p>

      <SortableList
        id="results"
        items={rows}
        onReorder={(next) => {
          setRows(next)
          saver.touch()
        }}
      >
        {(row, index) => (
          <div className="flex items-center gap-3">
            <input
              aria-label={`Valeur du résultat ${index + 1}`}
              placeholder="-38 %"
              className={cn(input, "h-10 w-28 font-display font-extrabold")}
              value={row.value}
              onChange={(event) => {
                setRows((current) =>
                  current.map((one) =>
                    one.id === row.id
                      ? { ...one, value: event.target.value }
                      : one
                  )
                )
                saver.touch()
              }}
            />
            <input
              aria-label={`Libellé du résultat ${index + 1}`}
              placeholder="de temps de traitement"
              className={cn(input, "h-10 flex-1")}
              value={row.label}
              onChange={(event) => {
                setRows((current) =>
                  current.map((one) =>
                    one.id === row.id
                      ? { ...one, label: event.target.value }
                      : one
                  )
                )
                saver.touch()
              }}
            />
            <RemoveButton
              label={`Retirer le résultat ${index + 1}`}
              onClick={() => {
                setRows((current) => current.filter((one) => one.id !== row.id))
                saver.touch()
              }}
            />
          </div>
        )}
      </SortableList>

      <AddButton
        label="Ajouter un résultat"
        onClick={() => {
          setRows((current) => [...current, withId({ value: "", label: "" })])
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
// Onglet Images
// ------------------------------------------------------------

function GalleryForm({ item }: { item: CaseDetail }) {
  const [rows, setRows] = React.useState(() =>
    item.gallery.map((media) => withId({ media, caption: media.caption ?? "" }))
  )
  const saver = useSaver(() =>
    setGallery(item.id, item.slug, {
      items: rows.map((row) => ({
        mediaId: row.media.id,
        caption: row.caption,
      })),
    })
  )

  return (
    <div className="grid gap-5">
      <MediaDropzone
        label="Ajouter des images"
        hint="Déposez-en plusieurs à la fois. Elles s'ajoutent à la fin de la galerie."
        multiple
        value={[]}
        onChange={(media) => {
          setRows((current) => [
            ...current,
            ...media.map((one) =>
              withId({
                media: { ...one, mimeType: "", caption: undefined },
                caption: "",
              })
            ),
          ])
          saver.touch()
        }}
      />

      {rows.length > 0 ? (
        <div className="grid gap-3">
          <h3 className="text-[0.82rem] font-medium text-ink">
            Galerie ({rows.length})
          </h3>
          <SortableList
            id="gallery"
            items={rows}
            onReorder={(next) => {
              setRows(next)
              saver.touch()
            }}
          >
            {(row, index) => (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.media.url}
                  alt={row.media.alt}
                  className="aspect-4/3 w-24 shrink-0 rounded-xs border border-line object-cover"
                />
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <p className="truncate text-xs text-label">
                    {row.media.originalName}
                  </p>
                  <input
                    aria-label={`Légende de l'image ${index + 1}`}
                    placeholder="Légende (optionnelle)"
                    className={cn(input, "h-10")}
                    value={row.caption}
                    onChange={(event) => {
                      setRows((current) =>
                        current.map((one) =>
                          one.id === row.id
                            ? { ...one, caption: event.target.value }
                            : one
                        )
                      )
                      saver.touch()
                    }}
                  />
                </div>
                <RemoveButton
                  label={`Retirer l'image ${index + 1}`}
                  onClick={() => {
                    setRows((current) =>
                      current.filter((one) => one.id !== row.id)
                    )
                    saver.touch()
                  }}
                />
              </div>
            )}
          </SortableList>
        </div>
      ) : null}

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
// Onglet Annexes : fiche technique et enseignements
// ------------------------------------------------------------

function AnnexesForm({ item }: { item: CaseDetail }) {
  const [meta, setMetaRows] = React.useState(() => item.meta.map(withId))
  const [lessons, setLessonRows] = React.useState(() =>
    item.lessons.map(withId)
  )

  const metaSaver = useSaver(() =>
    setMeta(item.id, item.slug, {
      items: meta.map(({ id: _id, ...rest }) => rest),
    })
  )
  const lessonSaver = useSaver(() =>
    setLessons(item.id, item.slug, {
      items: lessons.map(({ id: _id, ...rest }) => rest),
    })
  )

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Section title="Fiche technique" hint="Durée, équipe, technologies…">
          <SortableList
            id="meta"
            items={meta}
            onReorder={(next) => {
              setMetaRows(next)
              metaSaver.touch()
            }}
          >
            {(row, index) => (
              <div className="flex items-center gap-3">
                <input
                  aria-label={`Libellé ${index + 1}`}
                  placeholder="Durée"
                  className={cn(input, "h-10 w-40")}
                  value={row.label}
                  onChange={(event) => {
                    setMetaRows((current) =>
                      current.map((one) =>
                        one.id === row.id
                          ? { ...one, label: event.target.value }
                          : one
                      )
                    )
                    metaSaver.touch()
                  }}
                />
                <input
                  aria-label={`Valeur ${index + 1}`}
                  placeholder="14 semaines"
                  className={cn(input, "h-10 flex-1")}
                  value={row.value}
                  onChange={(event) => {
                    setMetaRows((current) =>
                      current.map((one) =>
                        one.id === row.id
                          ? { ...one, value: event.target.value }
                          : one
                      )
                    )
                    metaSaver.touch()
                  }}
                />
                <RemoveButton
                  label={`Retirer la ligne ${index + 1}`}
                  onClick={() => {
                    setMetaRows((current) =>
                      current.filter((one) => one.id !== row.id)
                    )
                    metaSaver.touch()
                  }}
                />
              </div>
            )}
          </SortableList>

          <AddButton
            label="Ajouter une ligne"
            onClick={() => {
              setMetaRows((current) => [
                ...current,
                withId({ label: "", value: "" }),
              ])
              metaSaver.touch()
            }}
          />
        </Section>

        <SaveBar
          onSave={metaSaver.run}
          dirty={metaSaver.dirty}
          saved={metaSaver.saved}
          error={metaSaver.error}
        />
      </div>

      <div className="grid gap-4">
        <Section
          title="Enseignements"
          hint="Ce que la mission a appris, sans langue de bois"
        >
          <SortableList
            id="lessons"
            items={lessons}
            onReorder={(next) => {
              setLessonRows(next)
              lessonSaver.touch()
            }}
          >
            {(row, index) => (
              <div className="flex items-start gap-3">
                <textarea
                  rows={2}
                  aria-label={`Enseignement ${index + 1}`}
                  placeholder="Un champ laissé vide et signalé est préférable à un champ rempli par approximation."
                  className={area}
                  value={row.text}
                  onChange={(event) => {
                    setLessonRows((current) =>
                      current.map((one) =>
                        one.id === row.id
                          ? { ...one, text: event.target.value }
                          : one
                      )
                    )
                    lessonSaver.touch()
                  }}
                />
                <RemoveButton
                  label={`Retirer l'enseignement ${index + 1}`}
                  onClick={() => {
                    setLessonRows((current) =>
                      current.filter((one) => one.id !== row.id)
                    )
                    lessonSaver.touch()
                  }}
                />
              </div>
            )}
          </SortableList>

          <AddButton
            label="Ajouter un enseignement"
            onClick={() => {
              setLessonRows((current) => [...current, withId({ text: "" })])
              lessonSaver.touch()
            }}
          />
        </Section>

        <SaveBar
          onSave={lessonSaver.run}
          dirty={lessonSaver.dirty}
          saved={lessonSaver.saved}
          error={lessonSaver.error}
        />
      </div>
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
      {/* L'identifiant est posé sur l'enfant : c'est ce qui relie le libellé au
          champ, quel que soit le type de contrôle passé. */}
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

function Select({
  value,
  onChange,
  options,
  id,
}: {
  value: string
  onChange: (value: string) => void
  options: [string, string][]
  id?: string
}) {
  return (
    <select
      id={id}
      className={cn(input, "cursor-pointer appearance-none")}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex min-h-11 items-start gap-2.5 py-1 text-[0.9rem] text-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-brand-solid"
      />
      <span className="grid gap-0.5">
        {label}
        {hint ? <span className="text-xs text-label">{hint}</span> : null}
      </span>
    </label>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong text-[0.875rem] font-medium text-body transition-colors duration-100 hover:border-ink hover:text-ink"
    >
      <Plus className="size-4" strokeWidth={2} />
      {label}
    </button>
  )
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 shrink-0 place-items-center rounded-sm text-label transition-colors duration-100 hover:bg-danger-subtle hover:text-danger-text"
    >
      <Trash2 className="size-3.5" strokeWidth={1.5} />
    </button>
  )
}

export { CaseEditor }
