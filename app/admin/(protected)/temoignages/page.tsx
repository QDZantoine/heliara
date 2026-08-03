import type { Metadata } from "next"

import { TestimonialBoard } from "@/components/admin/testimonial-board"
import { requireSession } from "@/lib/auth/session"
import { listCases } from "@/lib/db/cases"
import { listTestimonials } from "@/lib/db/testimonials"

export const metadata: Metadata = { title: "Témoignages" }

/**
 * Les témoignages de l'accueil.
 *
 * Les réalisations sont lues ici et non dans l'écran : le sélecteur n'a besoin que d'un
 * identifiant et d'un titre, et un composant client ne peut pas interroger la base.
 * Brouillons compris - une citation peut porter sur un projet dont la fiche n'est pas
 * encore publiée.
 */
export default async function AdminTemoignagesPage() {
  await requireSession()
  const [testimonials, cases] = await Promise.all([
    listTestimonials(),
    listCases(),
  ])

  return (
    <div className="grid max-w-4xl gap-6">
      <header className="grid gap-1">
        <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
          Témoignages
        </h1>
        <p className="text-[0.9rem] text-body">
          Les citations clientes de l&apos;accueil, entre les réalisations et la
          demande de contact.
        </p>
      </header>

      <TestimonialBoard
        testimonials={testimonials}
        cases={cases.map((one) => ({ id: one.id, title: one.title }))}
      />
    </div>
  )
}
