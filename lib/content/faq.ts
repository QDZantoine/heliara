/**
 * Les questions qu'on nous pose avant de signer, et leurs réponses.
 *
 * **Chaque réponse est déjà vraie ailleurs sur le site**, et c'est la seule condition
 * pour qu'une question entre ici : les engagements de `guarantees.ts`, les livrables de
 * `method.ts`, les technologies telles que `CLAUDE.md` les fixe, les zones
 * d'intervention de `site.ts`. Rien n'est affirmé de neuf - une FAQ est le dernier
 * endroit où inventer, puisque c'est le format qu'un moteur générateur reprend mot pour
 * mot.
 *
 * **Ce qui les a choisies.** Elles ne viennent pas d'une supposition sur ce qu'un
 * prospect demande : ce sont les points qu'un assistant conversationnel a exigés de
 * vérifier quand on lui a demandé si le studio était sérieux - propriété du code, accès
 * administrateur, coût de la maintenance, réalisations comparables, contacts clients.
 * Une réponse écrite noir sur blanc vaut mieux qu'un échange de courriels pour chacune.
 *
 * **Deux questions n'y sont pas, faute de pouvoir y répondre honnêtement** : le prix
 * d'un projet et sa durée en semaines. Les deux dépendent du périmètre, et une fourchette
 * inventée serait pire que l'absence. Elles viendront le jour où le studio publiera sa
 * façon de chiffrer.
 *
 * **Le balisage `FAQPage` suit l'affichage, jamais l'inverse.** Une paire balisée qui
 * n'est pas à l'écran est un écart signalable : cette liste est la source unique des
 * deux.
 */
export type FaqEntry = { question: string; answer: string }

export const contactFaqSection = {
  eyebrow: "Questions fréquentes",
  title: "Ce qu'on nous demande avant de signer.",
} as const

export const contactFaq: FaqEntry[] = [
  {
    question: "À qui appartient le code du produit livré ?",
    answer:
      "À vous, entièrement, et documenté pour être repris. C'est un engagement contractuel et non une intention : le dépôt, les accès d'administration et la documentation technique vous sont remis, et la réversibilité est garantie. Vous pouvez confier la suite à une autre équipe sans rien réécrire.",
  },
  {
    question: "Que se passe-t-il si nous voulons changer de prestataire ?",
    answer:
      "Rien ne vous en empêche, et c'est le sens de la réversibilité garantie. Le code vous appartient, il est documenté, l'hébergement est le vôtre et aucun composant maison ne vous enferme : il n'y a pas de verrou fournisseur à racheter pour partir.",
  },
  {
    question: "Comment se déroule un projet, concrètement ?",
    answer:
      "En huit temps, chacun avec un livrable nommé : une synthèse de découverte, un périmètre chiffré au cadrage, un prototype navigable testé avec vos équipes, les maquettes et le design system, puis une version démontrable toutes les deux semaines jusqu'à la mise en ligne. Les jalons sont datés dès le cadrage et le budget est ferme par phase.",
  },
  {
    question: "Quelles technologies utilisez-vous ?",
    answer:
      "Par défaut TypeScript, Next.js et MariaDB, parce qu'elles sont documentées et recrutables - donc reprenables par quelqu'un d'autre. Ce ne sont pas des passages obligés : la technologie suit le besoin, et un choix différent se dit avant de commencer. Pour une boutique en ligne, nous partons de Shopify avec un thème entièrement sur mesure : nous ne développons ni moteur de paiement, ni calcul de TVA, ni gestion de fraude.",
  },
  {
    question: "Où sont hébergées les données ?",
    answer:
      "En France, sur une infrastructure souveraine. C'est l'un des engagements que nous portons à chaque livraison, au même titre que l'accessibilité AA et l'audit de sécurité par des pentesters.",
  },
  {
    question: "Faut-il être près de vous pour travailler avec vous ?",
    answer:
      "Non. Nous nous déplaçons à Montpellier, Béziers, Nîmes et Paris pour les temps qui le méritent, en particulier le cadrage : comprendre un métier suppose de voir les gens le faire. Le reste du projet se conduit à distance, partout en France, avec les mêmes jalons et les mêmes livrables.",
  },
]
