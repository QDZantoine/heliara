import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { cookies, headers } from "next/headers"

import { SESSION_COOKIE } from "@/lib/auth/cookie"
import { write } from "@/lib/db/call"
import { toUnix } from "@/lib/db/id"

/**
 * Sessions : un jeton opaque dans un cookie, son empreinte en base.
 *
 * Le jeton est 32 octets aléatoires. Seul son SHA-256 est stocké : une fuite de
 * la table `session` ne permet donc pas d'usurper une session. SHA-256 suffit ici
 * - contrairement à un mot de passe, le jeton est déjà de forte entropie, il n'y
 * a rien à ralentir contre une attaque par dictionnaire.
 *
 * La validité est jugée **par la procédure** `get_session`, qui filtre sur
 * l'expiration et sur la suspension du compte. Aucun appelant ne peut l'oublier,
 * et c'est délibéré.
 */

/** Trente jours. Prolongés à chaque passage, tant que la session sert. */
const LIFETIME_MS = 30 * 24 * 60 * 60 * 1000
/** En deçà, la session est prolongée : inutile d'écrire à chaque requête. */
const RENEW_BELOW_MS = 7 * 24 * 60 * 60 * 1000

export type SessionUser = {
  id: Buffer
  email: string
  displayName: string
  role: "admin" | "editor"
}

type SessionRow = {
  session_id: Buffer
  expires_at: number
  user_id: Buffer
  email: string
  display_name: string
  role: "admin" | "editor"
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

/** Le contexte de la requête, pour le journal d'audit. Jamais bloquant. */
async function requestContext() {
  const list = await headers()
  // `x-forwarded-for` peut contenir une chaîne de mandataires : la première
  // adresse est celle du client.
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim()
  return {
    ip: forwarded || list.get("x-real-ip") || null,
    userAgent: list.get("user-agent")?.slice(0, 255) ?? null,
  }
}

/**
 * Ouvre une session et pose le cookie.
 *
 * Le cookie est `httpOnly` - aucun script ne peut le lire, ce qui neutralise le
 * vol de session par XSS - `sameSite=lax` - il accompagne une navigation entrante
 * mais pas une requête inter-site - et `secure` hors développement, où l'on
 * travaille en HTTP sur localhost.
 */
export async function createSession(userId: Buffer): Promise<void> {
  const token = randomBytes(32).toString("base64url")
  const expires = new Date(Date.now() + LIFETIME_MS)
  const { ip, userAgent } = await requestContext()

  await write.row("create_session", [
    userId,
    hashToken(token),
    toUnix(expires),
    ip,
    userAgent,
  ])

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  })
}

/**
 * La session courante, ou `null`.
 *
 * C'est **la** fonction d'autorisation de l'administration : elle interroge la
 * base à chaque appel. Le proxy ne fait qu'un contrôle optimiste sur la présence
 * du cookie, et une action serveur est une route publique - donc chacune la
 * rappelle avant d'écrire quoi que ce soit.
 */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) {
    return null
  }

  const row = await write.row<SessionRow>("get_session", [hashToken(token)])
  if (!row) {
    return null
  }

  // Prolongation paresseuse : on n'écrit que lorsque l'échéance approche, pour
  // ne pas faire une écriture par requête.
  const remaining = Number(row.expires_at) * 1000 - Date.now()
  if (remaining < RENEW_BELOW_MS) {
    await write.void("touch_session", [
      hashToken(token),
      toUnix(new Date(Date.now() + LIFETIME_MS)),
    ])
  }

  return {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  }
}

/**
 * La session courante, ou une erreur.
 *
 * À appeler en tête de chaque action serveur d'écriture : c'est ce qui garantit
 * qu'aucune n'écrit sans acteur identifié, même si elle est invoquée directement.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error("UNAUTHENTICATED")
  }
  return session
}

/** Ferme la session courante et retire le cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await write.void("delete_session", [hashToken(token)])
  }
  store.delete(SESSION_COOKIE)
}

/**
 * Comparaison en temps constant de deux chaînes.
 *
 * Sert aux jetons à usage unique comparés hors base. `timingSafeEqual` exige des
 * tampons de même longueur : une différence de taille est traitée à part, ce qui
 * ne fuite rien - la longueur d'un jeton est publique.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export { hashToken, SESSION_COOKIE }
