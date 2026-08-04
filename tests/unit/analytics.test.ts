import { afterEach, describe, expect, it, vi } from "vitest"

import { umamiConfig } from "@/lib/analytics"

/**
 * La configuration de la mesure d'audience.
 *
 * **Ce que ces tests protègent.** Le composant qui pose le script ne décide de rien : il
 * rend ce que cette fonction lui donne, ou rien. Toute la logique décidable est donc ici,
 * et vérifiable sans DOM.
 *
 * Les trois cas de refus valent chacun une panne réelle : une configuration à moitié
 * renseignée chargerait du JavaScript tiers sur toutes les pages sans rien mesurer ; une
 * URL en HTTP serait bloquée comme contenu mixte, sans que le navigateur le dise ; une URL
 * malformée donnerait une balise `<script>` morte. Dans les trois cas le symptôme visible
 * est le même - pas de statistiques - et la cause est invisible depuis Umami.
 */
const CONFIG = {
  src: "https://stats.exemple.test/script.js",
  websiteId: "ae7d071a-1f6c-43bc-9c4a-1ec7ea480225",
}

function stub(src: string | undefined, websiteId: string | undefined) {
  vi.stubEnv("UMAMI_SCRIPT_URL", src)
  vi.stubEnv("UMAMI_WEBSITE_ID", websiteId)
}

describe("umamiConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("rend la configuration quand les deux variables sont là", () => {
    stub(CONFIG.src, CONFIG.websiteId)
    expect(umamiConfig()).toEqual(CONFIG)
  })

  it("ne mesure rien sans configuration, sans lever d'erreur", () => {
    stub(undefined, undefined)
    expect(umamiConfig()).toBeNull()
  })

  /*
    Le cas le plus coûteux, parce qu'il est silencieux : le script se charge, l'onglet
    réseau montre un 200, et aucune visite n'arrive dans Umami.
  */
  it("refuse une adresse sans identifiant de site", () => {
    stub(CONFIG.src, undefined)
    expect(umamiConfig()).toBeNull()
  })

  it("refuse un identifiant de site sans adresse", () => {
    stub(undefined, CONFIG.websiteId)
    expect(umamiConfig()).toBeNull()
  })

  it("refuse HTTP, que le navigateur bloquerait comme contenu mixte", () => {
    stub("http://stats.exemple.test/script.js", CONFIG.websiteId)
    expect(umamiConfig()).toBeNull()
  })

  it("refuse une URL malformée plutôt que de rendre une balise morte", () => {
    stub("stats.exemple.test/script.js", CONFIG.websiteId)
    expect(umamiConfig()).toBeNull()
  })

  /*
    Une valeur collée depuis un tableur ou un gestionnaire de secrets arrive volontiers
    avec une espace ou un retour à la ligne. `new URL(" https://…")` échoue, et
    l'identifiant serait envoyé tel quel dans l'attribut.
  */
  it("tolère les espaces autour des valeurs", () => {
    stub(`  ${CONFIG.src}\n`, ` ${CONFIG.websiteId} `)
    expect(umamiConfig()).toEqual(CONFIG)
  })

  it("traite une variable vide comme absente", () => {
    stub("   ", CONFIG.websiteId)
    expect(umamiConfig()).toBeNull()
  })
})
