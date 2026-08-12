"use client"

import * as React from "react"

import { booking } from "@/lib/site"

/**
 * Le lien de prise de rendez-vous, qui devient une fenêtre Cal.com au clic.
 *
 * **C'est une vraie ancre vers l'adresse publique, et c'est le point de départ.** Sans
 * JavaScript, elle ouvre `cal.com` dans un onglet et le rendez-vous se prend normalement.
 * Le composant ne fait que remplacer cette navigation par une fenêtre quand il le peut -
 * même logique que `PageCurtain`, qui intercepte des liens qui fonctionnaient déjà.
 *
 * **Rien de Cal.com n'est chargé avant le clic**, et c'est la raison d'être de tout ce
 * fichier plutôt que du composant officiel. Un embed posé au rendu contacte `app.cal.com`
 * dès l'affichage de la page : l'adresse IP du visiteur part chez un tiers sans qu'il ait
 * rien demandé, ce qui poserait une question de consentement sur une page qui n'en pose
 * aucune aujourd'hui. Ici, le premier octet part quand la personne clique.
 */

/** L'API que le script de Cal.com installe sur `window`. */
type CalApi = ((action: string, config?: unknown) => void) & {
  loaded?: boolean
  ns?: Record<string, unknown>
  q?: unknown[]
}

declare global {
  interface Window {
    Cal?: CalApi
  }
}

/**
 * Les couleurs de la fenêtre, reprises de `globals.css` **en valeurs littérales**.
 *
 * Le calendrier vit dans une iframe servie par Cal.com : elle n'hérite d'aucune de nos
 * variables CSS, et il faut donc les lui passer. C'est la seule duplication de la palette
 * du projet, assumée faute d'alternative - à tenir d'accord avec `:root` et `.dark` si
 * l'une de ces six valeurs bouge.
 *
 * `cal-brand` est bien pilotable de cette façon : le défaut qui l'en empêchait est corrigé,
 * et les exemples officiels de `embed-core` s'en servent. Les autres noms viennent de la
 * même source.
 */
const couleurs = {
  light: {
    "cal-brand": "#c9481a",
    "cal-bg": "#ffffff",
    "cal-bg-emphasis": "#f4f4f2",
    "cal-text": "#151517",
    "cal-text-emphasis": "#151517",
    "cal-border-booker": "#e7e7e3",
  },
  dark: {
    "cal-brand": "#f0824b",
    "cal-bg": "#17171a",
    "cal-bg-emphasis": "#202024",
    "cal-text": "#f2f2f0",
    "cal-text-emphasis": "#f2f2f0",
    "cal-border-booker": "#26262a",
  },
} as const

/**
 * Le chargeur officiel de Cal.com, recopié tel quel.
 *
 * Il installe une file d'attente sur `window.Cal` puis va chercher le script : les appels
 * passés avant l'arrivée de celui-ci sont rejoués ensuite, ce qui permet d'enchaîner
 * réglage et ouverture sans attendre.
 */
function installer() {
  if (window.Cal) {
    return
  }

  const file = function (api: { q?: unknown[] }, args: unknown) {
    api.q = api.q ?? []
    api.q.push(args)
  }

  const cal = function (...args: unknown[]) {
    const self = window.Cal as CalApi

    if (!self.loaded) {
      self.ns = {}
      self.q = self.q ?? []
      document.head.appendChild(document.createElement("script")).src =
        "https://app.cal.com/embed/embed.js"
      self.loaded = true
    }

    file(self, args)
  } as CalApi

  window.Cal = cal
}

/** Le thème servi à la fenêtre : celui de la page, lu au moment du clic. */
function themeCourant(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function BookingLink({ className }: { className?: string }) {
  const [chargement, setChargement] = React.useState(false)

  function ouvrir(event: React.MouseEvent<HTMLAnchorElement>) {
    /*
      On laisse passer tout ce qui n'est pas un clic simple : nouvel onglet demandé au
      clavier, clic du milieu, menu contextuel. Intercepter un « ouvrir dans un nouvel
      onglet » pour afficher une fenêtre est exactement ce qu'on n'attend pas d'un lien.
    */
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    setChargement(true)

    installer()
    const cal = window.Cal
    if (!cal) {
      // Rien n'a pu s'installer : la navigation reste possible, on la fait.
      window.open(booking.url, "_blank", "noreferrer")
      setChargement(false)
      return
    }

    const theme = themeCourant()
    cal("init", { origin: "https://app.cal.com" })
    cal("ui", {
      theme,
      cssVarsPerTheme: couleurs,
      hideEventTypeDetails: false,
      layout: "month_view",
    })
    cal("modal", { calLink: booking.calLink, config: { theme } })

    /*
      La fenêtre est posée par le script, sans évènement à écouter de notre côté. Le
      libellé revient à son état normal après un délai : le laisser à « Ouverture... »
      indéfiniment ferait croire à un blocage si le script ne répondait pas.
    */
    window.setTimeout(() => setChargement(false), 4000)
  }

  return (
    <a
      href={booking.url}
      target="_blank"
      rel="noreferrer"
      onClick={ouvrir}
      aria-busy={chargement || undefined}
      className={className}
    >
      {chargement ? "Ouverture…" : booking.label}
    </a>
  )
}

export { BookingLink }
