/**
 * Les témoignages clients.
 *
 * **Volontairement vide.** Ce fichier a porté trois verbatims inventés, attribués à des
 * personnes nommées avec leur fonction et leur employeur - Claire Fontaine du Groupe
 * Ardan, Thomas Meunier de Voltéis, Awa Diallo de Nexa Santé. C'était le contenu le plus
 * exposé du site : si un homonyme réel existe, le préjudice est réel, et le fichier
 * lui-même portait la mention « verbatims à faire valider et signer par leurs auteurs ».
 *
 * La section qu'ils alimentaient sur l'accueil affiche désormais les logos des clients
 * réels - voir `lib/content/clients.ts`. Son rôle dans l'arc est le même : une voix
 * autre que celle du studio, juste avant la demande.
 *
 * **Pour la remplir un jour** : un verbatim se demande, se relit et se fait valider par
 * son auteur, par écrit. Une citation approuvée vaut plus que trois inventées, et deux
 * mots authentiques valent mieux qu'un paragraphe rédigé pour le client.
 */

export type Testimonial = {
  quote: string
  name: string
  role: string
  initials: string
}

export const testimonials: readonly Testimonial[] = []
