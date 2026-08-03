import { NextResponse, type NextRequest } from "next/server"

import { countArticleView } from "@/lib/db/public-articles"
import { slugSchema } from "@/lib/schemas/case"

/**
 * Comptage d'une vue d'article.
 *
 * **Pourquoi une route et non le rendu de la page.** Les fiches sont prérendues et
 * revalidées au bout d'une minute : leur code ne s'exécute pas à chaque visite, donc
 * un compteur incrémenté au rendu ne compterait qu'une visite sur beaucoup. Le
 * déclenchement vient donc du navigateur, une fois par article et par session.
 *
 * `POST` et non `GET` : c'est une écriture, même minuscule, et un `GET` serait
 * appelé par tout préchargeur de lien qui passe.
 *
 * Ce que la route peut faire, au pire : gonfler un compteur. Elle ne lit rien, ne
 * rend rien d'autre qu'un 204, et la procédure qu'elle appelle est la seule écriture
 * accordée au compte de lecture - voir `db/init/09-proc-public.sql`.
 */
export async function POST(request: NextRequest) {
  let slug: unknown
  try {
    slug = (await request.json())?.slug
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const parsed = slugSchema.safeParse(slug)
  if (!parsed.success) {
    return new NextResponse(null, { status: 400 })
  }

  await countArticleView(parsed.data)

  // 204 et rien d'autre : la réponse ne dit pas si le slug existe, ce qui évite
  // d'en faire un moyen de deviner les brouillons.
  return new NextResponse(null, { status: 204 })
}
