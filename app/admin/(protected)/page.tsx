import Link from "next/link"
import { ArrowRight, FileEdit, FolderOpen, ShieldCheck } from "lucide-react"

import { requireSession } from "@/lib/auth/session"
import { write } from "@/lib/db/call"
import { fromUnix } from "@/lib/db/id"

type CaseRow = {
  id: Buffer
  slug: string
  title: string
  status: "draft" | "published"
  updated_at: number
  updated_by_name: string | null
}

type AuditRow = {
  id: Buffer
  action: string
  actor_name: string | null
  created_at: number
}

/** Libellés d'action du journal, en clair. */
const actionLabels: Record<string, string> = {
  "case.create": "Réalisation créée",
  "case.update": "Réalisation modifiée",
  "case.publish": "Réalisation publiée",
  "case.unpublish": "Réalisation dépubliée",
  "case.delete": "Réalisation supprimée",
  "case.reorder": "Grille réordonnée",
  "case.set_chapters": "Chapitres enregistrés",
  "case.set_results": "Résultats enregistrés",
  "case.set_meta": "Fiche technique enregistrée",
  "case.set_lessons": "Enseignements enregistrés",
  "session.create": "Connexion",
  "session.revoke_all": "Sessions révoquées",
  "user.create": "Compte créé",
  "user.password_change": "Mot de passe changé",
  "user.suspend": "Compte suspendu",
  "user.restore": "Compte réactivé",
}

function formatDate(seconds: number) {
  return fromUnix(seconds).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function AdminDashboard() {
  // La session est déjà vérifiée par le layout : on la relit pour le nom affiché,
  // et parce qu'une page ne doit pas supposer le contexte de son parent.
  const session = await requireSession()

  const [cases, audit] = await Promise.all([
    write.rows<CaseRow>("list_case_studies", [null]),
    write.rows<AuditRow>("list_audit", [null, null, 8, 0]),
  ])

  const published = cases.filter((item) => item.status === "published")
  const drafts = cases.filter((item) => item.status === "draft")

  return (
    <div className="grid max-w-4xl gap-8">
      <header className="grid gap-1.5">
        <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
          Bonjour {session.displayName.split(" ")[0]}
        </h1>
        <p className="text-[0.94rem] text-body">
          Voici l&apos;état des contenus du site.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={FolderOpen}
          value={published.length}
          label={
            published.length > 1
              ? "réalisations en ligne"
              : "réalisation en ligne"
          }
        />
        <Stat
          icon={FileEdit}
          value={drafts.length}
          label={drafts.length > 1 ? "brouillons" : "brouillon"}
        />
        <Stat
          icon={ShieldCheck}
          value={audit.length}
          label="actions récentes"
        />
      </div>

      <section className="grid gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[1.125rem] font-bold tracking-[-0.015em] text-ink">
            Réalisations
          </h2>
          <Link
            href="/admin/realisations"
            className="inline-flex min-h-11 items-center gap-1.5 text-[0.845rem] font-medium text-info-text hover:underline"
          >
            Tout gérer
            <ArrowRight className="size-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        {cases.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-5 py-8 text-center text-[0.9rem] text-label">
            Aucune réalisation pour l&apos;instant.{" "}
            <Link
              href="/admin/realisations"
              className="font-medium text-info-text hover:underline"
            >
              En créer une
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {cases.slice(0, 6).map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/admin/realisations/${item.slug}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors duration-100 hover:bg-inset"
                >
                  <StatusDot status={item.status} />
                  <span className="min-w-0 flex-1 truncate text-[0.94rem] font-medium text-ink">
                    {item.title}
                  </span>
                  <span className="hidden shrink-0 text-xs text-label sm:block">
                    {formatDate(item.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-[1.125rem] font-bold tracking-[-0.015em] text-ink">
          Journal
        </h2>
        {audit.length === 0 ? (
          <p className="text-[0.9rem] text-label">Rien encore.</p>
        ) : (
          <ul className="grid gap-0.5">
            {audit.map((entry) => (
              <li
                key={entry.id.toString("hex")}
                className="flex items-baseline gap-3 py-1.5 text-[0.875rem]"
              >
                <span className="w-28 shrink-0 font-mono text-xs text-label">
                  {formatDate(entry.created_at)}
                </span>
                <span className="text-body">
                  {actionLabels[entry.action] ?? entry.action}
                </span>
                {entry.actor_name ? (
                  <span className="text-xs text-label">{entry.actor_name}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  value: number
  label: string
}) {
  return (
    <div className="grid gap-1 rounded-lg border border-line bg-surface p-5">
      <Icon className="mb-1 size-4 text-label" strokeWidth={1.5} />
      <span className="font-display text-[1.75rem] leading-none font-extrabold text-ink">
        {value}
      </span>
      <span className="text-[0.82rem] text-label">{label}</span>
    </div>
  )
}

function StatusDot({ status }: { status: "draft" | "published" }) {
  return (
    <span
      aria-label={status === "published" ? "En ligne" : "Brouillon"}
      title={status === "published" ? "En ligne" : "Brouillon"}
      className={
        status === "published"
          ? "size-2 shrink-0 rounded-full bg-success"
          : "size-2 shrink-0 rounded-full bg-line-strong"
      }
    />
  )
}
