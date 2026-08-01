"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  createMember,
  deleteMember,
  publishMember,
  reorderMembers,
  setSkills,
  updateMember,
} from "@/app/admin/(protected)/equipe/actions"
import {
  AddButton,
  Empty,
  Field,
  Folded,
  RemoveButton,
  Toggle,
  area,
  input,
} from "@/components/admin/form-kit"
import {
  MediaDropzone,
  type UploadedMedia,
} from "@/components/admin/media-dropzone"
import { SortableList } from "@/components/admin/sortable"
import { Button } from "@/components/ui/button"
import { accentLabel, accentOfIndex, pastilleAccent } from "@/lib/content/team"
import type { MemberDetail, MemberPhoto } from "@/lib/db/team"
import { cn } from "@/lib/utils"

/**
 * L'équipe, administrable.
 *
 * **Un tableau et non l'éditeur à étapes**, pour la même raison que les références
 * clientes : une personne a six champs et pas de page à elle. Ce qu'on vient vérifier
 * ici, c'est la grille entière - trois cartes côte à côte sur `/a-propos` -, et on ne
 * la voit qu'en voyant les trois lignes ensemble.
 *
 * **Deux choses que cet écran doit dire, et que la base ne peut pas dire à sa place :**
 *
 * - **L'ordre décide de la teinte des pastilles.** Il n'existe aucune colonne `accent`,
 *   la DA n'autorisant qu'un geste orange par écran : la première personne prend
 *   l'orange, la deuxième le bleu, les suivantes l'encre. Réordonner change donc les
 *   couleurs, ce qui est invisible tant que personne ne l'écrit.
 * - **« Associé » est une promesse, pas un rang.** `/contact` annonce une réponse d'un
 *   associé sous 48 heures et affiche cette liste.
 */
function TeamBoard({ members }: { members: MemberDetail[] }) {
  const [error, setError] = React.useState<string | null>(null)

  const onReorder = (next: MemberDetail[]) => {
    setError(null)
    React.startTransition(async () => {
      const result = await reorderMembers({
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

  const online = members.filter((one) => one.status === "published").length
  const partners = members.filter(
    (one) => one.isPartner && one.status === "published"
  ).length

  return (
    <div className="grid gap-5">
      <p className="text-[0.845rem] leading-relaxed text-body">
        L&apos;ordre ici est celui des cartes sur <strong>/a-propos</strong>, et
        il décide de la couleur des pastilles d&apos;initiales : la première
        personne prend l&apos;orange, la deuxième le bleu, les suivantes
        l&apos;encre. La direction artistique n&apos;autorisant qu&apos;un geste
        orange par écran, cette répartition n&apos;est pas réglable{" "}
        <strong>- déplacer une ligne change les couleurs</strong>.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-sm border-l-2 border-danger bg-danger-subtle px-4 py-3 text-[0.845rem] text-danger-text"
        >
          {error}
        </p>
      ) : null}

      {members.length > 0 ? (
        <SortableList id="team" items={members} onReorder={onReorder}>
          {(member, index) => (
            <MemberRow
              key={member.id}
              member={member}
              index={index}
              onError={setError}
            />
          )}
        </SortableList>
      ) : (
        <Empty>
          Aucune personne. La section « L&apos;équipe » de /a-propos et les
          interlocuteurs de /contact affichent alors le contenu du dépôt.
        </Empty>
      )}

      <p className="text-[0.82rem] text-label">
        {online} en ligne sur {members.length}
        {partners > 0
          ? `, dont ${partners} ${partners > 1 ? "associés" : "associé"} sur /contact.`
          : ". Aucun associé en ligne : /contact n'affiche aucun interlocuteur alors que la page en promet un."}
      </p>

      <CreateMember />
    </div>
  )
}

/** Ce que la publication exige, écrit avant le clic. Miroir de `publish_team_member`. */
function missing(values: {
  initials: string
  bio: string
  light: UploadedMedia[]
  dark: UploadedMedia[]
}) {
  const gaps: string[] = []
  if (!values.initials.trim()) {
    gaps.push("les initiales")
  }
  if (!values.bio.trim()) {
    gaps.push("le parcours")
  }
  if (values.light.length === 0) {
    gaps.push("le portrait clair")
  }
  if (values.dark.length === 0) {
    gaps.push("le portrait sombre")
  }
  return gaps
}

const asUpload = (photo: MemberPhoto | null): UploadedMedia[] =>
  photo
    ? [
        {
          id: photo.id,
          url: photo.url,
          alt: photo.alt,
          width: photo.width,
          height: photo.height,
          originalName: photo.originalName,
        },
      ]
    : []

/**
 * Une personne.
 *
 * **Les deux portraits sont montrés côte à côte, chacun sur la surface de son thème.**
 * C'est la raison d'être de cet aperçu : aucun fichier ne tient sur les deux fonds - un
 * détourage sur blanc posé sur une carte encre devient un pavé lumineux -, et le défaut
 * ne se voit qu'en basculant le thème, c'est-à-dire jamais avant un visiteur. Les poser
 * l'un à côté de l'autre, chacun sur la surface figée du thème auquel il est destiné,
 * rend la vérification immédiate sans quitter l'écran ni changer de thème.
 *
 * Le cadrage reprend celui de la carte - `aspect-4/3`, `object-cover`, `object-top` -
 * parce qu'un aperçu entier mentirait sur ce qui sera coupé.
 */
function MemberRow({
  member,
  index,
  onError,
}: {
  member: MemberDetail
  index: number
  onError: (message: string | null) => void
}) {
  const [values, setValues] = React.useState({
    name: member.name,
    role: member.role,
    initials: member.initials,
    bio: member.bio,
    isPartner: member.isPartner,
    skills: member.skills.length > 0 ? member.skills : [""],
    light: asUpload(member.photoLight),
    dark: asUpload(member.photoDark),
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

  const setSkill = (position: number, label: string) =>
    set(
      "skills",
      values.skills.map((one, i) => (i === position ? label : one))
    )

  /*
    Deux procédures en séquence, comme l'étape Visuels d'une réalisation : la fiche
    d'un côté, ses spécialités de l'autre. La seconde écriture est conditionnée à un
    changement réel, sans quoi chaque enregistrement déposerait une ligne
    `team_member.set_skills` dans le journal d'audit pour rien.
  */
  const save = () =>
    startTransition(async () => {
      onError(null)
      setFieldErrors({})

      const fiche = await updateMember(member.id, {
        name: values.name,
        role: values.role,
        initials: values.initials,
        bio: values.bio,
        isPartner: values.isPartner,
        photoLightMediaId: values.light[0]?.id ?? null,
        photoDarkMediaId: values.dark[0]?.id ?? null,
      })
      if (fiche.status === "error") {
        setFieldErrors(fiche.fieldErrors ?? {})
        onError(
          fiche.formError ?? Object.values(fiche.fieldErrors ?? {})[0] ?? null
        )
        return
      }

      const retenues = values.skills.filter((one) => one.trim() !== "")
      if (JSON.stringify(retenues) !== JSON.stringify(member.skills)) {
        const puces = await setSkills(member.id, {
          items: retenues.map((label) => ({ label })),
        })
        if (puces.status === "error") {
          setFieldErrors(puces.fieldErrors ?? {})
          onError(
            puces.formError ??
              Object.values(puces.fieldErrors ?? {})[0] ??
              "Les spécialités n'ont pas pu être enregistrées."
          )
          return
        }
      }

      setDirty(false)
      setSaved(true)
    })

  const togglePublish = () =>
    startTransition(async () => {
      onError(null)
      const result = await publishMember(
        member.id,
        member.status !== "published"
      )
      if (result.status === "error") {
        onError(result.formError ?? "Le changement n'a pas pu être enregistré.")
      }
    })

  const remove = () =>
    startTransition(async () => {
      onError(null)
      const result = await deleteMember(member.id)
      if (result.status === "error") {
        onError(result.formError ?? "La suppression a échoué.")
      }
    })

  const online = member.status === "published"
  const accent = accentOfIndex(index)
  const gaps = missing(values)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[13rem_1fr]">
        {/* `content-start` : sans lui, les deux rangées de cette colonne s'étirent à la
            hauteur des champs d'à côté, et les cadres d'aperçu deviennent deux bandes
            verticales avec le portrait tassé en haut. */}
        <div className="grid content-start gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Portrait photo={values.light[0]} tone="light" />
            <Portrait photo={values.dark[0]} tone="dark" />
          </div>
          {/* La pastille telle que /contact la rendra, avec la teinte que sa position
              lui donne : c'est aussi le seul endroit où l'on voit les initiales
              composées, un « AQ » trop long tenant très mal dans le disque. */}
          <p className="flex items-center gap-2 text-[0.78rem] text-label">
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold",
                pastilleAccent[accent]
              )}
            >
              {values.initials.trim() || "?"}
            </span>
            Pastille {accentLabel[accent]}, par sa position
          </p>
        </div>

        <div className="grid content-start gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
            <Field label="Nom" error={fieldErrors.name}>
              <input
                className={input}
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
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

          <Field
            label="Fonction"
            hint="Telle qu'elle s'écrit sur la carte. Deux lignes au plus : la carte réserve cette hauteur, une troisième décalerait toute la rangée."
            error={fieldErrors.role}
          >
            <input
              className={input}
              value={values.role}
              onChange={(event) => set("role", event.target.value)}
            />
          </Field>

          <Field
            label="Parcours"
            hint="Trois ou quatre phrases : ce qui rend la fonction crédible. Diplômes, employeurs passés et rôles sont des affirmations opposables, à valider avec l'intéressé."
            error={fieldErrors.bio}
          >
            <textarea
              className={area}
              rows={5}
              value={values.bio}
              onChange={(event) => set("bio", event.target.value)}
            />
          </Field>

          <Toggle
            checked={values.isPartner}
            onChange={(checked) => set("isPartner", checked)}
            label="Associé, présenté sur /contact"
            hint="La page promet une réponse d'un associé sous 48 heures. À ne lever que pour quelqu'un qui répond effectivement aux messages."
          />
        </div>
      </div>

      <Field
        label="Spécialités"
        hint="En puces sous le parcours. Quatre au plus se lisent ; au-delà, elles cessent d'être des repères."
        optional
        error={fieldErrors["items.0.label"] ?? fieldErrors.items}
      >
        <div className="grid gap-2">
          {values.skills.map((skill, position) => (
            <div
              // La position sert de clé : ces lignes n'ont pas d'identité propre tant
              // qu'elles ne sont pas enregistrées, et une clé tirée du texte
              // remonterait le champ à chaque frappe.
              key={position}
              className="flex items-center gap-1.5"
            >
              <input
                className={input}
                value={skill}
                placeholder="Next.js / TypeScript"
                onChange={(event) => setSkill(position, event.target.value)}
              />
              <RemoveButton
                label={`Retirer la spécialité ${position + 1}`}
                onClick={() =>
                  set(
                    "skills",
                    values.skills.filter((_, i) => i !== position)
                  )
                }
              />
            </div>
          ))}
          {values.skills.length < 8 ? (
            <AddButton
              label="Ajouter une spécialité"
              onClick={() => set("skills", [...values.skills, ""])}
            />
          ) : null}
        </div>
      </Field>

      {/*
        Les portraits sont repliés parce qu'on les dépose une fois : dépliés, ils
        prenaient autant de place que le parcours, qu'on relit à chaque passage. Aucun
        champ de texte alternatif, et c'est le bon partage - la carte rend ces images
        en `alt=""`, le nom de la personne étant écrit juste dessous. Une alternative
        le répéterait à voix haute.
      */}
      <Folded
        title="Remplacer les portraits"
        hint={
          values.light.length > 0 && values.dark.length > 0
            ? undefined
            : "il en manque un"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Portrait, thème clair"
            hint="800 × 800, tête et épaules, fond détouré clair."
            error={fieldErrors.photoLightMediaId}
          >
            <MediaDropzone
              label="Portrait clair"
              value={values.light}
              onChange={(media) => set("light", media)}
            />
          </Field>
          <Field
            label="Portrait, thème sombre"
            hint="Le même cadrage sur fond sombre ou orange. Aucun fichier ne tient sur les deux thèmes : un détourage sur blanc devient un pavé lumineux sur l'encre."
            error={fieldErrors.photoDarkMediaId}
          >
            <MediaDropzone
              label="Portrait sombre"
              value={values.dark}
              onChange={(media) => set("dark", media)}
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
              label={`Supprimer ${member.name}`}
              onClick={() => setConfirming(true)}
            />
          )}
        </div>
      </div>

      {/*
        Ce qu'il manque, calculé sur la saisie en cours : le panneau de publication des
        trois éditeurs fait de même, à la différence près qu'il lit les données
        enregistrées. Ici la ligne entière s'enregistre d'un bouton, donc l'écart entre
        les deux ne dure que le temps d'une frappe.
      */}
      {!online && gaps.length > 0 ? (
        <p className="text-[0.8rem] text-label">
          Pour mettre en ligne, il manque {gaps.join(", ")}.
        </p>
      ) : null}
    </div>
  )
}

/** Un portrait, sur la surface du thème auquel il est destiné. */
function Portrait({
  photo,
  tone,
}: {
  photo: UploadedMedia | undefined
  tone: "light" | "dark"
}) {
  return (
    <div className="grid gap-1">
      <div
        className={cn(
          "rounded-sm border border-line p-1.5",
          /*
            Les deux valeurs de `--hel-page`, **figées** plutôt que prises au jeton.
            `bg-page` suivrait le thème de l'administration : en sombre, l'aperçu du
            portrait clair se retrouverait sur l'encre, c'est-à-dire montrerait
            exactement le contraire de ce qu'on vient vérifier. Ces deux surfaces
            appartiennent au site, pas à l'écran qui les affiche.
          */
          tone === "light" ? "bg-[#fafaf9]" : "bg-[#101012]"
        )}
      >
        <div className="aspect-4/3 overflow-hidden rounded-xs">
          {photo ? (
            // Un aperçu d'administration : `next/image` n'apporterait rien sur une
            // vignette de 100 px, et les dimensions du fichier ne sont pas stockées.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.url}
              alt=""
              className="size-full object-cover object-top"
            />
          ) : null}
        </div>
      </div>
      {/* Le libellé est hors du cadre, sur la surface de l'administration : à
          l'intérieur, il aurait fallu deux couleurs de texte figées elles aussi, dont
          l'une devenait illisible dès que l'administration changeait de thème. */}
      <span className="text-center text-[0.68rem] text-label">
        {tone === "light" ? "clair" : "sombre"}
      </span>
    </div>
  )
}

/**
 * La création : un nom et une fonction.
 *
 * Le reste - portraits, parcours, spécialités - se remplit sur la ligne créée. Tout
 * réclamer ici obligerait à réunir les deux photos avant de pouvoir commencer, alors
 * qu'une fiche incomplète reste un brouillon que rien n'affiche.
 */
function CreateMember() {
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [formError, setFormError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  const submit = () =>
    startTransition(async () => {
      setFieldErrors({})
      setFormError(null)
      const result = await createMember({ name, role })
      if (result.status === "error") {
        setFieldErrors(result.fieldErrors ?? {})
        setFormError(result.formError ?? null)
        return
      }
      setName("")
      setRole("")
    })

  return (
    <div className="grid gap-4 rounded-lg border border-dashed border-line-strong p-5">
      <p className="text-[0.9rem] font-semibold text-ink">
        Ajouter une personne
      </p>

      {formError ? (
        <p role="alert" className="text-[0.845rem] text-danger-text">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" error={fieldErrors.name}>
          <input
            className={input}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Fonction" error={fieldErrors.role}>
          <input
            className={input}
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={pending || !name.trim() || !role.trim()}
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

export { TeamBoard }
