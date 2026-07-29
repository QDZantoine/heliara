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
  deleteService,
  publishService,
  setDeliverables,
  setFaq,
  setTechChoices,
  updateService,
} from "@/app/admin/(protected)/expertises/actions"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import type { FamilySummary, ServiceDetail } from "@/lib/db/expertises"
import { publicSiteUrl } from "@/lib/public-url"
import { cn } from "@/lib/utils"

const input =
  "border-line-strong bg-surface text-ink placeholder:text-label h-11 w-full rounded-sm border px-3.5 text-[0.94rem] transition-colors duration-100 aria-invalid:border-danger"
const area =
  "border-line-strong bg-surface text-ink placeholder:text-label w-full rounded-sm border px-3.5 py-3 text-[0.94rem] leading-relaxed aria-invalid:border-danger"

/** Une ligne de collection, munie d'une clé locale stable pour dnd-kit et React. */
type Row<T> = T & { id: string }
let counter = 0
function withId<T>(item: T): Row<T> {
  counter += 1
  return { ...item, id: `row-${counter}` }
}

/**
 * Éditeur d'un service d'expertise.
 *
 * Quatre onglets, chacun s'enregistrant séparément : la fiche, les livrables, les
 * choix techniques, les objections. Le découpage suit celui de la page publique, ce
 * qui rend l'édition prévisible - un onglet, un bloc de la page.
 */
function ExpertiseEditor({
  item,
  families,
  caseSlugs,
}: {
  item: ServiceDetail
  families: FamilySummary[]
  caseSlugs: string[]
}) {
  return (
    <div className="grid max-w-4xl gap-6">
      <Header item={item} />

      <Tabs.Root defaultValue="fiche">
        <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-line">
          {[
            ["fiche", "Fiche"],
            ["livrables", `Livrables (${item.deliverables.length})`],
            ["technique", `Choix techniques (${item.techChoices.length})`],
            ["objections", `Objections (${item.faq.length})`],
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
          <FicheForm item={item} families={families} caseSlugs={caseSlugs} />
        </Tabs.Panel>
        <Tabs.Panel value="livrables">
          <PairsForm
            item={item}
            rows={item.deliverables}
            listId="deliverables"
            titleLabel="Ce que vous obtenez"
            placeholder="Une plateforme centrée sur les postes de travail"
            save={(id, slug, items) => setDeliverables(id, slug, items)}
            hint="Des items nommés, pas des promesses. Au moins un est exigé à la publication : c'est ce que la page promet de dire."
          />
        </Tabs.Panel>
        <Tabs.Panel value="technique">
          <PairsForm
            item={item}
            rows={item.techChoices}
            listId="tech"
            titleLabel="Le choix"
            placeholder="TypeScript de bout en bout"
            save={(id, slug, items) => setTechChoices(id, slug, items)}
            hint="Des choix assumés, avec leur raison. C'est ce qui distingue une page d'expertise d'une plaquette."
          />
        </Tabs.Panel>
        <Tabs.Panel value="objections">
          <FaqForm item={item} />
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  )
}

function Header({ item }: { item: ServiceDetail }) {
  const [busy, setBusy] = React.useState<"publish" | "delete" | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  return (
    <header className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2 text-[0.82rem] text-label">
        <Link
          href="/admin/expertises"
          className="hover:text-ink hover:underline"
        >
          Expertises
        </Link>
        <span aria-hidden="true">/</span>
        <span>{item.familyLabel}</span>
        <span aria-hidden="true">/</span>
        <span className="font-mono">{item.slug}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <h1 className="font-display text-[1.5rem] leading-tight font-bold tracking-[-0.02em] text-ink">
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
              href={`/admin/expertises/${item.slug}/apercu`}
              className="inline-flex items-center gap-1 text-info-text hover:underline"
            >
              <Eye className="size-3" strokeWidth={1.75} />
              Aperçu
            </Link>
            {item.status === "published" ? (
              <a
                href={publicSiteUrl(`/expertises/${item.slug}`)}
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
              const result = await publishService(
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
                  const result = await deleteService(item.id)
                  if (result?.status === "error") {
                    setError(result.formError ?? "La suppression a échoué.")
                    setBusy(null)
                    setConfirming(false)
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

function FicheForm({
  item,
  families,
  caseSlugs,
}: {
  item: ServiceDetail
  families: FamilySummary[]
  caseSlugs: string[]
}) {
  const [values, setValues] = React.useState({
    slug: item.slug,
    familyId: item.familyId,
    title: item.title,
    tagline: item.tagline,
    problem: item.problem,
    relatedCase: item.relatedCase,
    ctaTitle: item.ctaTitle,
  })
  const saver = useSaver(() => updateService(item.id, values))

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
          <input
            className={input}
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Identifiant d'URL"
            hint={`/expertises/${values.slug}`}
            error={saver.fieldErrors.slug}
          >
            <input
              className={cn(input, "font-mono text-[0.875rem]")}
              value={values.slug}
              onChange={(event) => set("slug", event.target.value)}
            />
          </Field>
          <Field
            label="Famille"
            hint="Le groupe du hub, et l'entrée de nav"
            error={saver.fieldErrors.familyId}
          >
            <select
              className={cn(input, "cursor-pointer appearance-none")}
              value={values.familyId}
              onChange={(event) => set("familyId", event.target.value)}
            >
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Accroche"
          hint="Une phrase : à qui ça sert et pourquoi"
          error={saver.fieldErrors.tagline}
        >
          <textarea
            rows={2}
            className={area}
            value={values.tagline}
            onChange={(event) => set("tagline", event.target.value)}
          />
        </Field>

        <Field
          label="Le problème du visiteur"
          hint="En tête de page. Sa situation, dans ses mots, avant votre réponse."
          error={saver.fieldErrors.problem}
        >
          <textarea
            rows={5}
            className={area}
            value={values.problem}
            onChange={(event) => set("problem", event.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Rebond et action"
        hint="Aucune impasse : la page finit sur une preuve puis une demande."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Réalisation illustrant ce service">
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
          <Field
            label="Libellé du CTA"
            hint="« Parlons de votre plateforme »"
            error={saver.fieldErrors.ctaTitle}
          >
            <input
              className={input}
              value={values.ctaTitle}
              onChange={(event) => set("ctaTitle", event.target.value)}
            />
          </Field>
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

/** Livrables et choix techniques : même forme, un titre et un texte. */
function PairsForm({
  item,
  rows: initial,
  listId,
  titleLabel,
  placeholder,
  hint,
  save,
}: {
  item: ServiceDetail
  rows: { title: string; text: string }[]
  listId: string
  titleLabel: string
  placeholder: string
  hint: string
  save: (
    id: string,
    slug: string,
    items: { items: { title: string; text: string }[] }
  ) => Promise<{
    status: string
    formError?: string
    fieldErrors?: Record<string, string>
  }>
}) {
  const [rows, setRows] = React.useState(() => initial.map(withId))
  const saver = useSaver(() =>
    save(item.id, item.slug, {
      items: rows.map(({ id: _id, ...rest }) => rest),
    })
  )

  return (
    <div className="grid gap-4">
      <p className="text-[0.845rem] text-body">{hint}</p>

      <SortableList
        id={listId}
        items={rows}
        onReorder={(next) => {
          setRows(next)
          saver.touch()
        }}
      >
        {(row, index) => (
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input
                aria-label={`${titleLabel} ${index + 1}`}
                placeholder={placeholder}
                className={cn(input, "h-10 flex-1 font-medium")}
                value={row.title}
                onChange={(event) => {
                  setRows((current) =>
                    current.map((one) =>
                      one.id === row.id
                        ? { ...one, title: event.target.value }
                        : one
                    )
                  )
                  saver.touch()
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setRows((current) =>
                    current.filter((one) => one.id !== row.id)
                  )
                  saver.touch()
                }}
                aria-label={`Retirer l'entrée ${index + 1}`}
                className="grid size-9 shrink-0 place-items-center rounded-sm text-label hover:bg-danger-subtle hover:text-danger-text"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <textarea
              rows={2}
              aria-label={`Explication de l'entrée ${index + 1}`}
              placeholder="Ce que cela signifie concrètement."
              className={area}
              value={row.text}
              onChange={(event) => {
                setRows((current) =>
                  current.map((one) =>
                    one.id === row.id
                      ? { ...one, text: event.target.value }
                      : one
                  )
                )
                saver.touch()
              }}
            />
          </div>
        )}
      </SortableList>

      <button
        type="button"
        onClick={() => {
          setRows((current) => [...current, withId({ title: "", text: "" })])
          saver.touch()
        }}
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong text-[0.875rem] font-medium text-body transition-colors duration-100 hover:border-ink hover:text-ink"
      >
        <Plus className="size-4" strokeWidth={2} />
        Ajouter une entrée
      </button>

      <SaveBar
        onSave={saver.run}
        dirty={saver.dirty}
        saved={saver.saved}
        error={saver.error}
      />
    </div>
  )
}

function FaqForm({ item }: { item: ServiceDetail }) {
  const [rows, setRows] = React.useState(() => item.faq.map(withId))
  const saver = useSaver(() =>
    setFaq(item.id, item.slug, {
      items: rows.map(({ id: _id, ...rest }) => rest),
    })
  )

  return (
    <div className="grid gap-4">
      <p className="text-[0.845rem] text-body">
        Les vraies objections, pas du remplissage. C&apos;est ce bloc qui lève
        le doute avant la demande de contact.
      </p>

      <SortableList
        id="faq"
        items={rows}
        onReorder={(next) => {
          setRows(next)
          saver.touch()
        }}
      >
        {(row, index) => (
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input
                aria-label={`Question ${index + 1}`}
                placeholder="Combien de temps avant d'avoir quelque chose d'utilisable ?"
                className={cn(input, "h-10 flex-1 font-medium")}
                value={row.question}
                onChange={(event) => {
                  setRows((current) =>
                    current.map((one) =>
                      one.id === row.id
                        ? { ...one, question: event.target.value }
                        : one
                    )
                  )
                  saver.touch()
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setRows((current) =>
                    current.filter((one) => one.id !== row.id)
                  )
                  saver.touch()
                }}
                aria-label={`Retirer l'objection ${index + 1}`}
                className="grid size-9 shrink-0 place-items-center rounded-sm text-label hover:bg-danger-subtle hover:text-danger-text"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <textarea
              rows={3}
              aria-label={`Réponse ${index + 1}`}
              placeholder="Une réponse honnête, y compris quand elle ne va pas dans notre sens."
              className={area}
              value={row.answer}
              onChange={(event) => {
                setRows((current) =>
                  current.map((one) =>
                    one.id === row.id
                      ? { ...one, answer: event.target.value }
                      : one
                  )
                )
                saver.touch()
              }}
            />
          </div>
        )}
      </SortableList>

      <button
        type="button"
        onClick={() => {
          setRows((current) => [
            ...current,
            withId({ question: "", answer: "" }),
          ])
          saver.touch()
        }}
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong text-[0.875rem] font-medium text-body transition-colors duration-100 hover:border-ink hover:text-ink"
      >
        <Plus className="size-4" strokeWidth={2} />
        Ajouter une objection
      </button>

      <SaveBar
        onSave={saver.run}
        dirty={saver.dirty}
        saved={saver.saved}
        error={saver.error}
      />
    </div>
  )
}

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

export { ExpertiseEditor }
