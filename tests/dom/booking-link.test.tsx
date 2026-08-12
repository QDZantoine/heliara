import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { BookingLink } from "@/components/contact/booking-link"
import { booking } from "@/lib/site"

/**
 * Le contrat de ce composant tient en une phrase : **rien de Cal.com ne part avant le
 * clic**, et le lien reste utilisable si rien ne part du tout.
 */

afterEach(() => {
  delete (window as { Cal?: unknown }).Cal
  document.documentElement.classList.remove("dark")
  document.head.querySelectorAll("script").forEach((s) => s.remove())
})

/** Les balises `<script>` posées vers Cal.com, seule trace observable du chargement. */
function scriptsCal() {
  return [...document.head.querySelectorAll("script")].filter((script) =>
    script.src.includes("cal.com")
  )
}

describe("BookingLink", () => {
  it("est une ancre vers l'adresse publique : sans JavaScript, le rendez-vous se prend quand même", () => {
    render(<BookingLink />)
    const lien = screen.getByRole("link", { name: booking.label })

    expect(lien).toHaveAttribute("href", booking.url)
    expect(lien).toHaveAttribute("target", "_blank")
    expect(lien).toHaveAttribute("rel", "noreferrer")
  })

  it("ne charge rien de Cal.com tant qu'on n'a pas cliqué", () => {
    // C'est ce qui fonde le traitement sur le clic plutôt que sur un bandeau de
    // consentement : aucune adresse IP ne part chez un tiers au rendu de la page.
    render(<BookingLink />)

    expect(scriptsCal()).toHaveLength(0)
    expect(window.Cal).toBeUndefined()
  })

  it("installe le script et ouvre la fenêtre au clic", async () => {
    render(<BookingLink />)
    await userEvent.click(screen.getByRole("link"))

    expect(scriptsCal()).toHaveLength(1)
    expect(scriptsCal()[0].src).toBe("https://app.cal.com/embed/embed.js")
  })

  it("empile les appels dans la file d'attente, dont l'ouverture de la fenêtre", async () => {
    render(<BookingLink />)
    await userEvent.click(screen.getByRole("link"))

    const appels = (window.Cal?.q ?? []) as unknown[][]
    const actions = appels.map((appel) => appel[0])

    expect(actions).toContain("ui")
    expect(actions).toContain("modal")

    const modal = appels.find((appel) => appel[0] === "modal")
    expect((modal?.[1] as { calLink: string }).calLink).toBe(booking.calLink)
  })

  it("sert le thème de la page, lu au moment du clic", async () => {
    // Le thème est une classe sur `<html>` : l'iframe ne peut pas la voir, il faut la
    // lui passer. Un thème figé au rendu se tromperait après un basculement.
    document.documentElement.classList.add("dark")
    render(<BookingLink />)
    await userEvent.click(screen.getByRole("link"))

    const appels = (window.Cal?.q ?? []) as unknown[][]
    const ui = appels.find((appel) => appel[0] === "ui")

    expect((ui?.[1] as { theme: string }).theme).toBe("dark")
  })

  it("laisse un clic à modificateur ou du milieu ouvrir un onglet, sans rien charger", () => {
    /*
      Intercepter un « ouvrir dans un nouvel onglet » pour afficher une fenêtre est
      exactement ce qu'on n'attend pas d'un lien. `fireEvent` et non `userEvent` : c'est
      l'état des touches porté par l'évènement qu'on vérifie, pas un scénario de frappe.
    */
    render(<BookingLink />)
    const lien = screen.getByRole("link")

    for (const modificateur of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { button: 1 },
    ]) {
      fireEvent.click(lien, { button: 0, ...modificateur })
    }

    expect(scriptsCal()).toHaveLength(0)
  })

  it("retombe sur une ouverture d'onglet si la file ne s'installe pas", async () => {
    const open = vi.fn()
    vi.stubGlobal("open", open)
    // `head.appendChild` neutralisé : le chargeur ne peut rien poser, donc rien
    // n'existera sur `window.Cal`.
    const appendChild = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation(
        ((node: Node) => node) as typeof document.head.appendChild
      )
    Object.defineProperty(window, "Cal", {
      configurable: true,
      get: () => undefined,
      set: () => {},
    })

    render(<BookingLink />)
    await userEvent.click(screen.getByRole("link"))

    expect(open).toHaveBeenCalledWith(booking.url, "_blank", "noreferrer")

    appendChild.mockRestore()
    vi.unstubAllGlobals()
    delete (window as { Cal?: unknown }).Cal
  })
})
