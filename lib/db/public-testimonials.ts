import {
  testimonials as staticTestimonials,
  type Testimonial,
} from "@/lib/content/testimonials"
import { read } from "@/lib/db/call"

/**
 * Les témoignages lus en base, **avec repli sur `lib/content/testimonials.ts`**.
 *
 * Le repli est ici particulier, et il faut le dire : le fichier statique est
 * **volontairement vide**, ses trois verbatims inventés ayant été retirés. Une base
 * injoignable rend donc une liste vide, et la section disparaît de l'accueil. C'est le
 * bon comportement - l'inverse, un repli qui ressusciterait des citations, serait
 * précisément le défaut qu'on a corrigé.
 *
 * Conséquence à connaître : contrairement aux réalisations, une base muette **fait
 * disparaître** cette section au lieu de servir une version périmée. La section étant
 * conditionnée à son contenu, l'accueil reste cohérent, simplement plus court.
 */

type TestimonialRow = {
  quote: string
  author_name: string
  author_role: string
  initials: string
}

const text = (value: unknown) => (typeof value === "string" ? value : "")

export async function listPublicTestimonials(): Promise<
  readonly Testimonial[]
> {
  try {
    const rows = await read.rows<TestimonialRow>("pub_list_testimonials")

    if (rows.length === 0) {
      return staticTestimonials
    }

    return rows.map((row) => ({
      quote: row.quote,
      name: row.author_name,
      role: row.author_role,
      initials: text(row.initials),
    }))
  } catch (error) {
    /*
      Bruyant dans les journaux, silencieux pour le visiteur : une base injoignable est
      un incident, et la section absente n'est pas un contenu faux.
    */
    console.warn(
      "Témoignages : base injoignable, la section n'est pas affichée.",
      error
    )
    return staticTestimonials
  }
}
