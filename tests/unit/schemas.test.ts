import { describe, expect, it } from "vitest"

import { budgetRanges } from "@/lib/content/team"
import { contactDefaults, contactSchema } from "@/lib/schemas/contact"

/** Un message d'erreur par champ, tel qu'il serait affiché. */
function errorsOf(input: unknown) {
  const result = contactSchema.safeParse(input)
  if (result.success) {
    return {}
  }
  const out: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    out[field] ??= issue.message
  }
  return out
}

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

describe("contactSchema", () => {
  it("accepte une saisie complète", () => {
    const result = contactSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("accepte l'absence d'enveloppe : le champ est optionnel", () => {
    const withoutBudget = omit(valid, "budget")
    expect(contactSchema.safeParse(withoutBudget).success).toBe(true)
  })

  it("refuse une enveloppe hors de la liste proposée", () => {
    expect(
      contactSchema.safeParse({ ...valid, budget: "3 francs six sous" }).success
    ).toBe(false)
  })

  it("nettoie les espaces autour des valeurs", () => {
    const result = contactSchema.parse({
      ...valid,
      name: "  Camille Roux  ",
      email: "  camille@atelier-roux.fr ",
    })
    expect(result.name).toBe("Camille Roux")
    expect(result.email).toBe("camille@atelier-roux.fr")
  })

  it("traite une valeur faite d'espaces comme vide, pas comme remplie", () => {
    expect(errorsOf({ ...valid, name: "     " }).name).toBe(
      "Indiquez votre nom."
    )
  })

  it("réclame chaque champ obligatoire avec un message affichable tel quel", () => {
    const errors = errorsOf({
      name: "",
      company: "",
      email: "",
      project: "",
    })
    expect(errors).toEqual({
      name: "Indiquez votre nom.",
      company: "Indiquez votre société.",
      email: "Indiquez votre e-mail.",
      project: "Décrivez votre projet, même en deux lignes.",
    })
  })

  it("distingue un projet vide d'un projet trop court", () => {
    expect(errorsOf({ ...valid, project: "Bonjour" }).project).toBe(
      "Quelques mots de plus nous aideraient à vous répondre."
    )
  })

  it("accepte un projet à la limite exacte de 20 caractères", () => {
    expect(
      contactSchema.safeParse({ ...valid, project: "a".repeat(20) }).success
    ).toBe(true)
    expect(
      contactSchema.safeParse({ ...valid, project: "a".repeat(19) }).success
    ).toBe(false)
  })

  it("refuse un e-mail malformé", () => {
    for (const email of [
      "camille",
      "camille@",
      "@roux.fr",
      "camille roux@x.fr",
    ]) {
      expect(errorsOf({ ...valid, email }).email).toBe(
        "Cet e-mail ne semble pas valide."
      )
    }
  })

  it("borne les champs longs, avec un message par champ", () => {
    expect(errorsOf({ ...valid, name: "a".repeat(121) }).name).toBe(
      "Ce nom est trop long."
    )
    expect(errorsOf({ ...valid, company: "a".repeat(121) }).company).toBe(
      "Ce nom est trop long."
    )
    expect(errorsOf({ ...valid, email: `${"a".repeat(180)}@x.fr` }).email).toBe(
      "Cet e-mail est trop long."
    )
    expect(errorsOf({ ...valid, project: "a".repeat(4001) }).project).toBe(
      "Ce message est trop long : envoyez-nous l'essentiel."
    )
  })

  it("accepte les longueurs à la limite haute", () => {
    expect(
      contactSchema.safeParse({ ...valid, name: "a".repeat(120) }).success
    ).toBe(true)
    expect(
      contactSchema.safeParse({ ...valid, project: "a".repeat(4000) }).success
    ).toBe(true)
  })

  describe("champ leurre", () => {
    it("accepte le leurre vide ou absent", () => {
      expect(contactSchema.safeParse({ ...valid, website: "" }).success).toBe(
        true
      )
      const withoutHoneypot = omit(valid, "website")
      expect(contactSchema.safeParse(withoutHoneypot).success).toBe(true)
    })

    it("laisse passer un leurre rempli plutôt que de le refuser", () => {
      // Le schéma ne doit pas trahir le piège : c'est l'action serveur qui
      // décide, et elle répond « envoyé » sans rien envoyer.
      const result = contactSchema.safeParse({
        ...valid,
        website: "http://spam.example",
      })
      expect(result.success).toBe(true)
      expect(result.success && result.data.website).toBe("http://spam.example")
    })
  })

  it("refuse ce qui n'est pas un objet", () => {
    for (const input of [null, undefined, "", 42, []]) {
      expect(contactSchema.safeParse(input).success).toBe(false)
    }
  })
})

describe("contactDefaults", () => {
  it("propose la première enveloppe de la liste", () => {
    expect(contactDefaults.budget).toBe(budgetRanges[0])
  })

  it("n'est pas valide en l'état : le formulaire s'ouvre vide et exige une saisie", () => {
    expect(contactSchema.safeParse(contactDefaults).success).toBe(false)
  })

  it("déclare exactement les champs du schéma, pour que react-hook-form soit contrôlé", () => {
    expect(Object.keys(contactDefaults).sort()).toEqual(
      ["budget", "company", "email", "name", "project", "website"].sort()
    )
  })
})
