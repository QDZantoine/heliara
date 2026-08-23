import { Phone, X } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { site, whatsapp, whatsappChatUrl, whatsappTel } from "@/lib/site"

/**
 * La bulle WhatsApp, en bas à droite de toutes les pages publiques.
 *
 * **Elle ouvre deux portes, pas une.** Un visiteur qui repère le glyphe veut écrire ;
 * un autre veut entendre une voix. Le bouton seul aurait tranché pour lui, d'où le
 * dépliant à deux actions : écrire sur WhatsApp, ou appeler le même numéro.
 *
 * **Aucun JavaScript, et c'est le point de conception.** L'ouverture repose sur
 * `<details>` : le navigateur porte l'état, l'accessibilité clavier et l'annonce
 * « développé / replié » sans une ligne de script. Un composant client aurait ajouté du
 * JavaScript sur chaque page du site pour deux liens qui n'en demandent pas - et la
 * bulle continue de fonctionner quand le script échoue, ce que le reste du site tient
 * déjà.
 *
 * **Rien n'est chargé depuis Meta avant le clic.** Pas de widget officiel, pas
 * d'iframe : deux ancres ordinaires. C'est ce qui permet à la page de confidentialité
 * de dire qu'aucun tiers n'est contacté à l'arrivée, comme pour la prise de
 * rendez-vous.
 *
 * **Habillage surface, jamais `brand`.** La DA n'autorise qu'un geste orange par écran,
 * et il est déjà pris par le CTA primaire de chaque page. Le vert reste cantonné au
 * glyphe, où il suffit à faire reconnaître le service, et il vient de la palette du
 * projet (`success-text`) plutôt que du vert de la marque WhatsApp - dont le contraste
 * tombe sous le seuil AA dans les deux thèmes.
 *
 * **`z-100` la place au-dessus du contenu et sous tout le reste** : sous l'en-tête
 * collant (`z-200`), sous le menu plein écran (`z-400`) qui doit la couvrir, et loin
 * sous le voile de transition (`z-900`).
 *
 * **48 px collés au coin, et c'est une mesure, pas un goût.** Un élément fixe traverse
 * toutes les positions verticales de la page au défilement : la seule chose qui décide
 * de ce qu'il recouvre est donc la **largeur de la bande** qu'il occupe depuis le bord.
 * Elle fait ici 64 px sur mobile et 72 px au-delà, contre 76 et 88 avant - de quoi
 * dégager la fin des rangées de filtres de `/realisations` et `/ressources`, qui
 * s'alignent sur le bord droit du conteneur.
 *
 * **À droite, et le côté gauche a été mesuré plutôt que supposé.** À 390 px, la bande
 * gauche croise seize petites cibles - le lien d'évitement, les six entrées du pied de
 * page, la première pastille de filtre - contre cinq à droite, dont deux appartiennent
 * à l'en-tête collant et ne descendent jamais jusque là. Déplacer la bulle à gauche
 * aggraverait ce qu'elle gêne.
 *
 * Limite qui subsiste : aucune position ne dégage tout. Un bouton flottant finit
 * toujours par se poser sur quelque chose, et 44 px de cible tactile ne tiennent pas
 * dans la gouttière de 40 px que laisse le conteneur en dessous de 1440 px.
 *
 * Limite assumée : sans script, le dépliant ne se referme ni au clic à côté ni sur
 * `Échap`. Un second clic sur la bulle le referme, et les deux actions quittent la
 * page ; y remédier coûterait un composant client sur tout le site.
 */
function WhatsAppBubble() {
  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-100 md:right-6 md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] print:hidden">
      <details className="group/bubble">
        {/*
          `list-none` et le marqueur WebKit retirent le triangle du résumé, que Safari
          pose encore par défaut. La cible fait 56 px, au-delà du minimum de 44.
        */}
        <summary
          aria-label={`Nous écrire sur ${whatsapp.label} ou nous appeler`}
          className="flex size-12 cursor-pointer list-none items-center justify-center rounded-full border border-line-strong bg-raised text-success-text shadow-3 transition-[background-color,border-color,box-shadow,transform] duration-[160ms] ease-expo hover:-translate-y-0.5 hover:border-ink hover:shadow-4 [&::-webkit-details-marker]:hidden"
        >
          <WhatsAppGlyph className="size-6 group-open/bubble:hidden" />
          <X className="hidden size-5 text-ink group-open/bubble:block" />
        </summary>

        <div className="absolute right-0 bottom-full mb-3 w-72 animate-in rounded-lg border border-line bg-raised p-4 shadow-4 duration-150 ease-out fade-in slide-in-from-bottom-1">
          <p className="mb-1 text-[0.72rem] font-semibold tracking-[0.1em] text-label uppercase">
            {whatsapp.label} Business
          </p>
          <p className="mb-3.5 text-[0.845rem] leading-relaxed text-body">
            {site.responseCommitment}
          </p>

          <div className="grid gap-1.5">
            {/*
              La conversation s'ouvre dans un onglet à part : sur ordinateur, `wa.me`
              renvoie vers WhatsApp Web, et remplacer la page du studio par celle de
              Meta ferait perdre le fil de la visite.
            */}
            <a
              href={whatsappChatUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: "secondary",
                className: "w-full justify-start",
              })}
            >
              <WhatsAppGlyph className="size-4.5 text-success-text" />
              Écrire sur {whatsapp.label}
            </a>
            <a
              href={whatsappTel}
              className={buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-body",
              })}
            >
              <Phone aria-hidden="true" />
              {whatsapp.display}
            </a>
          </div>
        </div>
      </details>
    </div>
  )
}

/**
 * Le glyphe WhatsApp, en aplat.
 *
 * Même raison que pour LinkedIn : lucide a retiré ses marques, le chemin est donc porté
 * ici et reprend le dessin officiel. Une bulle redessinée à l'épaisseur de trait de
 * lucide serait un logo que WhatsApp n'a pas, et le service ne se reconnaîtrait plus.
 */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.26.86 5.81 2.42a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.07-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.03-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31s-.86.84-.86 2.05.88 2.38 1 2.55c.12.16 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.59.19 1.12.16 1.55.1.47-.07 1.44-.59 1.65-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.17-.47-.29z" />
    </svg>
  )
}

export { WhatsAppBubble }
