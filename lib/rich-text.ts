import { z } from "zod"

/**
 * Le texte riche : ce qui est permis, et pourquoi c'est **validé** et non nettoyé.
 *
 * Les corps de chapitre et les paragraphes d'article sont saisis dans Tiptap, donc
 * stockés en HTML. Les afficher suppose `dangerouslySetInnerHTML`, ce qui n'est
 * acceptable qu'à une condition : **rien d'autre que ce fragment de HTML ne peut
 * entrer en base.**
 *
 * **Valider plutôt que nettoyer, et ce choix est délibéré.** Un nettoyeur transforme
 * ce qu'il ne comprend pas et laisse passer ce qu'il a mal compris ; les
 * contournements de nettoyeurs écrits à la main remplissent des pages de rapports de
 * vulnérabilité. Une validation, elle, échoue en cas de doute : toute balise hors de
 * la liste fait rejeter l'enregistrement, avec un message. Le pire cas est un refus,
 * pas une injection.
 *
 * L'administration est par ailleurs derrière une session et un VPN, mais cela ne
 * dispense de rien : une action serveur reste une route publique, et le jour où un
 * compte est compromis, la surface qui compte est celle-ci.
 *
 * La liste reprend exactement ce que l'éditeur sait produire - voir
 * `components/admin/rich-text.tsx`. L'étendre ici sans l'étendre là serait ouvrir une
 * porte que personne n'emprunte ; l'inverse ferait rejeter du contenu légitime.
 */

/** Les balises que l'éditeur produit, et elles seules. */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "code",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
])

/** Les attributs tolérés, par balise. Tout le reste est refusé. */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
}

/** Les protocoles de lien acceptés. `javascript:` et `data:` en sont exclus. */
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i

type Refusal = { ok: false; reason: string }
type Acceptance = { ok: true }

/**
 * Le fragment ne contient-il que ce que l'éditeur sait produire ?
 *
 * L'analyse est volontairement littérale : chaque balise est examinée, et la moindre
 * inconnue fait échouer. Il n'y a pas de tentative de réparation, ce qui est tout
 * l'intérêt.
 */
export function checkRichText(html: string): Acceptance | Refusal {
  // Un commentaire peut masquer du contenu aux analyses naïves : refusé d'emblée.
  if (html.includes("<!--")) {
    return { ok: false, reason: "Les commentaires HTML ne sont pas acceptés." }
  }

  const tagPattern =
    /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/g
  let match: RegExpExecArray | null

  while ((match = tagPattern.exec(html)) !== null) {
    const [whole, rawName, rawAttributes] = match
    const name = rawName.toLowerCase()

    if (!ALLOWED_TAGS.has(name)) {
      return { ok: false, reason: `La balise « ${name} » n'est pas acceptée.` }
    }

    const allowed = ALLOWED_ATTRIBUTES[name] ?? new Set<string>()
    const attributePattern = /([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/g
    let attribute: RegExpExecArray | null

    while ((attribute = attributePattern.exec(rawAttributes)) !== null) {
      const key = attribute[1].toLowerCase()
      const value = attribute[2].replace(/^["']|["']$/g, "")

      if (!allowed.has(key)) {
        return {
          ok: false,
          reason: `L'attribut « ${key} » n'est pas accepté sur « ${name} ».`,
        }
      }
      if (key === "href" && !SAFE_HREF.test(value.trim())) {
        return { ok: false, reason: "Ce lien n'a pas un protocole accepté." }
      }
    }

    void whole
  }

  /*
    Un chevron ouvrant qui n'a pas été reconnu comme balise est refusé.

    C'est ce qui bloque les formes tordues - `<img src=x onerror=…` sans chevron
    fermant, `<svg/onload=…`, un `<` isolé suivi de n'importe quoi. Le texte légitime
    n'en contient pas : Tiptap échappe les chevrons du contenu en `&lt;`.
  */
  const withoutTags = html.replace(tagPattern, "")
  if (withoutTags.includes("<")) {
    return {
      ok: false,
      reason: "Un caractère « < » n'a pas été reconnu comme balise.",
    }
  }

  return { ok: true }
}

/**
 * Un champ de texte riche.
 *
 * `min(1)` porte sur le texte **débarrassé de ses balises** : un `<p></p>` vide est un
 * champ vide, et l'éditeur en produit un dès qu'on y a mis le curseur.
 */
export const richTextSchema = z
  .string()
  .trim()
  .max(20000, "Ce texte est trop long.")
  .superRefine((value, context) => {
    const verdict = checkRichText(value)
    if (!verdict.ok) {
      context.addIssue({ code: "custom", message: verdict.reason })
    }
  })

/** Le texte nu d'un fragment, pour mesurer s'il dit quelque chose. */
export function richTextIsEmpty(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim() === ""
  )
}

/** Variante non vide : l'éditeur produit `<p></p>` pour un champ où l'on a cliqué. */
export const requiredRichTextSchema = richTextSchema.refine(
  (value) => !richTextIsEmpty(value),
  "Ce champ est vide."
)
