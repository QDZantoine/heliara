"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  createClient,
  deleteClient,
  publishClient,
  reorderClients,
  updateClient,
} from "@/app/admin/(protected)/references/actions"
import {
  Empty,
  Field,
  Folded,
  RemoveButton,
  Select,
  input,
} from "@/components/admin/form-kit"
import {
  MediaDropzone,
  type UploadedMedia,
} from "@/components/admin/media-dropzone"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import type { ClientDetail } from "@/lib/db/clients"
import { cn } from "@/lib/utils"

/**
 * Le bandeau « Ils nous font confiance », administrable.
 *
 * **Un tableau et non l'éditeur à étapes des trois autres collections.** Une référence a
 * quatre champs et pas de page à elle : le rail d'étapes, le panneau de publication et les
 * aperçus de placement seraient une coque autour de rien. On voit ici la bande entière,
 * dans son ordre, ce qui est exactement ce qu'on vient vérifier.
 *
 * **Chaque ligne s'enregistre séparément**, comme les familles d'expertise : on ne modifie
 * pas huit références d'un coup, et un enregistrement global réécrirait des lignes
 * auxquelles on n'a pas touché - donc huit lignes d'audit pour une correction.
 *
 * **« En ligne » veut dire « l'autorisation est obtenue ».** C'est le seul écran du site où
 * publier engage autre chose que la qualité du contenu : un logo est une marque, et
 * l'afficher sous « ils nous font confiance » est une affirmation commerciale. Aucune base
 * ne peut le vérifier, d'où le rappel écrit à côté de l'interrupteur.
 */
function ClientBoard({ clients }: { clients: ClientDetail[] }) {
  const [error, setError] = React.useState<string | null>(null)

  const onReorder = (next: ClientDetail[]) => {
    setError(null)
    React.startTransition(async () => {
      const result = await reorderClients({
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

  const online = clients.filter((one) => one.status === "published").length

  return (
    <div className="grid gap-5">
      <p className="text-[0.845rem] leading-relaxed text-body">
        L&apos;ordre ici est celui de la bande sur l&apos;accueil. Elle défile à
        partir de quatre références en ligne, et ne s&apos;affiche pas du tout
        s&apos;il n&apos;y en a aucune.{" "}
        <strong>
          Une référence ne se met en ligne qu&apos;avec l&apos;accord écrit du
          client
        </strong>{" "}
        : un logo est une marque.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}

      {clients.length > 0 ? (
        <SortableList id="clients" items={clients} onReorder={onReorder}>
          {(client) => (
            <ClientRow key={client.id} client={client} onError={setError} />
          )}
        </SortableList>
      ) : (
        <Empty>
          Aucune référence. Déposez un premier logo ci-dessous : la bande
          n&apos;apparaît sur l&apos;accueil qu&apos;à partir d&apos;une
          référence en ligne.
        </Empty>
      )}

      {/* Le décompte est sous la liste et non dans l'en-tête : ce qui compte n'est pas
          le nombre de références saisies mais le nombre en ligne, et c'est après avoir
          parcouru la liste qu'on se pose la question. */}
      <p className="text-[0.82rem] text-label">
        {online} en ligne sur {clients.length}
        {online >= 4
          ? ". La bande défile."
          : online > 0
            ? ". En dessous de quatre, la bande est une rangée fixe."
            : ". La bande ne s'affiche pas."}
      </p>

      <CreateClient />
    </div>
  )
}

/**
 * Une référence.
 *
 * Le logo est montré **à la hauteur qu'il aura dans la bande**, sur la surface de la
 * bande : c'est la seule façon de voir qu'un fichier est trop chargé, mal détouré ou
 * déséquilibré par rapport à ses voisins. Un aperçu confortable mentirait sur le résultat.
 */
function ClientRow({
  client,
  onError,
}: {
  client: ClientDetail
  onError: (message: string | null) => void
}) {
  const [values, setValues] = React.useState({
    name: client.name,
    shape: client.shape,
    site: client.site,
    logo: [
      {
        id: client.logo.id,
        url: client.logo.url,
        alt: client.logo.alt,
        width: client.logo.width,
        height: client.logo.height,
        originalName: client.logo.originalName,
      },
    ] as UploadedMedia[],
    logoDark: (client.logoDark
      ? [
          {
            id: client.logoDark.id,
            url: client.logoDark.url,
            alt: client.logoDark.alt,
            width: client.logoDark.width,
            height: client.logoDark.height,
            originalName: client.logoDark.originalName,
          },
        ]
      : []) as UploadedMedia[],
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
      const result = await updateClient(client.id, {
        name: values.name,
        shape: values.shape,
        site: values.site,
        logoMediaId: values.logo[0]?.id ?? "",
        logoDarkMediaId: values.logoDark[0]?.id ?? null,
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
      const result = await publishClient(
        client.id,
        client.status !== "published"
      )
      if (result.status === "error") {
        onError(result.formError ?? "Le changement n'a pas pu être enregistré.")
      }
    })

  const remove = () =>
    startTransition(async () => {
      onError(null)
      const result = await deleteClient(client.id)
      if (result.status === "error") {
        onError(result.formError ?? "La suppression a échoué.")
      }
    })

  const online = client.status === "published"
  const logo = values.logo[0]

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        {/*
          L'aperçu, aux dimensions de la bande. `bg-surface` est la surface qu'elle
          utilise, et la hauteur suit `shape` exactement comme en production : un carré
          reçoit plus de hauteur qu'un logotype, sans quoi il paraîtrait quatre fois plus
          petit que ses voisins.
        */}
        <div className="flex h-20 items-center justify-center rounded-sm border border-line bg-surface px-3">
          {logo ? (
            // Un aperçu d'administration, à la taille exacte de la bande : il n'y a
            // rien à optimiser, et `next/image` demanderait de connaître les
            // dimensions du fichier que la procédure ne joint pas.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo.url}
              alt=""
              className={cn(
                "w-auto object-contain",
                values.shape === "square" ? "h-11" : "h-8"
              )}
            />
          ) : (
            <span className="text-[0.72rem] text-label">aucun logo</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <Field label="Nom du client" error={fieldErrors.name}>
            <input
              className={input}
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <Field
            label="Forme"
            hint="Suit le fichier, pas la marque"
            error={fieldErrors.shape}
          >
            <Select
              value={values.shape}
              onChange={(value) => set("shape", value as ClientDetail["shape"])}
              options={[
                ["wide", "Logotype large"],
                ["square", "Carré ou compact"],
              ]}
            />
          </Field>
          <Field
            label="Site du client"
            hint="Non affiché : il garde la provenance du logo traçable."
            optional
            error={fieldErrors.site}
          >
            <input
              className={cn(input, "text-[0.875rem]")}
              placeholder="https://exemple.fr"
              value={values.site}
              onChange={(event) => set("site", event.target.value)}
            />
          </Field>
        </div>
      </div>

      <Folded title="Remplacer le logo">
        <div className="grid gap-4">
          <Field
            label="Logo"
            hint="Fond transparent, au moins 80 px de haut. Un fichier opaque dessine un rectangle sur la bande."
            error={fieldErrors.logoMediaId}
          >
            <MediaDropzone
              label="Logo principal"
              value={values.logo}
              onChange={(media) => set("logo", media)}
            />
          </Field>
          <Field
            label="Variante pour le thème sombre"
            hint="Seulement si la marque est monochrome : un logo noir disparaît sur l'encre. Ne pas fabriquer cette variante en inversant la première, l'inversion produit une couleur que la marque n'a pas."
            optional
            error={fieldErrors.logoDarkMediaId}
          >
            <MediaDropzone
              label="Logo sombre"
              value={values.logoDark}
              onChange={(media) => set("logoDark", media)}
            />
          </Field>
        </div>
      </Folded>

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
            {online ? "Retirer de la bande" : "Mettre en ligne"}
          </Button>
          {/* Suppression en deux temps, comme partout ailleurs dans l'administration. */}
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
              label={`Supprimer ${client.name}`}
              onClick={() => setConfirming(true)}
            />
          )}
        </div>
      </div>

      {!online ? (
        <p className="text-[0.8rem] text-label">
          Hors ligne. À mettre en ligne une fois l&apos;accord du client obtenu
          par écrit.
        </p>
      ) : null}
    </div>
  )
}

/**
 * La création : un nom et un logo, et rien de plus.
 *
 * La forme et le site s'ajustent sur la ligne créée. Les réclamer ici obligerait à tout
 * réunir avant de pouvoir commencer, alors qu'une référence sans son site reste traçable
 * par son nom.
 */
function CreateClient() {
  const [name, setName] = React.useState("")
  const [logo, setLogo] = React.useState<UploadedMedia[]>([])
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [formError, setFormError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  const submit = () =>
    startTransition(async () => {
      setFieldErrors({})
      setFormError(null)
      const result = await createClient({
        name,
        logoMediaId: logo[0]?.id ?? "",
      })
      if (result.status === "error") {
        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError ?? null)
        return
      }
      setName("")
      setLogo([])
    })

  return (
    <div className="grid gap-4 rounded-lg border border-dashed border-line-strong p-5">
      <p className="text-[0.9rem] font-semibold text-ink">
        Ajouter une référence
      </p>

      {formError ? (
        <p role="alert" className="text-[0.845rem] text-danger-text">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <Field label="Nom du client" error={fieldErrors.name}>
          <input
            className={input}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          label="Logo"
          hint="Fond transparent, au moins 80 px de haut."
          error={fieldErrors.logoMediaId}
        >
          <MediaDropzone
            label="Logo principal"
            value={logo}
            onChange={setLogo}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={pending || !name.trim() || logo.length === 0}
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

export { ClientBoard }
