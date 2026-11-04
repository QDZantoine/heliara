import { indexNowKey } from "@/lib/indexnow"

/**
 * Preuve de possession de la clé IndexNow : le fichier contient la clé, et rien
 * d'autre. Sans clé configurée, l'adresse n'existe pas.
 *
 * `proxy.ts` y réécrit `/<clé>.txt`, l'emplacement que Bing exige : la clé vivant dans
 * l'environnement et non dans le dépôt, elle ne peut pas être posée dans `public/`.
 */
export const dynamic = "force-dynamic"

export function GET() {
  const key = indexNowKey()
  if (!key) return new Response(null, { status: 404 })
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
