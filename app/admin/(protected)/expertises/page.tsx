import type { Metadata } from "next"
import { Tabs } from "@base-ui/react/tabs"

import { ExpertiseBoard } from "@/components/admin/expertise-board"
import { ExpertiseCreate } from "@/components/admin/expertise-create"
import { FamilyBoard } from "@/components/admin/family-board"
import { requireSession } from "@/lib/auth/session"
import { listFamilies, listServices } from "@/lib/db/expertises"

export const metadata: Metadata = { title: "Expertises" }

export default async function AdminExpertisesPage() {
  await requireSession()

  // Les deux listes partent en parallèle : ni l'une ni l'autre ne dépend de l'autre.
  const [families, services] = await Promise.all([
    listFamilies(),
    listServices(),
  ])

  const published = services.filter((one) => one.status === "published").length

  return (
    <div className="grid max-w-4xl gap-6">
      <header className="grid gap-1">
        <h1 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-ink">
          Expertises
        </h1>
        <p className="text-[0.9rem] text-body">
          {families.length} famille{families.length > 1 ? "s" : ""} ·{" "}
          {services.length} service{services.length > 1 ? "s" : ""}, dont{" "}
          {published} en ligne. Les familles sont les entrées « Expertises » du
          menu.
        </p>
      </header>

      <Tabs.Root defaultValue="services">
        <Tabs.List className="mb-6 flex flex-wrap gap-1 border-b border-line">
          {[
            ["services", `Services (${services.length})`],
            ["familles", `Familles (${families.length})`],
          ].map(([value, label]) => (
            <Tabs.Tab
              key={value}
              value={value}
              className="-mb-px min-h-11 border-b-2 border-transparent px-3 text-[0.9rem] font-medium text-body transition-colors duration-100 hover:text-ink data-active:border-brand data-active:text-ink"
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="services" className="grid gap-6">
          {/* Le bouton de création est à droite, comme sur les deux autres listes.
              Il ne peut pas monter dans l'en-tête de la page : celui-ci coiffe les
              deux onglets, et « Nouveau service » n'a rien à faire au-dessus de la
              liste des familles. */}
          <div className="flex justify-end">
            <ExpertiseCreate families={families} />
          </div>
          <ExpertiseBoard families={families} services={services} />
        </Tabs.Panel>
        <Tabs.Panel value="familles">
          <FamilyBoard families={families} services={services} />
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  )
}
