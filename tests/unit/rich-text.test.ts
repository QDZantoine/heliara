import { describe, expect, it } from "vitest"

import {
  checkRichText,
  requiredRichTextSchema,
  richTextIsEmpty,
  richTextSchema,
} from "@/lib/rich-text"

/**
 * Le texte riche est **validé** et non nettoyé, et c'est ce que ces tests protègent :
 * en cas de doute, la validation refuse.
 *
 * Le fragment stocké est ensuite affiché par `dangerouslySetInnerHTML` : chacun de
 * ces refus est donc une injection qui n'aura pas lieu.
 */

const accepts = (html: string) => checkRichText(html).ok
const refuses = (html: string) => !checkRichText(html).ok

describe("ce que l'éditeur produit est accepté", () => {
  it("un paragraphe", () => {
    expect(accepts("<p>Un texte.</p>")).toBe(true)
  })

  it("les marques de l'éditeur", () => {
    expect(
      accepts(
        "<p><strong>gras</strong> <em>italique</em> <s>barré</s> <code>code</code></p>"
      )
    ).toBe(true)
  })

  it("les listes et la citation", () => {
    expect(accepts("<ul><li>un</li><li>deux</li></ul>")).toBe(true)
    expect(accepts("<ol><li>un</li></ol>")).toBe(true)
    expect(accepts("<blockquote><p>cité</p></blockquote>")).toBe(true)
  })

  it("un lien tel que l'éditeur l'écrit", () => {
    expect(
      accepts(
        '<p><a href="https://heliara.fr" target="_blank" rel="noopener">là</a></p>'
      )
    ).toBe(true)
  })

  it("un lien interne, un courriel, un téléphone, une ancre", () => {
    for (const href of ["/contact", "mailto:a@b.fr", "tel:+33100000000", "#ici"]) {
      expect(accepts(`<p><a href="${href}">x</a></p>`), href).toBe(true)
    }
  })

  it("un saut de ligne", () => {
    expect(accepts("<p>une ligne<br>et une autre</p>")).toBe(true)
  })

  it("du texte sans balise", () => {
    expect(accepts("Juste du texte.")).toBe(true)
  })

  it("des chevrons échappés, tels que l'éditeur les écrit", () => {
    expect(accepts("<p>a &lt; b et b &gt; a</p>")).toBe(true)
  })
})

describe("ce qui n'en vient pas est refusé", () => {
  it("un script", () => {
    expect(refuses("<script>alert(1)</script>")).toBe(true)
    expect(refuses("<p>ok</p><script src=x></script>")).toBe(true)
  })

  it("une image porteuse d'un gestionnaire d'évènement", () => {
    expect(refuses('<img src=x onerror="alert(1)">')).toBe(true)
  })

  it("un attribut d'évènement sur une balise pourtant permise", () => {
    expect(refuses('<p onclick="alert(1)">x</p>')).toBe(true)
    expect(refuses('<a href="/x" onmouseover="alert(1)">x</a>')).toBe(true)
  })

  it("un lien javascript, sous toutes ses graphies", () => {
    expect(refuses('<p><a href="javascript:alert(1)">x</a></p>')).toBe(true)
    expect(refuses('<p><a href="JaVaScRiPt:alert(1)">x</a></p>')).toBe(true)
    expect(refuses('<p><a href=" javascript:alert(1)">x</a></p>')).toBe(true)
  })

  it("un lien data", () => {
    expect(
      refuses('<p><a href="data:text/html,<script>alert(1)</script>">x</a></p>')
    ).toBe(true)
  })

  it("une iframe, un objet, une balise de style", () => {
    for (const html of [
      '<iframe src="//x"></iframe>',
      "<object data=x></object>",
      "<style>body{display:none}</style>",
      "<svg onload=alert(1)></svg>",
    ]) {
      expect(refuses(html), html).toBe(true)
    }
  })

  it("un commentaire HTML, qui peut masquer du contenu", () => {
    expect(refuses("<p>x</p><!-- <script>alert(1)</script> -->")).toBe(true)
  })

  it("un chevron non reconnu comme balise", () => {
    // C'est ce qui bloque les formes tordues sans chevron fermant.
    expect(refuses("<p>x</p><svg/onload=alert(1)")).toBe(true)
    expect(refuses("<p>x</p>< script>")).toBe(true)
  })

  it("un attribut de style, qui n'a rien à faire dans du contenu", () => {
    expect(refuses('<p style="position:fixed">x</p>')).toBe(true)
  })

  it("nomme la raison du refus, pour que le message soit affichable", () => {
    const verdict = checkRichText("<script>x</script>")
    expect(verdict.ok).toBe(false)
    expect(verdict.ok === false && verdict.reason).toContain("script")
  })
})

describe("richTextIsEmpty", () => {
  it("reconnaît le paragraphe vide que l'éditeur laisse", () => {
    expect(richTextIsEmpty("<p></p>")).toBe(true)
    expect(richTextIsEmpty("<p>&nbsp;</p>")).toBe(true)
    expect(richTextIsEmpty("   ")).toBe(true)
  })

  it("ne confond pas du contenu avec du vide", () => {
    expect(richTextIsEmpty("<p>a</p>")).toBe(false)
    expect(richTextIsEmpty("<ul><li>a</li></ul>")).toBe(false)
  })
})

describe("les schémas", () => {
  it("acceptent un fragment valide", () => {
    expect(richTextSchema.safeParse("<p>Bonjour.</p>").success).toBe(true)
  })

  it("refusent un fragment hostile, avec un message affichable", () => {
    const result = richTextSchema.safeParse('<p onclick="x">a</p>')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain("onclick")
  })

  it("le variant requis refuse le paragraphe vide de l'éditeur", () => {
    expect(requiredRichTextSchema.safeParse("<p></p>").success).toBe(false)
    expect(requiredRichTextSchema.safeParse("<p>a</p>").success).toBe(true)
  })

  it("bornent la longueur", () => {
    const long = `<p>${"a".repeat(20001)}</p>`
    expect(richTextSchema.safeParse(long).success).toBe(false)
  })
})
