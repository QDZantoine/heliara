import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { methodPhases } from "@/lib/content/method"
import {
  brandNode,
  collectionPageNode,
  howToNode,
  organizationNode,
} from "@/lib/schema"
import { absoluteUrl } from "@/lib/seo"
import {
  serviceAreaLine,
  serviceAreas,
  phoneE164,
  site,
  social,
  whatsapp,
  whatsappE164,
  whatsappUrl,
} from "@/lib/site"

const root = path.resolve(import.meta.dirname, "../..")

/**
 * Les données structurées de l'organisation.
 *
 * Ce qui est vérifié ici ne se voit ni au build, ni au typecheck, ni à l'écran : un
 * graphe se lit dans le code source de la page, et une propriété oubliée n'y laisse
 * aucune trace. Le premier défaut du genre a été un compte `sameAs` absent, qui privait
 * le site du seul lien reliant « Heliara » à une entité plutôt qu'à un mot.
 */
describe("organizationNode", () => {
  const node = organizationNode(["Plateformes métier"])

  it("relie l'entité au compte public du studio", () => {
    expect(node.sameAs).toContain(social.linkedin.href)
  })

  it("annonce le numéro du studio en E.164, jamais sa forme lisible", () => {
    // « +33 1 59 35 35 56 » est fait pour être lu ; schema.org attend l'autre.
    expect(node.telephone).toBe(phoneE164)
    expect(node.telephone).not.toBe(site.phone)
    expect(node.telephone).toMatch(/^\+\d{6,15}$/)
  })

  it("décrit les deux canaux, nommés, sans les confondre", () => {
    const points = node.contactPoint as Record<string, unknown>[]
    expect(points).toHaveLength(2)
    expect(points.map((point) => point.name)).toEqual([
      "Studio",
      whatsapp.label,
    ])

    const [studio, messagerie] = points
    expect(studio.email).toBe(site.email)
    expect(studio.telephone).toBe(phoneE164)
    expect(messagerie.telephone).toBe(whatsappE164)
    expect(messagerie.url).toBe(whatsappUrl)
  })

  it("n'affirme aucune adresse postale : les mentions légales n'en portent pas", () => {
    expect(node.address).toBeUndefined()
  })
})

describe("areaServed", () => {
  const node = organizationNode()

  it("nomme les villes affichées, puis la France pour le travail à distance", () => {
    const areas = node.areaServed as Record<string, string>[]
    expect(areas.map((area) => area.name)).toEqual([...serviceAreas, "France"])
    expect(areas.filter((area) => area["@type"] === "City")).toHaveLength(
      serviceAreas.length
    )
  })

  it("n'affirme aucun établissement dans ces villes", () => {
    // Une `PostalAddress` ou un `LocalBusiness` par ville serait faux, et c'est le
    // premier motif de sanction en référencement local.
    const serialized = JSON.stringify(node)
    expect(serialized).not.toContain("PostalAddress")
    expect(serialized).not.toContain("LocalBusiness")
  })

  it("est affiché avant d'être balisé : le pied de page porte la même liste", () => {
    for (const city of serviceAreas) {
      expect(serviceAreaLine).toContain(city)
    }
  })
})

describe("collectionPageNode", () => {
  it("énumère les éléments listés, dans l'ordre et en URL absolue", () => {
    const node = collectionPageNode({
      path: "/realisations",
      title: "Réalisations",
      description: "Neuf projets livrés.",
      items: [
        { name: "Premier", path: "/realisations/premier" },
        { name: "Second", path: "/realisations/second" },
      ],
    })
    const list = node.mainEntity as Record<string, unknown>
    expect(list["@type"]).toBe("ItemList")
    expect(list.numberOfItems).toBe(2)
    expect(list.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Premier",
        url: absoluteUrl("/realisations/premier"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Second",
        url: absoluteUrl("/realisations/second"),
      },
    ])
  })

  it("omet la liste plutôt que d'en poser une vide", () => {
    const node = collectionPageNode({
      path: "/realisations",
      title: "Réalisations",
      description: "Rien pour l'instant.",
    })
    expect(node.mainEntity).toBeUndefined()
  })
})

describe("howToNode", () => {
  const node = howToNode({
    path: "/methode",
    name: "La méthode",
    description: "Huit temps.",
    steps: methodPhases.map((phase) => ({
      title: phase.title,
      text: phase.text,
      deliverable: phase.deliverable,
      anchor: `temps-${phase.num}`,
    })),
  })

  it("reprend les huit temps de la page, dans l'ordre", () => {
    const steps = node.step as Record<string, unknown>[]
    expect(steps).toHaveLength(methodPhases.length)
    expect(steps.map((step) => step.name)).toEqual(
      methodPhases.map((phase) => phase.title)
    )
    expect(steps.map((step) => step.position)).toEqual(
      methodPhases.map((_, index) => index + 1)
    )
  })

  it("nomme le livrable dans le texte de l'étape, comme la page le fait", () => {
    const steps = node.step as Record<string, string>[]
    expect(steps[0].text).toContain(methodPhases[0].deliverable)
  })

  it("pointe une ancre réellement posée sur la page", () => {
    // Les `<li>` de `/methode` portent `id={`temps-${phase.num}`}` : un `url` d'étape
    // vers une ancre absente vaudrait moins que pas d'`url` du tout.
    const steps = node.step as Record<string, string>[]
    const source = fs.readFileSync(
      path.join(root, "app/(site)/methode/page.tsx"),
      "utf8"
    )
    expect(source).toContain("id={anchor(phase.num)}")
    for (const step of steps) {
      expect(step.url).toMatch(/#temps-\d+$/)
    }
  })
})

describe("brandNode", () => {
  it("déclare une marque sœur sans hiérarchie", () => {
    const node = brandNode({
      name: "Hexceos",
      url: "https://hexceos.fr",
      description: "Cybersécurité.",
    })
    expect(node["@id"]).toBe("https://hexceos.fr/#organization")
    // Le nom du holding ne figure nulle part sur le site public : pas davantage ici.
    expect(node.parentOrganization).toBeUndefined()
    expect(node.subOrganization).toBeUndefined()
  })
})
