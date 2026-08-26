import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  getListedPhone,
  getVCard,
  VCARDS,
  vcardFilename,
  phoneIntl,
  vcardSlugs,
  vcardText,
  type VCard,
} from "@/lib/vcards"

const root = path.resolve(import.meta.dirname, "../..")

/**
 * Les cartes de visite.
 *
 * Ce qui est vérifié ici ne se voit pas à l'écran : une carte s'affiche parfaitement avec
 * un fichier `.vcf` que les Contacts refusent, et le défaut n'apparaît qu'au moment où
 * quelqu'un vient de vous serrer la main.
 */
describe("données des cartes", () => {
  it("a un slug cohérent avec sa clé, seule forme qui garde l'URL juste", () => {
    for (const [key, card] of Object.entries(VCARDS)) {
      expect(card.slug, key).toBe(key)
    }
  })

  it("écrit le téléphone en E.164 : la seule forme qu'un lien `tel:` compose", () => {
    for (const card of Object.values(VCARDS)) {
      expect(card.phone, card.slug).toMatch(/^\+[1-9]\d{6,14}$/)
      expect(card.phoneDisplay.replace(/\D/g, ""), card.slug).toHaveLength(
        card.phone.length - 2
      )
    }
  })

  it("porte des portraits qui existent réellement dans public/", () => {
    // Un chemin fautif rend un avatar vide sur la carte et une photo morte dans la
    // fiche contact : deux défauts qu'aucun typecheck ne voit.
    for (const card of Object.values(VCARDS)) {
      if (!card.photo) {
        continue
      }
      for (const source of [card.photo.light, card.photo.dark]) {
        expect(
          fs.existsSync(path.join(root, "public", source)),
          `${card.slug} : ${source}`
        ).toBe(true)
      }
    }
  })

  it("rend une carte par slug, et rien sur un slug inconnu", () => {
    expect(vcardSlugs()).toEqual(["antoine", "gaetan"])
    expect(getVCard("antoine")?.fullName).toBe("Antoine Quendez")
    expect(getVCard("personne-qui-n-existe-pas")).toBeUndefined()
  })
})

describe("numéro affiché hors de la carte", () => {
  it("écrit le numéro à l'international, groupé comme l'usage français", () => {
    expect(phoneIntl(getVCard("antoine") as VCard)).toBe("+33 7 43 75 25 72")
  })

  it("rend un numéro étranger tel quel plutôt que mal groupé", () => {
    const card = { ...(getVCard("antoine") as VCard), phone: "+15551234567" }
    expect(phoneIntl(card)).toBe("+15551234567")
  })

  it("n'affiche que le numéro de qui l'a autorisé", () => {
    // Donner son numéro pour une carte de visite qu'on tend soi-même n'est pas
    // l'avoir donné pour une page publique.
    expect(getListedPhone("Antoine Quendez")?.display).toBe("+33 7 43 75 25 72")
    expect(getListedPhone("Gaëtan Maiuri")).toBeUndefined()
    expect(getListedPhone("Personne Inconnue")).toBeUndefined()
  })

  it("rend le lien d'appel en E.164, jamais la forme lisible", () => {
    expect(getListedPhone("Antoine Quendez")?.tel).toBe("tel:+33743752572")
  })
})

describe("vcardText", () => {
  const card = getVCard("antoine") as VCard
  const text = vcardText(card)
  const lines = text.split("\r\n")

  it("ouvre et ferme la carte comme la spécification l'exige", () => {
    expect(lines[0]).toBe("BEGIN:VCARD")
    expect(lines[1]).toBe("VERSION:3.0")
    // La dernière ligne est vide : le fichier se termine par une fin de ligne.
    expect(lines.at(-2)).toBe("END:VCARD")
  })

  it("termine ses lignes en CRLF, jamais en LF seul", () => {
    // Une tolérance sur laquelle un import échoue sur un appareil et pas sur un autre.
    expect(text.includes("\r\n")).toBe(true)
    expect(text.replace(/\r\n/g, "")).not.toContain("\n")
  })

  it("met le nom de famille en premier dans `N`, le prénom ensuite", () => {
    expect(lines).toContain("N:Quendez;Antoine;;;")
    expect(lines).toContain("FN:Antoine Quendez")
  })

  it("porte le numéro en E.164 et l'adresse telle quelle", () => {
    expect(text).toContain("TEL;TYPE=CELL,VOICE:+33743752572")
    expect(text).toContain(
      "EMAIL;TYPE=WORK,INTERNET:quendez.antoine@heliara.fr"
    )
  })

  it("échappe les virgules : une note coupée en deux perdrait sa moitié", () => {
    const note = lines.find((line) => line.startsWith("NOTE:")) as string
    expect(note).toBeDefined()
    // Aucune virgule nue ne subsiste dans la valeur.
    expect(note.replace(/\\,/g, "")).not.toContain(",")
  })

  it("échappe aussi un rôle qui contiendrait une virgule", () => {
    const text = vcardText({
      ...card,
      role: "Associé, direction technique",
      photo: undefined,
    })
    expect(text).toContain("TITLE:Associé\\, direction technique")
  })

  it("donne la photo en URI absolue, jamais en base64", () => {
    expect(text).toContain(
      "PHOTO;VALUE=URI:https://heliara.fr/team/antoine-white.png"
    )
    expect(text).not.toContain("ENCODING=b")
  })

  it("omet la photo plutôt que d'en poser une vide", () => {
    expect(vcardText({ ...card, photo: undefined })).not.toContain("PHOTO")
  })

  it("omet la prise de rendez-vous quand la personne n'en a pas", () => {
    const sans = vcardText({ ...card, calUrl: undefined })
    expect(sans).not.toContain("TYPE=Rendez-vous")
    expect(vcardText(card)).toContain("URL;TYPE=Rendez-vous:https://cal.com/")
  })

  it("omet l'adresse plutôt que d'en deviner une", () => {
    // Gaëtan n'a pas encore donné la sienne : une adresse devinée d'apres le motif
    // d'une autre est un contact qui rebondit, sur une carte qu'on vient de tendre.
    const sans = vcardText({ ...card, email: undefined })
    expect(sans).not.toContain("EMAIL")
    expect(vcardText(card)).toContain("EMAIL;TYPE=WORK,INTERNET:")
  })

  it("nomme le fichier de façon retrouvable dans un dossier de téléchargements", () => {
    expect(vcardFilename(card)).toBe("antoine-heliara.vcf")
  })
})
