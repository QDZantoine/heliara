export type MethodStep = {
  num: string
  title: string
  summary: string
}

/**
 * Aperçu en quatre temps pour l’accueil (S5) : on installe le sentiment de
 * maîtrise, le détail vit sur /methode.
 */
export const methodPreview: MethodStep[] = [
  {
    num: "01",
    title: "Cadrer",
    summary:
      "Comprendre le métier avant d’écrire une ligne. Périmètre, risques et jalons posés noir sur blanc.",
  },
  {
    num: "02",
    title: "Concevoir",
    summary:
      "Parcours, maquettes, prototype testé avec vos équipes. Vous validez ce que vous verrez en production.",
  },
  {
    num: "03",
    title: "Construire",
    summary:
      "Développement par itérations courtes. Chaque quinzaine, une version démontrable de plus.",
  },
  {
    num: "04",
    title: "Faire durer",
    summary:
      "Mise en production, supervision, maintenance évolutive. Le code vous appartient, la réversibilité est garantie.",
  },
]
