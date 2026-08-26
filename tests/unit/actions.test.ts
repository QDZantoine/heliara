import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { submitContact } from "@/app/(site)/contact/actions"
import { budgetRanges } from "@/lib/content/team"
import { site } from "@/lib/site"

/** Le dernier message remis à Resend, et la réponse qu'il doit renvoyer. */
const send = vi.fn()

vi.mock("resend", () => ({
  Resend: class {
    emails = { send }
  },
}))

/** Retire un champ optionnel, pour vérifier qu'il l'est bien. */
function omit<T extends object, K extends keyof T>(source: T, key: K) {
  const copy = { ...source }
  delete copy[key]
  return copy
}

const valid = {
  name: "Camille Roux",
  company: "Atelier Roux",
  email: "camille@atelier-roux.fr",
  project: "Nous voulons refondre notre espace client, aujourd'hui illisible.",
  budget: budgetRanges[1],
  website: "",
}

beforeEach(() => {
  send.mockReset()
  send.mockResolvedValue({ data: { id: "msg_1" }, error: null })
  process.env.RESEND_API_KEY = "re_test"
  process.env.CONTACT_FROM = "Heliara <site@heliara.fr>"
  delete process.env.CONTACT_TO
  // Les actions journalisent leurs échecs : on ne veut pas polluer la sortie,
  // mais on veut pouvoir vérifier qu'elles le font.
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("submitContact", () => {
  it("envoie un message et confirme", async () => {
    await expect(submitContact(valid)).resolves.toEqual({ status: "sent" })
    expect(send).toHaveBeenCalledOnce()
  })

  it("rejoue le schéma : une saisie invalide n'atteint jamais l'envoi", async () => {
    const result = await submitContact({ ...valid, email: "pas-une-adresse" })
    expect(result.status).toBe("error")
    expect(result.fieldErrors?.email).toBe("Cet e-mail ne semble pas valide.")
    expect(send).not.toHaveBeenCalled()
  })

  it("ne fait pas confiance à son appelant, même sur un objet vide", async () => {
    const result = await submitContact({})
    expect(result.status).toBe("error")
    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual([
      "company",
      "email",
      "name",
      "project",
    ])
    expect(send).not.toHaveBeenCalled()
  })

  it("survit à une entrée qui n'est pas un objet", async () => {
    for (const input of [null, undefined, "texte", 42]) {
      const result = await submitContact(input)
      expect(result.status).toBe("error")
    }
    expect(send).not.toHaveBeenCalled()
  })

  it("ne rapporte qu'un message par champ, celui qui sera affiché", async () => {
    const result = await submitContact({ ...valid, name: "", project: "" })
    expect(result.fieldErrors?.name).toBe("Indiquez votre nom.")
    expect(result.fieldErrors?.project).toBe(
      "Décrivez votre projet, même en deux lignes."
    )
  })

  describe("leurre anti-robot", () => {
    it("répond « envoyé » sans rien envoyer quand le leurre est rempli", async () => {
      const result = await submitContact({
        ...valid,
        website: "http://spam.example",
      })
      // Un robot ne doit pas apprendre qu'il a été détecté : ni erreur, ni
      // message sur le champ.
      expect(result).toEqual({ status: "sent" })
      expect(send).not.toHaveBeenCalled()
    })

    it("laisse passer un humain, dont le leurre est vide", async () => {
      await submitContact({ ...valid, website: "" })
      expect(send).toHaveBeenCalledOnce()
    })
  })

  describe("composition du message", () => {
    it("porte l'adresse du prospect en replyTo : répondre au message suffit", async () => {
      await submitContact(valid)
      expect(send.mock.calls[0][0].replyTo).toBe(valid.email)
    })

    it("titre le message avec la société et le nom", async () => {
      await submitContact(valid)
      expect(send.mock.calls[0][0].subject).toBe(
        `Contact site - ${valid.company} (${valid.name})`
      )
    })

    it("reprend toute la saisie dans le corps", async () => {
      await submitContact(valid)
      const { text } = send.mock.calls[0][0]
      expect(text).toContain(valid.name)
      expect(text).toContain(valid.company)
      expect(text).toContain(valid.email)
      expect(text).toContain(valid.budget)
      expect(text).toContain(valid.project)
    })

    it("signale une enveloppe non renseignée plutôt que de laisser un vide", async () => {
      const withoutBudget = omit(valid, "budget")
      await submitContact(withoutBudget)
      expect(send.mock.calls[0][0].text).toContain("Enveloppe : non précisée")
    })

    it("envoie à CONTACT_TO quand il est défini, sinon à l'adresse publique", async () => {
      await submitContact(valid)
      expect(send.mock.calls[0][0].to).toBe(site.email)

      send.mockClear()
      process.env.CONTACT_TO = "bureau@heliara.fr"
      await submitContact(valid)
      expect(send.mock.calls[0][0].to).toBe("bureau@heliara.fr")
    })

    /*
      Le cas qui a laissé passer un défaut en configuration réelle.

      Une variable facultative se déclare dans un `.env` en laissant sa valeur vide -
      c'est ce que fait `.env.example`. `process.env` rend alors une **chaîne vide**, que
      le `??` d'origine laissait passer : le destinataire devenait `""` et Resend
      refusait l'envoi. Le repli, seule raison d'être de cette ligne, ne s'appliquait
      jamais dans la configuration qu'il était censé couvrir.

      Le test précédent ne pouvait pas le voir : il supprime la variable, donc il teste
      `undefined`, jamais `""`.
    */
    it("retombe sur l'adresse publique quand CONTACT_TO est vide, pas seulement absente", async () => {
      process.env.CONTACT_TO = ""
      await submitContact(valid)
      expect(send.mock.calls[0][0].to).toBe(site.email)
    })

    it("ignore les espaces autour d'une valeur d'environnement", async () => {
      process.env.CONTACT_TO = "   "
      await submitContact(valid)
      expect(send.mock.calls[0][0].to).toBe(site.email)

      send.mockClear()
      process.env.CONTACT_TO = "  bureau@heliara.fr  "
      await submitContact(valid)
      expect(send.mock.calls[0][0].to).toBe("bureau@heliara.fr")
    })
  })

  describe("quand l'envoi ne peut pas aboutir", () => {
    it("ne prétend jamais avoir envoyé sans clé d'API", async () => {
      delete process.env.RESEND_API_KEY
      const result = await submitContact(valid)
      expect(result.status).toBe("error")
      expect(result.formError).toContain(site.email)
      expect(send).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })

    it("ne prétend jamais avoir envoyé sans expéditeur", async () => {
      delete process.env.CONTACT_FROM
      const result = await submitContact(valid)
      expect(result.status).toBe("error")
      expect(result.formError).toContain(site.email)
      expect(send).not.toHaveBeenCalled()
    })

    it("renvoie vers l'e-mail direct quand Resend refuse", async () => {
      send.mockResolvedValue({
        data: null,
        error: { name: "validation_error", message: "domaine non vérifié" },
      })
      const result = await submitContact(valid)
      expect(result.status).toBe("error")
      expect(result.formError).toContain(site.email)
      expect(console.error).toHaveBeenCalled()
    })

    it("ne laisse pas fuiter une exception réseau", async () => {
      send.mockRejectedValue(new Error("ECONNRESET"))
      const result = await submitContact(valid)
      expect(result.status).toBe("error")
      expect(result.formError).toContain(site.email)
    })

    it("ne rapporte jamais le détail technique au visiteur", async () => {
      send.mockRejectedValue(new Error("clé API révoquée : re_live_abc123"))
      const result = await submitContact(valid)
      expect(result.formError).not.toContain("re_live_abc123")
    })
  })
})
