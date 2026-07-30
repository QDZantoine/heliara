"use client"

import * as React from "react"
import { Loader2, Star } from "lucide-react"

import {
  deleteArticle,
  publishArticle,
  setBlocks,
  setFeatured,
  updateArticle,
} from "@/app/admin/(protected)/articles/actions"
import { BlockEditor } from "@/components/admin/block-editor"
import { EditorHeader } from "@/components/admin/editor-header"
import { useCollection, useFieldSet } from "@/components/admin/editor-state"
import {
  Counter,
  Field,
  Fieldset,
  Select,
  area,
  input,
} from "@/components/admin/form-kit"
import {
  MediaDropzone,
  type UploadedMedia,
} from "@/components/admin/media-dropzone"
import {
  ArticleCardPreview,
  ArticleFeaturePreview,
  Placement,
  WithPlacements,
} from "@/components/admin/placement"
import {
  PublishPanel,
  type Requirement,
} from "@/components/admin/publish-panel"
import { StepEditor, type EditorStep } from "@/components/admin/step-editor"
import { Button } from "@/components/ui/button"
import { isoDay } from "@/lib/date"
import type { ArticleDetail, ArticleViews } from "@/lib/db/articles"
import { articleCategories, frenchDateLabel } from "@/lib/schemas/article"
import { cn } from "@/lib/utils"

/**
 * Éditeur d'article.
 *
 * Même moule que les réalisations - étapes, aperçus de placement, panneau de
 * publication qui dit ce qu'il manque - parce que le défaut était le même : trois
 * onglets qui suivaient les procédures d'écriture, et cinq titres de section dans le
 * premier. Voir `step-editor.tsx` et `placement.tsx` pour ce que ce découpage change.
 *
 * La différence propre aux articles tient en deux points. La **mise en avant** est
 * exclusive et s'applique tout de suite, sans passer par la barre d'enregistrement -
 * voir `FeaturedSwitch`. Et l'**audience** est une étape en lecture seule : elle
 * n'enregistre rien, donc elle n'a pas de barre du tout.
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
  const [step, setStep] = React.useState("identite")

  /** La fiche entière, répartie sur quatre étapes. `update_article` la prend en bloc. */
  const fiche = useFieldSet(
    "La fiche",
    {
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
      heroMedia: item.heroMedia
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
        : ([] as UploadedMedia[]),
    },
    ({ heroMedia, ...rest }) =>
      updateArticle(item.id, { ...rest, heroMediaId: heroMedia[0]?.id ?? null })
  )
  const v = fiche.values
  const set = fiche.set

  /**
   * Le corps.
   *
   * `Row<{ block }>` porte exactement la forme que `BlockEditor` attend - un objet et
   * sa clé de session - ce qui évite de tenir un second état pour la même liste.
   */
  const body = useCollection(
    "Le corps",
    item.blocks.map((block) => ({ block })),
    (items) =>
      setBlocks(item.id, item.slug, { items: items.map((one) => one.block) })
  )

  /** Ce qu'exige la publication, repris un à un de `publish_article`. */
  const requirements: Requirement[] = [
    {
      label: "Un titre",
      done: item.title.trim() !== "",
      step: "identite",
      stepLabel: "Identité",
    },
    {
      label: "Un chapô",
      done: item.lead.trim() !== "",
      step: "chapo",
      stepLabel: "Chapô",
    },
    {
      label: "Au moins un bloc de contenu",
      done: item.blocks.length > 0,
      step: "corps",
      stepLabel: "Corps",
    },
    {
      label: "Un auteur",
      done: item.author.trim() !== "",
      step: "signature",
      stepLabel: "Signature",
    },
    {
      label: "Une date affichée",
      done: item.dateLabel.trim() !== "",
      step: "signature",
      stepLabel: "Signature",
    },
  ]

  const feedCard = (
    <Placement title="Carte du flux /ressources">
      <ArticleCardPreview
        category={v.category}
        title={v.title}
        author={v.author}
        dateLabel={v.dateLabel}
        readingTime={v.readingTime}
      />
    </Placement>
  )

  const featureCard = (
    <Placement title="Carte « À la une »">
      <ArticleFeaturePreview
        category={v.category}
        title={v.title}
        lead={v.lead}
        author={v.author}
        authorRole={v.authorRole}
        authorInitials={v.authorInitials}
      />
    </Placement>
  )

  const steps: EditorStep[] = [
    {
      id: "identite",
      label: "Identité",
      purpose:
        "Comment l'article se nomme, à quelle adresse il vit, et sous quelle catégorie il se range. La catégorie sert de filtre sur le flux.",
      state: item.title.trim() ? "ready" : "todo",
      savers: [fiche.saveable],
      render: () => (
        <WithPlacements aside={feedCard}>
          <Fieldset>
            <Field
              label="Titre"
              hint="Le titre du flux comme celui de la page. Une promesse, pas un thème."
              example="Choisir un socle technique sans se tromper de décennie"
              error={fiche.fieldErrors.title}
            >
              <textarea
                rows={2}
                className={area}
                value={v.title}
                onChange={(event) => set("title", event.target.value)}
              />
            </Field>
            <div className="-mt-3 flex justify-end">
              <Counter value={v.title} max={300} />
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_13rem]">
              <Field
                label="Identifiant d'URL"
                hint={`L'article sera à l'adresse /ressources/${v.slug || "…"}.`}
                error={fiche.fieldErrors.slug}
              >
                <input
                  className={cn(input, "font-mono text-[0.875rem]")}
                  value={v.slug}
                  onChange={(event) => set("slug", event.target.value)}
                />
              </Field>
              <Field
                label="Catégorie"
                hint="Filtre du flux, et couleur de la pastille."
                error={fiche.fieldErrors.category}
              >
                <Select
                  value={v.category}
                  onChange={(value) =>
                    set("category", value as typeof v.category)
                  }
                  options={articleCategories.map(
                    (category) => [category, category] as const
                  )}
                />
              </Field>
            </div>
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "chapo",
      label: "Chapô",
      purpose:
        "La promesse de l'article, et son visuel. Le chapô ne s'affiche qu'à la une du flux et en tête de l'article : les cartes ordinaires ne le montrent pas.",
      state: item.lead.trim() ? "ready" : "todo",
      savers: [fiche.saveable],
      render: () => (
        <WithPlacements aside={featureCard}>
          <Fieldset>
            <Field
              label="Chapô"
              hint="Deux ou trois phrases : ce que le lecteur saura à la fin, et pourquoi cela lui sert."
              error={fiche.fieldErrors.lead}
            >
              <textarea
                rows={4}
                className={area}
                value={v.lead}
                onChange={(event) => set("lead", event.target.value)}
              />
            </Field>
            <div className="-mt-3 flex justify-end">
              <Counter value={v.lead} max={1200} />
            </div>
          </Fieldset>

          <Fieldset
            title="Visuel"
            hint="Facultatif, une seule image. Déposer une nouvelle image remplace la précédente."
          >
            <MediaDropzone
              label="Image de l'article"
              value={v.heroMedia}
              onChange={(media) => set("heroMedia", media)}
            />
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "corps",
      label: "Corps",
      count: body.count,
      purpose:
        "Le texte, en blocs typés : paragraphe, intertitre, encadré, liste numérotée. Les titres viennent du gabarit de page, jamais du gras dans un paragraphe.",
      state: item.blocks.length > 0 ? "ready" : "todo",
      savers: [body.saveable],
      render: () => (
        <BlockEditor
          rows={body.rows}
          onChange={body.replace}
          errorAt={body.anyErrorAt}
        />
      ),
    },

    {
      id: "signature",
      label: "Signature",
      purpose:
        "Qui l'a écrit, quand, et en combien de temps on le lit. Deux champs pour la date, parce que celle qui trie et celle qui s'affiche ne disent pas la même chose.",
      state:
        item.author.trim() && item.dateLabel.trim() && item.publishedOn
          ? "ready"
          : "todo",
      savers: [fiche.saveable],
      render: () => (
        <WithPlacements aside={featureCard}>
          <Fieldset title="Auteur">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem]">
              <Field label="Nom" error={fiche.fieldErrors.author}>
                <input
                  className={input}
                  value={v.author}
                  onChange={(event) => set("author", event.target.value)}
                />
              </Field>
              <Field label="Rôle" error={fiche.fieldErrors.authorRole}>
                <input
                  className={input}
                  value={v.authorRole}
                  onChange={(event) => set("authorRole", event.target.value)}
                />
              </Field>
              <Field label="Initiales" error={fiche.fieldErrors.authorInitials}>
                <input
                  maxLength={4}
                  className={cn(input, "text-center font-mono uppercase")}
                  value={v.authorInitials}
                  onChange={(event) =>
                    set("authorInitials", event.target.value)
                  }
                />
              </Field>
            </div>
          </Fieldset>

          <Fieldset
            title="Date et durée"
            hint="La date de tri alimente le plan du site et l'ordre du flux ; la date affichée est celle que lit le visiteur. Elle suit la première tant que personne ne l'a personnalisée."
          >
            <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_8rem]">
              <Field label="Date de tri" error={fiche.fieldErrors.publishedOn}>
                <input
                  type="date"
                  className={cn(input, "font-mono")}
                  value={v.publishedOn}
                  onChange={(event) => {
                    const iso = event.target.value
                    // Le libellé suit la date tant que personne ne l'a
                    // personnalisé : c'est le cas courant, et une date affichée qui
                    // contredit la date de tri est un défaut qu'on ne repère qu'en
                    // production.
                    const custom =
                      v.dateLabel !== "" &&
                      v.dateLabel !== frenchDateLabel(v.publishedOn)
                    set("publishedOn", iso)
                    if (!custom) {
                      set("dateLabel", frenchDateLabel(iso))
                    }
                  }}
                />
              </Field>
              <Field
                label="Date affichée"
                hint="Modifiable : « été 2026 » est parfois plus juste qu'un jour exact."
                error={fiche.fieldErrors.dateLabel}
              >
                <input
                  className={input}
                  value={v.dateLabel}
                  onChange={(event) => set("dateLabel", event.target.value)}
                />
              </Field>
              <Field
                label="Lecture"
                example="18 min"
                optional
                error={fiche.fieldErrors.readingTime}
              >
                <input
                  className={input}
                  value={v.readingTime}
                  onChange={(event) => set("readingTime", event.target.value)}
                />
              </Field>
            </div>
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "diffusion",
      label: "Diffusion",
      purpose:
        "Où l'article apparaît, et sur quoi il rebondit. Aucune impasse : un article finit sur une réalisation ou sur une action.",
      state: "optional",
      savers: [fiche.saveable],
      render: () => (
        <div className="grid gap-8">
          <Fieldset
            title="À la une"
            hint="Un seul article en tête du flux, et il en est retiré de la grille. Mettre celui-ci en avant retire donc le précédent."
          >
            <FeaturedSwitch id={item.id} featured={item.featured} />
          </Fieldset>

          <Fieldset
            title="Rebond"
            hint="La réalisation proposée en fin d'article. C'est la conversion secondaire : une preuve, pas une demande."
            // Borné : cette étape n'a pas d'aperçu à côté d'elle, donc ses champs
            // prendraient les 1150 px de l'éditeur. Un sélecteur de slug large d'un
            // écran ne se lit pas mieux, il se lit moins bien.
            className="max-w-md"
          >
            <Field label="Réalisation liée" optional>
              <Select
                value={v.relatedCase}
                onChange={(value) => set("relatedCase", value)}
                options={[
                  ["", "Aucune"] as const,
                  ...caseSlugs.map((slug) => [slug, slug] as const),
                ]}
              />
            </Field>
          </Fieldset>
        </div>
      ),
    },

    {
      id: "audience",
      label: "Audience",
      purpose:
        "Ce que le compteur sait, et ce qu'il ne sait pas. Rien à enregistrer ici.",
      state: "optional",
      // Aucune barre d'enregistrement : l'étape est en lecture seule.
      savers: [],
      render: () => <Audience item={item} views={views} />,
    },
  ]

  return (
    <div className="grid max-w-6xl gap-6">
      <EditorHeader
        backHref="/admin/articles"
        backLabel="Articles"
        slug={item.slug}
        title={item.title}
        published={item.status === "published"}
        previewHref={`/admin/articles/${item.slug}/apercu`}
        publicPath={`/ressources/${item.slug}`}
        remove={() => deleteArticle(item.id)}
        removeHint="Le corps et le compte de vues partent avec l'article."
      />

      <PublishPanel
        published={item.status === "published"}
        requirements={requirements}
        publish={(next) => publishArticle(item.id, next)}
        onGoToStep={setStep}
      />

      <StepEditor steps={steps} value={step} onValueChange={setStep} />
    </div>
  )
}

/**
 * La mise en avant, appliquée tout de suite.
 *
 * **Elle ne peut pas passer par la barre d'enregistrement**, et ce n'est pas un
 * détail de plomberie : `set_article_featured` retire la mise en avant précédente,
 * donc l'action porte sur un autre article que celui qu'on édite. La glisser parmi
 * les champs de la fiche aurait laissé croire qu'elle s'annule en quittant l'écran
 * sans enregistrer, alors qu'elle a déjà déplacé un article de la une.
 */
function FeaturedSwitch({ id, featured }: { id: string; featured: boolean }) {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={featured ? "secondary" : "outline"}
          size="md"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              const result = await setFeatured(id, !featured)
              if (result.status === "error") {
                setError(result.formError ?? "L'action a échoué.")
              }
            })
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Star
              className={cn("size-4", featured && "fill-brand text-brand")}
              strokeWidth={1.75}
            />
          )}
          {featured ? "Retirer de la une" : "Mettre à la une"}
        </Button>

        <span className="text-[0.845rem] text-label">
          {featured
            ? "Cet article est en tête du flux."
            : "Appliqué immédiatement, sans passer par l'enregistrement."}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-[0.82rem] text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Les vues, présentées pour ce qu'elles sont.
 *
 * Un total depuis toujours ne dit pas si l'article est lu **maintenant** : les
 * fenêtres à 7 et 30 jours sont ce qui rend le chiffre lisible. Et le compteur est
 * annoncé comme approximatif, parce qu'il l'est - tout compteur public l'est.
 */
/**
 * Les trente jours, **tous les trente**, y compris ceux sans vue.
 *
 * La base ne rend que les jours qui ont une ligne, ce qui est juste pour elle et faux
 * à l'écran : avec un seul jour de trafic, l'unique barre en `flex-1` prenait toute la
 * largeur et l'histogramme se lisait comme un mois entier au maximum. Un pavé orange,
 * là où la vérité est une barre fine sur trente. La fenêtre est donc reconstituée ici,
 * et l'absence de vue devient un creux plutôt qu'une absence de colonne.
 */
function thirtyDays(daily: readonly { day: string; views: number }[]) {
  const known = new Map(daily.map((one) => [one.day.slice(0, 10), one.views]))
  const days: { day: string; views: number }[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  for (let back = 29; back >= 0; back -= 1) {
    const at = new Date(cursor)
    at.setDate(cursor.getDate() - back)
    const key = isoDay(at)
    days.push({ day: key, views: known.get(key) ?? 0 })
  }
  return days
}

function Audience({
  item,
  views,
}: {
  item: ArticleDetail
  views: ArticleViews
}) {
  const days = thirtyDays(views.daily)
  const peak = Math.max(1, ...days.map((day) => day.views))

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

      {views.total > 0 ? (
        <section className="grid gap-3">
          <h3 className="font-display text-[1rem] font-bold tracking-[-0.01em] text-ink">
            Trente derniers jours
          </h3>
          {/* Un histogramme en CSS pur, sans bibliothèque : trente barres ne
              justifient pas d'embarquer un moteur de graphiques. */}
          <ol className="flex h-24 items-end gap-1">
            {days.map((day) => (
              <li
                key={day.day}
                title={`${day.day} : ${day.views} vue${day.views > 1 ? "s" : ""}`}
                className={cn(
                  "flex-1 rounded-t-xs",
                  // Un jour sans vue reste dessiné, en filet gris : le creux se lit,
                  // là où une colonne absente déformerait l'échelle des voisines.
                  day.views > 0 ? "bg-brand/70" : "bg-line"
                )}
                style={{
                  height:
                    day.views > 0
                      ? `${Math.max(6, (day.views / peak) * 100)}%`
                      : "2px",
                }}
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

      <p className="max-w-prose text-xs leading-relaxed text-label">
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

export { ArticleEditor }
