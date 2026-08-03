"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  createTestimonial,
  deleteTestimonial,
  publishTestimonial,
  reorderTestimonials,
  updateTestimonial,
} from "@/app/admin/(protected)/temoignages/actions"
import {
  Counter,
  Empty,
  Field,
  RemoveButton,
  Select,
  area,
  input,
} from "@/components/admin/form-kit"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import type { TestimonialDetail } from "@/lib/db/testimonials"
import { cn } from "@/lib/utils"

/** Ce que l'écran a besoin de savoir d'une réalisation, pour son sélecteur. */
export type CaseOption = { id: string; title: string }

const QUOTE_MAX = 600

/**
 * Les témoignages de l'accueil, administrables.
 *
 * **Un tableau, comme les références et l'équipe.** Un témoignage a cinq champs et pas de
 * page à lui. Ce qu'on vient vérifier est la rangée de trois cartes, et on ne la voit
 * qu'en voyant les lignes ensemble.
 *
 * **Ce que cet écran doit dire, et qu'aucune base ne peut vérifier à sa place.** Le site
 * a publié trois verbatims inventés, attribués à des personnes nommées avec leur fonction
 * et leur employeur ; ils ont été retirés parce qu'un homonyme réel suffit à créer un
 * préjudice. C'est le contenu le plus exposé du site, et le seul qui engage quelqu'un
 * d'autre que le studio. D'où la trace de l'accord - une date et l'endroit où l'écrit se
 * trouve - exigée à la publication, et rappelée à chaque ligne.
 */
function TestimonialBoard({
  testimonials,
  cases,
}: {
  testimonials: TestimonialDetail[]
  cases: CaseOption[]
}) {
  const [error, setError] = React.useState<string | null>(null)

  const onReorder = (next: TestimonialDetail[]) => {
    setError(null)
    React.startTransition(async () => {
      const result = await reorderTestimonials({
        order: next.map((item, index) => ({
          id: item.id,
          position: index * 10,
        })),
      })
      if (result.status === "error") {
        setError(result.formError ?? "L'ordre n'a pas pu être enregistré.")
      }
    })
  }

  const online = testimonials.filter((one) => one.status === "published").length

  return (
    <div className="grid gap-5">
      <p className="text-[0.845rem] leading-relaxed text-body">
        La section « Ils en parlent mieux que nous » de l&apos;accueil, entre
        les réalisations et la demande de contact. Elle affiche les témoignages
        en ligne par rangées de trois, et{" "}
        <strong>
          ne s&apos;affiche pas du tout s&apos;il n&apos;y en a aucun
        </strong>{" "}
        : l&apos;accueil est alors plus court, jamais incomplet.
      </p>
      <p className="rounded-sm border-l-2 border-brand bg-inset px-4 py-3 text-[0.845rem] leading-relaxed text-body">
        <strong>
          Une citation ne se met en ligne qu&apos;avec l&apos;accord écrit de
          son auteur
        </strong>
        , portant sur le texte exact publié. Un verbatim attribué à une personne
        nommée chez une entreprise nommée engage les deux. Réécrire une citation
        déjà en ligne demande une nouvelle validation.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}

      {testimonials.length > 0 ? (
        <SortableList
          id="testimonials"
          items={testimonials}
          onReorder={onReorder}
        >
          {(testimonial) => (
            <TestimonialRow
              key={testimonial.id}
              testimonial={testimonial}
              cases={cases}
              onError={setError}
            />
          )}
        </SortableList>
      ) : (
        <Empty>
          Aucun témoignage. La section n&apos;apparaît pas sur l&apos;accueil
          tant qu&apos;aucune citation n&apos;est en ligne.
        </Empty>
      )}

      <p className="text-[0.82rem] text-label">
        {online} en ligne sur {testimonials.length}
        {online === 0
          ? ". La section ne s'affiche pas."
          : online % 3 === 0
            ? ". La rangée est complète."
            : `. La dernière rangée en compte ${online % 3} sur trois.`}
      </p>

      <CreateTestimonial />
    </div>
  )
}

/** Ce que la publication exige, écrit avant le clic. Miroir de `publish_testimonial`. */
function missing(values: {
  initials: string
  consentAt: string
  consentNote: string
}) {
  const gaps: string[] = []
  if (!values.initials.trim()) {
    gaps.push("les initiales")
  }
  if (!values.consentAt.trim()) {
    gaps.push("la date de l'accord")
  }
  if (!values.consentNote.trim()) {
    gaps.push("où l'accord se trouve")
  }
  return gaps
}

/**
 * Un témoignage.
 *
 * La citation est montrée **telle que la carte la rendra** - chevrons français posés par
 * la vue, jamais saisis. Les stocker ferait dépendre le rendu de ce que la personne a
 * recopié depuis son client de messagerie : des guillemets droits, courbes ou absents
 * selon le passage.
 */
function TestimonialRow({
  testimonial,
  cases,
  onError,
}: {
  testimonial: TestimonialDetail
  cases: CaseOption[]
  onError: (message: string | null) => void
}) {
  const [values, setValues] = React.useState({
    quote: testimonial.quote,
    authorName: testimonial.authorName,
    authorRole: testimonial.authorRole,
    initials: testimonial.initials,
    consentAt: testimonial.consentAt,
    consentNote: testimonial.consentNote,
    caseId: testimonial.caseId ?? "",
  })
  const [dirty, setDirty] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [pending, startTransition] = React.useTransition()
  const [confirming, setConfirming] = React.useState(false)

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const save = () =>
    startTransition(async () => {
      onError(null)
      setFieldErrors({})
      const result = await updateTestimonial(testimonial.id, {
        quote: values.quote,
        authorName: values.authorName,
        authorRole: values.authorRole,
        initials: values.initials,
        consentAt: values.consentAt,
        consentNote: values.consentNote,
        caseId: values.caseId || null,
      })
      if (result.status === "error") {
        setFieldErrors(result.fieldErrors ?? {})
        onError(
          result.formError ?? Object.values(result.fieldErrors ?? {})[0] ?? null
        )
        return
      }
      setDirty(false)
      setSaved(true)
    })

  const togglePublish = () =>
    startTransition(async () => {
      onError(null)
      const result = await publishTestimonial(
        testimonial.id,
        testimonial.status !== "published"
      )
      if (result.status === "error") {
        onError(result.formError ?? "Le changement n'a pas pu être enregistré.")
      }
    })

  const remove = () =>
    startTransition(async () => {
      onError(null)
      const result = await deleteTestimonial(testimonial.id)
      if (result.status === "error") {
        onError(result.formError ?? "La suppression a échoué.")
      }
    })

  const online = testimonial.status === "published"
  const gaps = missing(values)

  return (
    <div className="grid gap-4">
      <Field
        label="Citation"
        hint="Le texte exact que son auteur a validé. Les chevrons sont posés par la carte, ne les saisissez pas."
        error={fieldErrors.quote}
      >
        <textarea
          className={area}
          rows={4}
          value={values.quote}
          onChange={(event) => set("quote", event.target.value)}
        />
      </Field>
      {/* Le seuil est répété ici, et c'est volontaire : `Counter` ne se montre qu'à 70 %
          de la limite, mais un conteneur rendu quand il est vide ajoute une rangée et son
          espacement à la grille - un blanc de vingt pixels sous chaque citation courte. */}
      {values.quote.trim().length >= QUOTE_MAX * 0.7 ? (
        <div className="flex justify-end">
          <Counter value={values.quote} max={QUOTE_MAX} />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem]">
        <Field label="Personne citée" error={fieldErrors.authorName}>
          <input
            className={input}
            value={values.authorName}
            onChange={(event) => set("authorName", event.target.value)}
          />
        </Field>
        <Field
          label="Fonction et employeur"
          example="Directrice des systèmes d'information, Groupe Ardan"
          error={fieldErrors.authorRole}
        >
          <input
            className={input}
            value={values.authorRole}
            onChange={(event) => set("authorRole", event.target.value)}
          />
        </Field>
        <Field
          label="Initiales"
          hint="Deux lettres."
          error={fieldErrors.initials}
        >
          <input
            className={input}
            maxLength={4}
            value={values.initials}
            onChange={(event) => set("initials", event.target.value)}
          />
        </Field>
      </div>

      {/*
        La trace de l'accord, groupée et signalée par un filet : ce n'est pas un champ de
        plus, c'est la condition de la mise en ligne. Elle n'apparaît nulle part sur le
        site - ces deux champs servent le jour où il faut retrouver l'écrit.
      */}
      <div className="grid gap-3 rounded-sm border border-line bg-surface p-4 sm:grid-cols-[11rem_1fr]">
        <Field
          label="Accord obtenu le"
          hint="La date de la validation écrite."
          error={fieldErrors.consentAt}
        >
          <input
            type="date"
            className={input}
            value={values.consentAt}
            onChange={(event) => set("consentAt", event.target.value)}
          />
        </Field>
        <Field
          label="Où l'écrit se trouve"
          example="E-mail de C. Fontaine du 12/07, dossier client"
          error={fieldErrors.consentNote}
        >
          <input
            className={cn(input, "text-[0.875rem]")}
            value={values.consentNote}
            onChange={(event) => set("consentNote", event.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Réalisation liée"
        hint="Non affichée : elle garde le contexte de la citation."
        optional
      >
        <Select
          value={values.caseId}
          onChange={(value) => set("caseId", value)}
          options={[
            ["", "Aucune"],
            ...cases.map(
              (one) => [one.id, one.title] as readonly [string, string]
            ),
          ]}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={save} disabled={!dirty || pending}>
            {pending ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : null}
            Enregistrer
          </Button>
          {saved && !dirty ? (
            <span className="text-[0.8rem] text-label">Enregistré</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant={online ? "secondary" : "brand"}
            onClick={togglePublish}
            disabled={pending}
          >
            {online ? "Retirer du site" : "Mettre en ligne"}
          </Button>
          {confirming ? (
            <span className="flex items-center gap-2 text-[0.82rem] text-body">
              Supprimer&nbsp;?
              <Button
                size="sm"
                variant="destructive"
                onClick={remove}
                disabled={pending}
              >
                Oui
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Non
              </Button>
            </span>
          ) : (
            <RemoveButton
              label={`Supprimer le témoignage de ${testimonial.authorName}`}
              onClick={() => setConfirming(true)}
            />
          )}
        </div>
      </div>

      {!online && gaps.length > 0 ? (
        <p className="text-[0.8rem] text-label">
          Pour mettre en ligne, il manque {gaps.join(", ")}.
        </p>
      ) : null}
    </div>
  )
}

/**
 * La création : la citation et son auteur.
 *
 * L'accord se déclare ensuite, sur la ligne créée. L'exiger ici obligerait à garder la
 * citation ailleurs en attendant la validation, c'est-à-dire dans un e-mail - alors
 * qu'un brouillon n'est affiché nulle part.
 */
function CreateTestimonial() {
  const [quote, setQuote] = React.useState("")
  const [authorName, setAuthorName] = React.useState("")
  const [authorRole, setAuthorRole] = React.useState("")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [formError, setFormError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  const submit = () =>
    startTransition(async () => {
      setFieldErrors({})
      setFormError(null)
      const result = await createTestimonial({ quote, authorName, authorRole })
      if (result.status === "error") {
        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError ?? null)
        return
      }
      setQuote("")
      setAuthorName("")
      setAuthorRole("")
    })

  return (
    <div className="grid gap-4 rounded-lg border border-dashed border-line-strong p-5">
      <p className="text-[0.9rem] font-semibold text-ink">
        Ajouter un témoignage
      </p>

      {formError ? (
        <p role="alert" className="text-[0.845rem] text-danger-text">
          {formError}
        </p>
      ) : null}

      <Field
        label="Citation"
        hint="Recopiez le texte reçu, sans le retoucher : c'est celui qui devra être validé."
        error={fieldErrors.quote}
      >
        <textarea
          className={area}
          rows={3}
          value={quote}
          onChange={(event) => setQuote(event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Personne citée" error={fieldErrors.authorName}>
          <input
            className={input}
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
          />
        </Field>
        <Field label="Fonction et employeur" error={fieldErrors.authorRole}>
          <input
            className={input}
            value={authorRole}
            onChange={(event) => setAuthorRole(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={
            pending || !quote.trim() || !authorName.trim() || !authorRole.trim()
          }
        >
          {pending ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : null}
          Ajouter
        </Button>
      </div>
    </div>
  )
}

export { TestimonialBoard }
