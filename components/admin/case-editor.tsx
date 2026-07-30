"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import {
  deleteCase,
  publishCase,
  setChapters,
  setGallery,
  setLessons,
  setMeta,
  setResults,
  updateCase,
} from "@/app/admin/(protected)/realisations/actions"
import { EditorHeader } from "@/components/admin/editor-header"
import {
  useCollection,
  useFieldSet,
  type Collection,
  type Row,
} from "@/components/admin/editor-state"
import {
  AddButton,
  Counter,
  Empty,
  Field,
  Fieldset,
  Folded,
  RemoveButton,
  RowError,
  Select,
  Toggle,
  area,
  input,
} from "@/components/admin/form-kit"
import {
  MediaDropzone,
  type UploadedMedia,
} from "@/components/admin/media-dropzone"
import {
  CaseCardPreview,
  CaseHeroPreview,
  Placement,
  ResultsPreview,
  TestimonialPreview,
  WithPlacements,
} from "@/components/admin/placement"
import {
  PublishPanel,
  type Requirement,
} from "@/components/admin/publish-panel"
import { RichText } from "@/components/admin/rich-text"
import { SortableList } from "@/components/admin/sortable"
import { StepEditor, type EditorStep } from "@/components/admin/step-editor"
import type { CaseDetail } from "@/lib/db/cases"
import { cn } from "@/lib/utils"

/**
 * Éditeur d'une réalisation.
 *
 * **Six étapes, une idée par étape.** L'écran précédent était honnête mais brutal :
 * cinq onglets, dont un portait trente champs d'affilée sous quatre titres de
 * section. On pouvait tout remplir, à condition de savoir déjà quoi remplir. Le
 * découpage suivait la plomberie - un onglet par procédure d'écriture - et non le
 * travail à faire.
 *
 * Ici les étapes suivent le récit qu'on est en train d'écrire : comment la fiche se
 * nomme, ce qui accroche, l'histoire de la mission, les preuves, les visuels, les
 * annexes. Chacune enregistre tout ce qu'elle touche, quel que soit le nombre de
 * procédures derrière - voir `step-editor.tsx` pour ce que ce découpage a coûté en
 * architecture, et `placement.tsx` pour ce qui remplace les aides textuelles.
 *
 * Ce qui n'a **pas** changé : le contrôle de complétude reste en base, les
 * collections sont toujours remplacées en bloc, et les corps de chapitre passent
 * toujours par l'éditeur riche - le reste par des champs simples, parce que du gras
 * dans un titre de carte ne servirait à rien.
 */
function CaseEditor({ item }: { item: CaseDetail }) {
  const [step, setStep] = React.useState("identite")

  /**
   * La fiche : un seul jeu de champs, réparti sur quatre étapes.
   *
   * C'est tout l'intérêt d'avoir hissé l'état. `update_case_study` prend la fiche
   * entière, mais plus rien n'oblige à la montrer entière.
   */
  const fiche = useFieldSet(
    "La fiche",
    {
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
      updateCase(item.id, { ...rest, heroMediaId: heroMedia[0]?.id ?? null })
  )
  const v = fiche.values
  const set = fiche.set

  const chapters = useCollection("Les chapitres", item.chapters, (items) =>
    setChapters(item.id, item.slug, { items })
  )
  const results = useCollection("Les résultats", item.results, (items) =>
    setResults(item.id, item.slug, { items })
  )
  const meta = useCollection("La fiche technique", item.meta, (items) =>
    setMeta(item.id, item.slug, { items })
  )
  const lessons = useCollection("Les enseignements", item.lessons, (items) =>
    setLessons(item.id, item.slug, { items })
  )
  const gallery = useCollection(
    "La galerie",
    item.gallery.map((media) => ({
      mediaId: media.id,
      caption: media.caption ?? "",
      url: media.url,
      alt: media.alt,
      originalName: media.originalName,
    })),
    (items) =>
      setGallery(item.id, item.slug, {
        items: items.map(({ mediaId, caption }) => ({ mediaId, caption })),
      })
  )

  /**
   * Ce qu'exige la publication, repris un à un de `publish_case_study`.
   *
   * Calculé sur `item` - les données enregistrées - et non sur la saisie en cours.
   * La publication interroge la base ; une pastille qui verdirait à la frappe
   * promettrait ce que la base refuserait encore.
   */
  const requirements: Requirement[] = [
    {
      label: "Un titre court",
      done: item.title.trim() !== "",
      step: "identite",
      stepLabel: "Identité",
    },
    {
      label: "Un secteur",
      done: item.sector.trim() !== "",
      step: "identite",
      stepLabel: "Identité",
    },
    {
      label: "Un résumé court, pour les cartes de listing",
      done: item.summary.trim() !== "",
      step: "accroches",
      stepLabel: "Accroches",
    },
    {
      label: "Un résumé long, pour l'accueil et le hero",
      done: item.teaser.trim() !== "",
      step: "accroches",
      stepLabel: "Accroches",
    },
    {
      label: "Au moins un chapitre de récit",
      done: item.chapters.length > 0,
      step: "recit",
      stepLabel: "Récit",
    },
  ]

  const card = (
    <Placement title="Carte du hub des réalisations">
      <CaseCardPreview
        sector={v.sector}
        year={v.year}
        title={v.title}
        summary={v.summary}
        figure={v.figure}
        measure={v.measure}
        imageUrl={v.heroMedia[0]?.url}
      />
    </Placement>
  )

  const steps: EditorStep[] = [
    {
      id: "identite",
      label: "Identité",
      purpose:
        "Comment la fiche se nomme, et à quelle adresse elle vit. Ces quatre champs se retrouvent partout : cartes, filtres de secteur, fil d'Ariane.",
      state: item.title.trim() && item.sector.trim() ? "ready" : "todo",
      savers: [fiche.saveable],
      render: () => (
        <WithPlacements aside={card}>
          <Fieldset>
            <Field
              label="Titre court"
              hint="Le nom de la réalisation sur toutes les cartes de listing."
              example="Pilotage de production Voltéis"
              error={fiche.fieldErrors.title}
            >
              <input
                className={input}
                value={v.title}
                onChange={(event) => set("title", event.target.value)}
              />
            </Field>

            <Field
              label="Identifiant d'URL"
              hint={`La fiche sera à l'adresse /realisations/${v.slug || "…"}. Le changer casse les liens déjà partagés.`}
              error={fiche.fieldErrors.slug}
            >
              <input
                className={cn(input, "font-mono text-[0.875rem]")}
                value={v.slug}
                onChange={(event) => set("slug", event.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <Field
                label="Secteur"
                hint="Sert de filtre sur /realisations. Reprenez un secteur existant plutôt que d'en créer un voisin."
                error={fiche.fieldErrors.sector}
              >
                <input
                  className={input}
                  value={v.sector}
                  onChange={(event) => set("sector", event.target.value)}
                />
              </Field>
              <Field label="Année" error={fiche.fieldErrors.year}>
                <input
                  className={cn(input, "font-mono")}
                  value={v.year}
                  onChange={(event) => set("year", event.target.value)}
                />
              </Field>
            </div>
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "accroches",
      label: "Accroches",
      purpose:
        "Les trois textes qui décident si on ouvre la fiche. Le résultat va dans le titre : un visiteur doit savoir ce que la mission a produit avant de cliquer.",
      state: item.summary.trim() && item.teaser.trim() ? "ready" : "todo",
      savers: [fiche.saveable],
      render: () => (
        <WithPlacements
          aside={
            <>
              <Placement title="Hero de la fiche">
                <CaseHeroPreview
                  badge={v.badge}
                  heroTitle={v.heroTitle}
                  teaser={v.teaser}
                />
              </Placement>
              {card}
            </>
          }
        >
          <Fieldset>
            <Field
              label="Titre du hero"
              hint="Le grand titre en haut de la fiche. Une phrase, avec le résultat dedans."
              example="Quatre outils déconnectés. Une plateforme. -38 % de temps administratif"
              error={fiche.fieldErrors.heroTitle}
            >
              <input
                className={input}
                value={v.heroTitle}
                onChange={(event) => set("heroTitle", event.target.value)}
              />
            </Field>

            <Field
              label="Étiquette du hero"
              hint="La petite ligne au-dessus du titre."
              example="Industrie · Plateforme métier"
              optional
              error={fiche.fieldErrors.badge}
            >
              <input
                className={input}
                value={v.badge}
                onChange={(event) => set("badge", event.target.value)}
              />
            </Field>

            <Field
              label="Résumé court"
              hint="Deux lignes sous le titre, sur les cartes de /realisations."
              error={fiche.fieldErrors.summary}
            >
              <textarea
                rows={2}
                className={area}
                value={v.summary}
                onChange={(event) => set("summary", event.target.value)}
              />
            </Field>
            <div className="-mt-3 flex justify-end">
              <Counter value={v.summary} max={600} />
            </div>

            <Field
              label="Résumé long"
              hint="La version développée : carte de l'accueil, et sous le titre du hero."
              error={fiche.fieldErrors.teaser}
            >
              <textarea
                rows={3}
                className={area}
                value={v.teaser}
                onChange={(event) => set("teaser", event.target.value)}
              />
            </Field>
            <div className="-mt-3 flex justify-end">
              <Counter value={v.teaser} max={1200} />
            </div>
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "recit",
      label: "Récit",
      count: chapters.count,
      purpose:
        "L'histoire de la mission, dans l'ordre. Un chapitre ouvert à la fois : la numérotation est refaite à l'enregistrement, réordonner suffit.",
      state: item.chapters.length > 0 ? "ready" : "todo",
      savers: [chapters.saveable],
      render: () => <Chapters chapters={chapters} />,
    },

    {
      id: "preuves",
      label: "Preuves",
      count: results.count,
      purpose:
        "Ce qui rend la mission crédible : un chiffre d'accroche, les résultats mesurés, la parole du client. Tout est facultatif, et des valeurs exactes uniquement.",
      state: "optional",
      savers: [fiche.saveable, results.saveable],
      render: () => (
        <WithPlacements
          aside={
            <>
              {card}
              <Placement title="Bloc de résultats">
                <ResultsPreview label={v.resultsLabel} items={results.rows} />
              </Placement>
              <Placement title="Bandeau de témoignage">
                <TestimonialPreview
                  quote={v.testimonialQuote}
                  name={v.testimonialName}
                  role={v.testimonialRole}
                  initials={v.testimonialInitials}
                />
              </Placement>
            </>
          }
        >
          <Fieldset
            title="Le chiffre d'accroche"
            hint="Celui qui s'affiche sur les cartes. Toute mission ne se résume pas à une mesure, et en réclamer une pousserait à en inventer : sans chiffre, les cartes n'affichent simplement pas le bloc."
          >
            <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <Field
                label="Valeur"
                example="-38 %"
                optional
                error={fiche.fieldErrors.figure}
              >
                <input
                  className={cn(input, "font-display font-extrabold")}
                  value={v.figure}
                  onChange={(event) => set("figure", event.target.value)}
                />
              </Field>
              <Field
                label="Ce qu'elle mesure"
                example="de temps administratif par commande"
                optional
                error={fiche.fieldErrors.measure}
              >
                <input
                  className={input}
                  value={v.measure}
                  onChange={(event) => set("measure", event.target.value)}
                />
              </Field>
            </div>
          </Fieldset>

          <Fieldset
            title="Les résultats mesurés"
            hint="Le bloc chiffré de la fiche. Quatre valeurs se lisent bien, huit ne se lisent plus."
          >
            {results.count > 0 ? (
              <SortableList
                id="results"
                items={results.rows}
                onReorder={results.replace}
              >
                {(row, index) => (
                  <div className="grid gap-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        aria-label={`Valeur du résultat ${index + 1}`}
                        placeholder="-38 %"
                        className={cn(
                          input,
                          "h-10 w-28 font-display font-extrabold"
                        )}
                        value={row.value}
                        onChange={(event) =>
                          results.update(row.id, {
                            value: event.target.value,
                          })
                        }
                      />
                      <input
                        aria-label={`Libellé du résultat ${index + 1}`}
                        placeholder="de temps de traitement"
                        className={cn(input, "h-10 flex-1")}
                        value={row.label}
                        onChange={(event) =>
                          results.update(row.id, {
                            label: event.target.value,
                          })
                        }
                      />
                      <RemoveButton
                        label={`Retirer le résultat ${index + 1}`}
                        onClick={() => results.remove(row.id)}
                      />
                    </div>
                    <RowError
                      message={
                        results.errorAt(index, "value") ??
                        results.errorAt(index, "label")
                      }
                    />
                  </div>
                )}
              </SortableList>
            ) : (
              <Empty>Aucun résultat chiffré pour l&apos;instant.</Empty>
            )}

            <AddButton
              label="Ajouter un résultat"
              onClick={() => results.add({ value: "", label: "" })}
            />
          </Fieldset>

          <Fieldset
            title="Le témoignage"
            hint="Facultatif, mais tout ou rien : un verbatim sans nom ne s'affiche pas, un nom sans verbatim n'a rien à dire."
          >
            <Field
              label="Verbatim"
              optional
              error={fiche.fieldErrors.testimonialQuote}
            >
              <textarea
                rows={3}
                className={area}
                value={v.testimonialQuote}
                onChange={(event) =>
                  set("testimonialQuote", event.target.value)
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem]">
              <Field label="Nom" error={fiche.fieldErrors.testimonialName}>
                <input
                  className={input}
                  value={v.testimonialName}
                  onChange={(event) =>
                    set("testimonialName", event.target.value)
                  }
                />
              </Field>
              <Field label="Rôle" error={fiche.fieldErrors.testimonialRole}>
                <input
                  className={input}
                  value={v.testimonialRole}
                  onChange={(event) =>
                    set("testimonialRole", event.target.value)
                  }
                />
              </Field>
              <Field
                label="Initiales"
                error={fiche.fieldErrors.testimonialInitials}
              >
                <input
                  maxLength={4}
                  className={cn(input, "text-center font-mono uppercase")}
                  value={v.testimonialInitials}
                  onChange={(event) =>
                    set("testimonialInitials", event.target.value)
                  }
                />
              </Field>
            </div>
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "visuels",
      label: "Visuels",
      count: gallery.count,
      purpose:
        "L'image de tête, puis la galerie. Déposez plusieurs fichiers à la fois ; ils s'ajoutent à la fin et se réordonnent à la poignée.",
      state: "optional",
      savers: [fiche.saveable, gallery.saveable],
      render: () => (
        <div className="grid gap-8">
          <Fieldset
            title="Image de tête"
            hint="Une seule, en haut de la fiche et sur les cartes. Déposer une nouvelle image remplace la précédente."
          >
            <MediaDropzone
              label="Image principale"
              value={v.heroMedia}
              onChange={(media) => set("heroMedia", media)}
            />
          </Fieldset>

          <Fieldset
            title={`Galerie (${gallery.count})`}
            hint="Des captures de l'interface livrée. La légende est facultative."
          >
            <MediaDropzone
              label="Ajouter des images"
              hint="Plusieurs à la fois. Elles s'ajoutent à la fin de la galerie."
              multiple
              value={[]}
              onChange={(media) => {
                for (const one of media) {
                  gallery.add({
                    mediaId: one.id,
                    caption: "",
                    url: one.url,
                    alt: one.alt,
                    originalName: one.originalName,
                  })
                }
              }}
            />

            {gallery.count > 0 ? (
              <SortableList
                id="gallery"
                items={gallery.rows}
                onReorder={gallery.replace}
              >
                {(row, index) => (
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.url}
                      alt={row.alt}
                      className="aspect-4/3 w-24 shrink-0 rounded-xs border border-line object-cover"
                    />
                    <div className="grid min-w-0 flex-1 gap-1.5">
                      <p className="truncate text-xs text-label">
                        {row.originalName}
                      </p>
                      <input
                        aria-label={`Légende de l'image ${index + 1}`}
                        placeholder="Légende (facultative)"
                        className={cn(input, "h-10")}
                        value={row.caption}
                        onChange={(event) =>
                          gallery.update(row.id, {
                            caption: event.target.value,
                          })
                        }
                      />
                    </div>
                    <RemoveButton
                      label={`Retirer l'image ${index + 1}`}
                      onClick={() => gallery.remove(row.id)}
                    />
                  </div>
                )}
              </SortableList>
            ) : null}
          </Fieldset>
        </div>
      ),
    },

    {
      id: "annexes",
      label: "Annexes",
      purpose:
        "Ce qui complète la fiche sans la porter : le tableau technique, les enseignements, et les réglages d'affichage qu'on choisit une fois.",
      state: "optional",
      savers: [fiche.saveable, meta.saveable, lessons.saveable],
      render: () => (
        <div className="grid gap-8">
          <Fieldset
            title="Fiche technique"
            hint="Le tableau en fin de page : durée, taille d'équipe, technologies."
          >
            {meta.count > 0 ? (
              <SortableList
                id="meta"
                items={meta.rows}
                onReorder={meta.replace}
              >
                {(row, index) => (
                  <div className="flex items-center gap-3">
                    <input
                      aria-label={`Libellé ${index + 1}`}
                      placeholder="Durée"
                      className={cn(input, "h-10 w-40")}
                      value={row.label}
                      onChange={(event) =>
                        meta.update(row.id, { label: event.target.value })
                      }
                    />
                    <input
                      aria-label={`Valeur ${index + 1}`}
                      placeholder="14 semaines"
                      className={cn(input, "h-10 flex-1")}
                      value={row.value}
                      onChange={(event) =>
                        meta.update(row.id, { value: event.target.value })
                      }
                    />
                    <RemoveButton
                      label={`Retirer la ligne ${index + 1}`}
                      onClick={() => meta.remove(row.id)}
                    />
                  </div>
                )}
              </SortableList>
            ) : (
              <Empty>Aucune ligne technique.</Empty>
            )}
            <AddButton
              label="Ajouter une ligne"
              onClick={() => meta.add({ label: "", value: "" })}
            />
          </Fieldset>

          <Fieldset
            title="Enseignements"
            hint="Ce que la mission a appris, sans langue de bois. C'est la section qui sonne le plus juste quand elle admet une limite."
          >
            {lessons.count > 0 ? (
              <SortableList
                id="lessons"
                items={lessons.rows}
                onReorder={lessons.replace}
              >
                {(row, index) => (
                  <div className="flex items-start gap-3">
                    <textarea
                      rows={2}
                      aria-label={`Enseignement ${index + 1}`}
                      placeholder="Un champ laissé vide et signalé est préférable à un champ rempli par approximation."
                      className={area}
                      value={row.text}
                      onChange={(event) =>
                        lessons.update(row.id, { text: event.target.value })
                      }
                    />
                    <RemoveButton
                      label={`Retirer l'enseignement ${index + 1}`}
                      onClick={() => lessons.remove(row.id)}
                    />
                  </div>
                )}
              </SortableList>
            ) : (
              <Empty>Aucun enseignement.</Empty>
            )}
            <AddButton
              label="Ajouter un enseignement"
              onClick={() => lessons.add({ text: "" })}
            />
          </Fieldset>

          <Folded
            title="Réglages d'affichage"
            hint="halo, accent, mise en avant"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Halo"
                hint="La lueur derrière l'illustration. Un seul halo par écran."
              >
                <Select
                  value={v.halo}
                  onChange={(value) => set("halo", value as "warm" | "cool")}
                  options={[
                    ["warm", "Chaud (orange)"],
                    ["cool", "Froid (bleu)"],
                  ]}
                />
              </Field>
              <Field
                label="Accent"
                hint="La couleur des filets et des pastilles de la fiche."
              >
                <Select
                  value={v.accent}
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
              hint="« Résultats » si laissé vide."
              optional
              error={fiche.fieldErrors.resultsLabel}
            >
              <input
                className={input}
                placeholder="Résultats"
                value={v.resultsLabel}
                onChange={(event) => set("resultsLabel", event.target.value)}
              />
            </Field>

            <div className="grid gap-1">
              <Toggle
                checked={v.featured}
                onChange={(checked) => set("featured", checked)}
                label="Mise en avant sur l'accueil"
                hint="La fiche apparaît dans la section Réalisations de la page d'accueil."
              />
              {/* Le libellé dit explicitement où l'option agit : sur l'accueil, la
                  disposition alterne selon la position de la fiche, et cette case
                  n'y change rien. Sans cette précision, on croit qu'elle est en
                  cause. */}
              <Toggle
                checked={v.wide}
                onChange={(checked) => set("wide", checked)}
                label="Carte large sur /realisations"
                hint="Sans effet sur l'accueil, où le visuel alterne de côté un cas sur deux."
              />
            </div>
          </Folded>
        </div>
      ),
    },
  ]

  return (
    <div className="grid max-w-6xl gap-6">
      <EditorHeader
        backHref="/admin/realisations"
        backLabel="Réalisations"
        slug={item.slug}
        title={item.title}
        published={item.status === "published"}
        previewHref={`/admin/realisations/${item.slug}/apercu`}
        publicPath={`/realisations/${item.slug}`}
        remove={() => deleteCase(item.id)}
        removeHint="Chapitres, résultats, galerie : tout part avec la fiche."
      />

      <PublishPanel
        published={item.status === "published"}
        requirements={requirements}
        publish={(next) => publishCase(item.id, next)}
        onGoToStep={setStep}
      />

      <StepEditor steps={steps} value={step} onValueChange={setStep} />
    </div>
  )
}

type ChapterFields = {
  num: string
  title: string
  text: string
  callout: string
}

/**
 * Les chapitres, en accordéon.
 *
 * **Un seul corps ouvert à la fois**, et c'est le changement qui a le plus servi.
 * Huit éditeurs riches empilés faisaient plusieurs écrans de haut : on perdait le
 * plan de la fiche, il fallait défiler pour savoir combien de chapitres restaient,
 * et huit instances de Tiptap tournaient pour une seule qu'on utilisait. Replié,
 * chaque chapitre montre son titre et le début de son texte - assez pour se
 * repérer, ce qui est tout ce qu'on demande à un sommaire.
 *
 * Refermer un chapitre ne perd rien : l'état est tenu par l'éditeur, l'accordéon ne
 * décide que de ce qui est monté.
 */
function Chapters({ chapters }: { chapters: Collection<ChapterFields> }) {
  const [open, setOpen] = React.useState<string | null>(
    chapters.rows[0]?.id ?? null
  )

  return (
    <div className="grid gap-4">
      {chapters.count > 0 ? (
        <SortableList
          id="chapters"
          items={chapters.rows}
          onReorder={chapters.replace}
        >
          {(row, index) => {
            const expanded = open === row.id
            const error =
              chapters.errorAt(index, "title") ??
              chapters.errorAt(index, "text") ??
              chapters.errorAt(index, "callout")

            return (
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-label tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <input
                    aria-label={`Titre du chapitre ${index + 1}`}
                    placeholder="Titre du chapitre"
                    className={cn(input, "h-10 flex-1")}
                    value={row.title}
                    onChange={(event) =>
                      chapters.update(row.id, { title: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : row.id)}
                    aria-expanded={expanded}
                    className="flex min-h-9 items-center gap-1 rounded-sm px-2 text-[0.82rem] text-label transition-colors duration-100 hover:bg-inset hover:text-ink"
                  >
                    {expanded ? "Replier" : "Rédiger"}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "size-3.5 transition-transform duration-100",
                        expanded && "rotate-180"
                      )}
                      strokeWidth={1.75}
                    />
                  </button>
                  <RemoveButton
                    label={`Retirer le chapitre ${index + 1}`}
                    onClick={() => chapters.remove(row.id)}
                  />
                </div>

                {expanded ? (
                  <>
                    <Field
                      label="Corps du chapitre"
                      hint="Gras, italique, listes, liens et citation. Les titres viennent du gabarit de page, pas du texte."
                    >
                      <RichText
                        value={row.text}
                        onChange={(html) =>
                          chapters.update(row.id, { text: html })
                        }
                        placeholder="Le corps du chapitre…"
                      />
                    </Field>
                    <Field
                      label="Encadré de décision"
                      hint="Mis en exergue derrière un filet orange, dans le chapitre. En texte simple."
                      optional
                    >
                      <textarea
                        rows={2}
                        className={area}
                        placeholder="Une décision structurante, et ce qu'elle a coûté."
                        value={row.callout}
                        onChange={(event) =>
                          chapters.update(row.id, {
                            callout: event.target.value,
                          })
                        }
                      />
                    </Field>
                  </>
                ) : (
                  <Summary row={row} />
                )}

                <RowError message={error} />
              </div>
            )
          }}
        </SortableList>
      ) : (
        <Empty>
          Aucun chapitre. Une fiche a besoin d&apos;au moins un pour être
          publiée.
        </Empty>
      )}

      <AddButton
        label="Ajouter un chapitre"
        onClick={() =>
          // Le nouveau chapitre s'ouvre aussitôt : on vient de le créer pour y
          // écrire, et le laisser replié demanderait un clic pour rien.
          setOpen(chapters.add({ num: "", title: "", text: "", callout: "" }))
        }
      />
    </div>
  )
}

/** Le début du texte d'un chapitre replié, débarrassé de ses balises. */
function Summary({ row }: { row: Row<ChapterFields> }) {
  const plain = row.text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return (
    <p className="text-[0.82rem] leading-relaxed text-label">
      {plain === "" ? (
        <span className="text-faint italic">Corps vide.</span>
      ) : (
        <>
          {plain.slice(0, 150)}
          {plain.length > 150 ? "…" : null}
        </>
      )}
      {row.callout.trim() ? (
        <span className="ml-2 rounded-xs bg-inset px-1.5 py-0.5 text-[0.7rem] text-label">
          encadré
        </span>
      ) : null}
    </p>
  )
}

export { CaseEditor }
