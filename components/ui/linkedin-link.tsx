import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { site, social } from "@/lib/site"

/**
 * Le lien vers la page LinkedIn du studio, en icône seule.
 *
 * **Trois points qui ne se voient pas à la lecture du JSX :**
 *
 * - **Habillage secondaire, jamais `brand`.** La DA n'autorise qu'un geste orange par
 *   écran, et sur l'accueil il est déjà pris deux fois - le point du titre et le CTA
 *   primaire. Un troisième carré orange à côté d'eux ferait hésiter sur l'action
 *   principale, alors que ce lien sort du site.
 * - **Ancre ordinaire, pas `next/link`.** L'adresse est externe : le routeur n'a rien à
 *   préparer, et `PageCurtain` ne doit pas poser son voile pour un onglet qu'il ne
 *   navigue pas.
 * - **Le libellé vit dans `aria-label`.** Une icône seule ne dit rien à un lecteur
 *   d'écran ; le glyphe est donc `aria-hidden` et le nom du lien est explicite, « sur
 *   LinkedIn » plutôt que « LinkedIn », pour qu'il se comprenne sorti de son contexte.
 */
function LinkedInLink({ className }: { className?: string }) {
  return (
    <a
      href={social.linkedin.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${site.name} sur ${social.linkedin.label}`}
      className={cn(
        buttonVariants({ variant: "secondary", size: "icon" }),
        className
      )}
    >
      <LinkedInGlyph />
    </a>
  )
}

/**
 * Le glyphe « in », en aplat plutôt qu'en trait.
 *
 * Les icônes du site viennent de lucide, qui a retiré ses marques : le chemin est donc
 * porté ici. Il reprend le dessin officiel, seule forme qu'une marque tierce autorise -
 * un « in » redessiné à l'épaisseur de trait de lucide serait un logo que LinkedIn n'a
 * pas.
 */
function LinkedInGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-[1.125rem]"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zm1.78 13.02H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

export { LinkedInLink }
