"use client"

import * as React from "react"

import {
  deleteService,
  publishService,
  setDeliverables,
  setFaq,
  setTechChoices,
  updateService,
} from "@/app/admin/(protected)/expertises/actions"
import { EditorHeader } from "@/components/admin/editor-header"
import {
  useCollection,
  useFieldSet,
  type Collection,
} from "@/components/admin/editor-state"
import {
  AddButton,
  Empty,
  Field,
  Fieldset,
  RemoveButton,
  RowError,
  Select,
  area,
  input,
} from "@/components/admin/form-kit"
import {
  ExpertiseHeroPreview,
  ExpertiseRowPreview,
  Placement,
  WithPlacements,
} from "@/components/admin/placement"
import {
  PublishPanel,
  type Requirement,
} from "@/components/admin/publish-panel"
import { SortableList } from "@/components/admin/sortable"
import { StepEditor, type EditorStep } from "@/components/admin/step-editor"
import type { FamilySummary, ServiceDetail } from "@/lib/db/expertises"
import { cn } from "@/lib/utils"

/**
 * Éditeur d'un service d'expertise.
 *
 * Même moule que les réalisations et les articles. La particularité de cette
 * collection est ailleurs : **une écriture ici peut casser la navigation du site**,
 * présente sur chaque page. Trois garde-fous vivent en base - une famille désigne
 * explicitement le service que son entrée de menu ouvre, une famille non vide ne se
 * supprime pas, un service cible de nav ne se supprime pas. L'écran le dit là où la
 * décision se prend, plutôt que de laisser la personne l'apprendre par un refus.
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
  const [step, setStep] = React.useState("identite")

  const fiche = useFieldSet(
    "La fiche",
    {
      slug: item.slug,
      familyId: item.familyId,
      title: item.title,
      tagline: item.tagline,
      problem: item.problem,
      relatedCase: item.relatedCase,
      ctaTitle: item.ctaTitle,
    },
    (values) => updateService(item.id, values)
  )
  const v = fiche.values
  const set = fiche.set

  const deliverables = useCollection(
    "Les livrables",
    item.deliverables,
    (items) => setDeliverables(item.id, item.slug, { items })
  )
  const tech = useCollection(
    "Les choix techniques",
    item.techChoices,
    (items) => setTechChoices(item.id, item.slug, { items })
  )
  const faq = useCollection("Les objections", item.faq, (items) =>
    setFaq(item.id, item.slug, { items })
  )

  /** Ce qu'exige la publication, repris un à un de `publish_expertise_service`. */
  const requirements: Requirement[] = [
    {
      label: "Un titre",
      done: item.title.trim() !== "",
      step: "identite",
      stepLabel: "Identité",
    },
    {
      label: "Une accroche",
      done: item.tagline.trim() !== "",
      step: "promesse",
      stepLabel: "Promesse",
    },
    {
      label: "Le problème du visiteur",
      done: item.problem.trim() !== "",
      step: "promesse",
      stepLabel: "Promesse",
    },
    {
      label: "Au moins un livrable",
      done: item.deliverables.length > 0,
      step: "livrables",
      stepLabel: "Livrables",
    },
  ]

  const familyLabel =
    families.find((family) => family.id === v.familyId)?.label ??
    item.familyLabel

  const hero = (
    <Placement title="Hero de la page du service">
      <ExpertiseHeroPreview
        familyLabel={familyLabel}
        title={v.title}
        tagline={v.tagline}
        problem={v.problem}
      />
    </Placement>
  )

  const row = (
    <Placement title="Ligne d'index du hub /expertises">
      <ExpertiseRowPreview title={v.title} tagline={v.tagline} />
    </Placement>
  )

  const steps: EditorStep[] = [
    {
      id: "identite",
      label: "Identité",
      purpose:
        "Comment le service se nomme, à quelle adresse il vit, et dans quelle famille il se range. La famille décide de l'entrée de menu sous laquelle on le trouve.",
      state: item.title.trim() ? "ready" : "todo",
      savers: [fiche.saveable],
      render: () => (
        <WithPlacements aside={row}>
          <Fieldset>
            <Field
              label="Titre"
              hint="Le nom du service, sur le hub comme en tête de sa page."
              example="Plateformes métier sur mesure"
              error={fiche.fieldErrors.title}
            >
              <input
                className={input}
                value={v.title}
                onChange={(event) => set("title", event.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Identifiant d'URL"
                hint={`La page sera à l'adresse /expertises/${v.slug || "…"}.`}
                error={fiche.fieldErrors.slug}
              >
                <input
                  className={cn(input, "font-mono text-[0.875rem]")}
                  value={v.slug}
                  onChange={(event) => set("slug", event.target.value)}
                />
              </Field>
              <Field
                label="Famille"
                hint="Le groupe du hub, et l'entrée de menu."
                error={fiche.fieldErrors.familyId}
              >
                <Select
                  value={v.familyId}
                  onChange={(value) => set("familyId", value)}
                  options={families.map(
                    (family) => [family.id, family.label] as const
                  )}
                />
              </Field>
            </div>

            {/*
              L'avertissement est **à l'endroit de la décision**, et non dans un
              message d'erreur après coup : renommer l'identifiant d'un service que
              sa famille désigne comme cible de menu était, avant que la base ne
              fasse suivre la référence, le défaut qui cassait la nav en silence.
            */}
            <p className="rounded-sm border-l-2 border-info bg-info-subtle px-4 py-3 text-[0.82rem] leading-relaxed text-info-text">
              Changer l&apos;identifiant d&apos;URL casse les liens déjà
              partagés. Si une famille désigne ce service comme cible de son
              entrée de menu, la référence suit automatiquement.
            </p>
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "promesse",
      label: "Promesse",
      purpose:
        "Ce que le service fait, et le problème auquel il répond. Le problème vient avant la réponse : le visiteur doit se reconnaître avant d'être convaincu.",
      state: item.tagline.trim() && item.problem.trim() ? "ready" : "todo",
      savers: [fiche.saveable],
      render: () => (
        <WithPlacements
          aside={
            <>
              {hero}
              {row}
            </>
          }
        >
          <Fieldset>
            <Field
              label="Accroche"
              hint="Une phrase, affichée sur le hub et sous le titre de la page. C'est aussi la description du service pour les moteurs de recherche."
              error={fiche.fieldErrors.tagline}
            >
              <textarea
                rows={2}
                className={area}
                value={v.tagline}
                onChange={(event) => set("tagline", event.target.value)}
              />
            </Field>

            <Field
              label="Le problème du visiteur"
              hint="Sa situation, dans ses mots, avant notre réponse. C'est le texte le plus lu de la page."
              error={fiche.fieldErrors.problem}
            >
              <textarea
                rows={6}
                className={area}
                value={v.problem}
                onChange={(event) => set("problem", event.target.value)}
              />
            </Field>
          </Fieldset>
        </WithPlacements>
      ),
    },

    {
      id: "livrables",
      label: "Livrables",
      count: deliverables.count,
      purpose:
        "Ce que le client obtient, nommé. Des livrables, pas des promesses : au moins un est exigé à la publication, parce que c'est ce que la page s'engage à dire.",
      state: item.deliverables.length > 0 ? "ready" : "todo",
      savers: [deliverables.saveable],
      render: () => (
        <Pairs
          collection={deliverables}
          listId="deliverables"
          titlePlaceholder="Une plateforme centrée sur les postes de travail"
          textPlaceholder="Ce que cela signifie concrètement."
          addLabel="Ajouter un livrable"
          emptyLabel="Aucun livrable. Un au moins est exigé pour publier."
        />
      ),
    },

    {
      id: "technique",
      label: "Technique",
      count: tech.count,
      purpose:
        "Les choix assumés, avec leur raison. C'est ce qui distingue une page d'expertise d'une plaquette : un choix sans sa raison n'est qu'une liste de technologies.",
      state: "optional",
      savers: [tech.saveable],
      render: () => (
        <Pairs
          collection={tech}
          listId="tech"
          titlePlaceholder="TypeScript de bout en bout"
          textPlaceholder="Pourquoi ce choix, et ce qu'il coûte."
          addLabel="Ajouter un choix"
          emptyLabel="Aucun choix technique."
        />
      ),
    },

    {
      id: "objections",
      label: "Objections",
      count: faq.count,
      purpose:
        "Les vraies questions, pas du remplissage. C'est le bloc qui lève le doute juste avant la demande de contact - et une réponse honnête y vaut mieux qu'une réponse avantageuse.",
      state: "optional",
      savers: [faq.saveable],
      render: () => (
        <div className="grid gap-4">
          {faq.count > 0 ? (
            <SortableList id="faq" items={faq.rows} onReorder={faq.replace}>
              {(row, index) => (
                <div className="grid gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      aria-label={`Question ${index + 1}`}
                      placeholder="Combien de temps avant d'avoir quelque chose d'utilisable ?"
                      className={cn(input, "h-10 flex-1 font-medium")}
                      value={row.question}
                      onChange={(event) =>
                        faq.update(row.id, { question: event.target.value })
                      }
                    />
                    <RemoveButton
                      label={`Retirer l'objection ${index + 1}`}
                      onClick={() => faq.remove(row.id)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    aria-label={`Réponse ${index + 1}`}
                    placeholder="Une réponse honnête, y compris quand elle ne va pas dans notre sens."
                    className={area}
                    value={row.answer}
                    onChange={(event) =>
                      faq.update(row.id, { answer: event.target.value })
                    }
                  />
                  <RowError
                    message={
                      faq.errorAt(index, "question") ??
                      faq.errorAt(index, "answer")
                    }
                  />
                </div>
              )}
            </SortableList>
          ) : (
            <Empty>Aucune objection.</Empty>
          )}

          <AddButton
            label="Ajouter une objection"
            onClick={() => faq.add({ question: "", answer: "" })}
          />
        </div>
      ),
    },

    {
      id: "action",
      label: "Action",
      purpose:
        "Aucune impasse : la page finit sur une preuve, puis une demande. La preuve est une réalisation, la demande est le libellé du bandeau de contact.",
      state: "optional",
      savers: [fiche.saveable],
      render: () => (
        <Fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Réalisation illustrant ce service"
              hint="La preuve avant la demande. Le CTA n'arrive jamais avant elle."
              optional
            >
              <Select
                value={v.relatedCase}
                onChange={(value) => set("relatedCase", value)}
                options={[
                  ["", "Aucune"] as const,
                  ...caseSlugs.map((slug) => [slug, slug] as const),
                ]}
              />
            </Field>
            <Field
              label="Libellé du bandeau de contact"
              example="Parlons de votre plateforme"
              optional
              error={fiche.fieldErrors.ctaTitle}
            >
              <input
                className={input}
                value={v.ctaTitle}
                onChange={(event) => set("ctaTitle", event.target.value)}
              />
            </Field>
          </div>
        </Fieldset>
      ),
    },
  ]

  return (
    <div className="grid max-w-6xl gap-6">
      <EditorHeader
        backHref="/admin/expertises"
        backLabel="Expertises"
        crumb={item.familyLabel}
        slug={item.slug}
        title={item.title}
        published={item.status === "published"}
        previewHref={`/admin/expertises/${item.slug}/apercu`}
        publicPath={`/expertises/${item.slug}`}
        remove={() => deleteService(item.id)}
        removeHint="Refusé si une famille désigne ce service comme cible de son entrée de menu."
      />

      <PublishPanel
        published={item.status === "published"}
        requirements={requirements}
        publish={(next) => publishService(item.id, next)}
        onGoToStep={setStep}
      />

      <StepEditor steps={steps} value={step} onValueChange={setStep} />
    </div>
  )
}

/**
 * Livrables et choix techniques : même forme, un titre et un texte.
 *
 * Les deux collections partagent leur composant plutôt que leur procédure : elles
 * s'enregistrent séparément, mais elles se saisissent de la même façon, et deux
 * écrans jumeaux qui divergent avec le temps sont un piège connu.
 */
function Pairs({
  collection,
  listId,
  titlePlaceholder,
  textPlaceholder,
  addLabel,
  emptyLabel,
}: {
  collection: Collection<{ title: string; text: string }>
  listId: string
  titlePlaceholder: string
  textPlaceholder: string
  addLabel: string
  emptyLabel: string
}) {
  return (
    <div className="grid gap-4">
      {collection.count > 0 ? (
        <SortableList
          id={listId}
          items={collection.rows}
          onReorder={collection.replace}
        >
          {(row, index) => (
            <div className="grid gap-2">
              <div className="flex items-center gap-3">
                <input
                  aria-label={`Titre de l'entrée ${index + 1}`}
                  placeholder={titlePlaceholder}
                  className={cn(input, "h-10 flex-1 font-medium")}
                  value={row.title}
                  onChange={(event) =>
                    collection.update(row.id, { title: event.target.value })
                  }
                />
                <RemoveButton
                  label={`Retirer l'entrée ${index + 1}`}
                  onClick={() => collection.remove(row.id)}
                />
              </div>
              <textarea
                rows={2}
                aria-label={`Explication de l'entrée ${index + 1}`}
                placeholder={textPlaceholder}
                className={area}
                value={row.text}
                onChange={(event) =>
                  collection.update(row.id, { text: event.target.value })
                }
              />
              <RowError
                message={
                  collection.errorAt(index, "title") ??
                  collection.errorAt(index, "text")
                }
              />
            </div>
          )}
        </SortableList>
      ) : (
        <Empty>{emptyLabel}</Empty>
      )}

      <AddButton
        label={addLabel}
        onClick={() => collection.add({ title: "", text: "" })}
      />
    </div>
  )
}

export { ExpertiseEditor }
