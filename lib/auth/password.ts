import "server-only"

import { hash, verify } from "@node-rs/argon2"

/**
 * Mots de passe : argon2id, côté application.
 *
 * La base ne voit jamais un mot de passe en clair et ne compare rien : elle rend
 * l'empreinte stockée, et la vérification a lieu ici. Deux raisons - argon2
 * n'existe pas côté MariaDB, et la comparaison doit se faire en temps constant,
 * ce que la bibliothèque garantit.
 *
 * Les paramètres suivent les recommandations OWASP pour argon2id : 19 Mio de
 * mémoire, deux passes, un fil d'exécution. C'est le compromis conseillé quand la
 * mémoire est la ressource contrainte, et il tient largement sur un serveur
 * applicatif.
 */
const OPTIONS = {
  // `Algorithm.Argon2id` est un `const enum` ambiant : `isolatedModules` interdit
  // d'y accéder, la valeur littérale est donc écrite directement. 2 = argon2id.
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

/**
 * Une empreinte de la même famille que les vraies, utilisée quand l'adresse est
 * inconnue. Sans elle, une connexion sur une adresse inexistante répondrait
 * beaucoup plus vite qu'une autre, et la durée de la réponse dirait si le compte
 * existe. On vérifie donc contre celle-ci pour dépenser le même temps.
 *
 * Le mot de passe qui lui correspond n'existe pas : elle est produite à partir
 * d'octets aléatoires au démarrage du processus.
 */
let decoy: Promise<string> | null = null

function getDecoy() {
  decoy ??= hash(crypto.randomUUID(), OPTIONS)
  return decoy
}

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS)
}

/**
 * Vérifie un mot de passe contre une empreinte.
 *
 * Une empreinte illisible - tronquée, produite par un autre algorithme - rend
 * `false` plutôt que de lever : c'est un refus d'authentification, pas une panne.
 */
export async function verifyPassword(
  plain: string,
  digest: string
): Promise<boolean> {
  try {
    return await verify(digest, plain, OPTIONS)
  } catch {
    return false
  }
}

/**
 * Dépense le temps d'une vérification sans en attendre le résultat.
 * À appeler quand l'adresse est inconnue, pour que la réponse mette le même
 * temps que sur un compte existant.
 */
export async function burnVerifyTime(plain: string): Promise<void> {
  await verifyPassword(plain, await getDecoy())
}
