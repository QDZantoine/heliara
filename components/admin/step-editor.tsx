"use client"

import * as React from "react"
import { Tabs } from "@base-ui/react/tabs"
import { ArrowRight, Check, Loader2 } from "lucide-react"

import { commitAll, type Saveable } from "@/components/admin/editor-state"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * L'éditeur en étapes.
 *
 * **Des étapes, mais pas un assistant.** Un assistant impose l'ordre et verrouille
 * ce qui n'a pas été validé ; c'est ce qu'il faut pour une première saisie et c'est
 * insupportable ensuite, quand on revient corriger une phrase. Ici les étapes sont
 * numérotées, portent leur état, et proposent « Suivant » - mais toutes restent
 * atteignables d'un clic. Une première rédaction se fait en descendant le rail, une
 * retouche se fait en un clic. Le même écran sert les deux.
 *
 * Le rail dit trois choses d'un coup d'œil, et c'est ce qui remplace la lecture des
 * trente champs : ce qui est prêt, ce qui manque pour publier, et ce qui n'est pas
 * encore enregistré.
 *
 * **Changer d'étape ne perd rien.** L'état est tenu par l'éditeur, pas par le
 * panneau - voir `editor-state.ts`. C'est ce qui autorise le découpage libre : une
 * étape peut montrer quatre champs d'un jeu qui s'enregistre en entier.
 */

/**
 * L'état d'une étape.
 *
 * - `ready` : ce que la publication exige ici est là.
 * - `todo` : il manque quelque chose que la publication exige.
 * - `optional` : la publication n'exige rien ici.
 *
 * Il se calcule sur les données **enregistrées**, pas sur la saisie en cours. C'est
 * volontaire : la publication interroge la base, et un rail qui verdirait à la
 * frappe promettrait ce que la base refuserait encore.
 */
export type StepState = "ready" | "todo" | "optional"

export type EditorStep = {
  id: string
  /** Le libellé du rail. Court, deux mots au plus. */
  label: string
  /** Ce que l'étape sert à décider, en une phrase. Affichée en tête du panneau. */
  purpose: string
  /** Nombre d'éléments, pour les étapes qui portent une collection. */
  count?: number
  state: StepState
  /** Tout ce que cette étape enregistre. Une seule action, plusieurs procédures. */
  savers: readonly Saveable[]
  render: () => React.ReactNode
}

export function StepEditor({
  steps,
  value,
  onValueChange,
}: {
  steps: readonly EditorStep[]
  value: string
  onValueChange: (value: string) => void
}) {
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === value)
  )
  const next = steps[index + 1]

  return (
    <Tabs.Root
      orientation="vertical"
      value={value}
      onValueChange={(chosen) => onValueChange(String(chosen))}
      className="grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10"
    >
      {/*
        Le rail défile horizontalement sous 1024 px plutôt que de se replier en
        liste déroulante : une liste déroulante cacherait précisément ce qu'il
        apporte, l'état de chaque étape.
      */}
      <Tabs.List
        aria-label="Étapes"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:sticky lg:top-6 lg:mx-0 lg:h-fit lg:flex-col lg:overflow-visible lg:px-0"
      >
        {steps.map((step, position) => (
          <RailItem key={step.id} step={step} position={position} />
        ))}
      </Tabs.List>

      <div className="min-w-0">
        {steps.map((step) => (
          <Tabs.Panel key={step.id} value={step.id} className="grid gap-6">
            <header className="grid gap-1">
              <h2 className="font-display text-[1.3rem] leading-tight font-bold tracking-[-0.015em] text-ink">
                {step.label}
              </h2>
              <p className="max-w-prose text-[0.9rem] leading-relaxed text-body">
                {step.purpose}
              </p>
            </header>

            {step.render()}

            {/* Une étape qui n'enregistre rien n'a pas de barre : l'audience d'un
                article est en lecture seule, et un bouton « Enregistrer » inerte y
                donnerait l'impression d'un écran cassé. */}
            {step.savers.length > 0 ? (
              <StepSaveBar
                savers={step.savers}
                next={next ? { id: next.id, label: next.label } : null}
                onGoNext={onValueChange}
              />
            ) : null}
          </Tabs.Panel>
        ))}
      </div>
    </Tabs.Root>
  )
}

function RailItem({ step, position }: { step: EditorStep; position: number }) {
  const dirty = step.savers.some((saver) => saver.dirty)

  return (
    <Tabs.Tab
      value={step.id}
      className={cn(
        "group flex min-h-11 shrink-0 items-center gap-2.5 rounded-sm px-2.5 text-left text-[0.875rem] transition-colors duration-100",
        "text-body hover:bg-surface hover:text-ink",
        // `data-active` et non `data-selected` : c'est l'attribut que pose cette
        // version de Base UI. Les barres d'onglets de l'administration visaient
        // `data-selected`, qui n'existe pas - elles n'avaient donc **aucune**
        // marque d'onglet actif, et on ne repérait sa position qu'à l'anneau de
        // focus. Un sélecteur Tailwind qui ne correspond à rien ne produit ni
        // erreur ni avertissement : c'est le genre de défaut qui ne se voit qu'en
        // relevant les attributs dans le DOM.
        "data-active:bg-surface data-active:font-medium data-active:text-ink data-active:shadow-1",
        "lg:w-full"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-5.5 shrink-0 place-items-center rounded-full border text-[0.66rem] font-semibold tabular-nums",
          step.state === "ready"
            ? "border-success-text/40 bg-success-subtle text-success-text"
            : step.state === "todo"
              ? "border-brand bg-brand/10 text-brand-text"
              : "border-line-strong text-label"
        )}
      >
        {step.state === "ready" ? (
          <Check className="size-3" strokeWidth={3} />
        ) : (
          position + 1
        )}
      </span>

      <span className="flex-1 truncate">
        {step.label}
        {step.count !== undefined ? (
          <span className="ml-1.5 font-normal text-label tabular-nums">
            {step.count}
          </span>
        ) : null}
      </span>

      {/*
        Le point dit « il y a ici quelque chose à enregistrer », et il rassure
        autant qu'il avertit : on peut changer d'étape sans rien perdre.

        Il apparaît sur **toutes** les étapes qui savent enregistrer la donnée
        modifiée, et c'est exact plutôt que bavard : la fiche d'une réalisation
        s'écrit d'un bloc, donc retoucher son titre depuis Identité se laisse
        aussi bien enregistrer depuis Annexes. Le point désigne les boutons qui
        feraient l'affaire.
      */}
      {dirty ? (
        <span
          className="size-1.5 shrink-0 rounded-full bg-brand"
          title="Cette étape a des modifications à enregistrer"
        >
          <span className="sr-only">
            Cette étape a des modifications à enregistrer
          </span>
        </span>
      ) : null}
    </Tabs.Tab>
  )
}

/**
 * La barre d'enregistrement d'une étape.
 *
 * Elle enregistre **tout ce que l'étape a touché**, ce qui peut viser plusieurs
 * procédures : les preuves d'une réalisation modifient à la fois la fiche et la
 * collection de résultats. Un bouton par procédure était plus fidèle à la
 * plomberie et incompréhensible à l'usage.
 */
function StepSaveBar({
  savers,
  next,
  onGoNext,
}: {
  savers: readonly Saveable[]
  next: { id: string; label: string } | null
  onGoNext: (id: string) => void
}) {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)
  const dirty = savers.some((saver) => saver.dirty)

  // « Enregistré » ne doit pas survivre à la frappe suivante : il porterait sur
  // une saisie qui ne l'est plus.
  const shown = saved && !dirty

  const run = () =>
    startTransition(async () => {
      setError(null)
      const outcome = await commitAll(savers)
      if (outcome.status === "error") {
        setError(outcome.formError ?? "L'enregistrement a échoué.")
        setSaved(false)
        return
      }
      setSaved(true)
    })

  const runThenNext = () =>
    startTransition(async () => {
      setError(null)
      if (dirty) {
        const outcome = await commitAll(savers)
        if (outcome.status === "error") {
          setError(outcome.formError ?? "L'enregistrement a échoué.")
          setSaved(false)
          return
        }
        setSaved(true)
      }
      if (next) {
        onGoNext(next.id)
      }
    })

  return (
    <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-page/95 px-1 py-3 backdrop-blur">
      <Button
        type="button"
        size="md"
        onClick={run}
        disabled={pending || !dirty}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>

      {next ? (
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={runThenNext}
          disabled={pending}
          // Enregistrer puis avancer, en un geste : c'est le chemin d'une
          // première rédaction, et le faire en deux boutons revenait à demander
          // deux fois la même chose.
          title={
            dirty
              ? `Enregistrer, puis passer à « ${next.label} »`
              : `Passer à « ${next.label} »`
          }
        >
          {dirty ? "Enregistrer et continuer" : "Continuer"}
          <ArrowRight className="size-4" strokeWidth={1.75} />
        </Button>
      ) : null}

      <span aria-live="polite" className="text-[0.845rem]">
        {error ? (
          <span role="alert" className="text-danger-text">
            {error}
          </span>
        ) : shown ? (
          <span className="flex items-center gap-1.5 text-success-text">
            <Check className="size-3.5" strokeWidth={2} />
            Enregistré.
          </span>
        ) : dirty ? (
          <span className="text-label">Modifications non enregistrées.</span>
        ) : null}
      </span>
    </div>
  )
}
