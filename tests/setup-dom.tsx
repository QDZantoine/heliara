import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"

/**
 * Socle des tests de composants.
 *
 * `next/link` est remplacé par une ancre : le vrai composant réclame le contexte
 * du routeur, et un `<a href>` est exactement ce que les tests observent - c'est
 * d'ailleurs ce que `PageCurtain` intercepte en production.
 *
 * `next/navigation` est simulé plutôt que rendu inerte, pour que les tests
 * puissent piloter le pathname et vérifier ce que reçoit `router.push`.
 */

export const navigation = {
  pathname: "/",
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
}

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(),
}))

/**
 * jsdom n'implémente ni `IntersectionObserver` ni `matchMedia`. Les composants
 * s'en servent tous les deux et se replient proprement en leur absence, mais
 * un test doit pouvoir choisir la réponse : d'où ces doubles pilotables.
 */
type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

export const observers: {
  callback: ObserverCallback
  targets: Element[]
  disconnected: boolean
}[] = []

/** Déclenche l'entrée dans le champ sur tous les observateurs enregistrés. */
export function intersect(isIntersecting = true) {
  for (const observer of observers) {
    observer.callback(
      observer.targets.map(
        (target) => ({ target, isIntersecting }) as IntersectionObserverEntry
      )
    )
  }
}

/** Préférence de mouvement lue par `matchMedia`. Remise à plat entre deux tests. */
export const media = { reducedMotion: false }

class FakeIntersectionObserver {
  private entry: (typeof observers)[number]

  constructor(callback: ObserverCallback) {
    this.entry = { callback, targets: [], disconnected: false }
    observers.push(this.entry)
  }
  observe(target: Element) {
    this.entry.targets.push(target)
  }
  unobserve(target: Element) {
    this.entry.targets = this.entry.targets.filter((el) => el !== target)
  }
  disconnect() {
    this.entry.disconnected = true
    this.entry.targets = []
  }
  takeRecords() {
    return []
  }
}

beforeEach(() => {
  navigation.pathname = "/"
  navigation.push.mockClear()
  observers.length = 0
  media.reducedMotion = false

  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver)
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches:
        query.includes("prefers-reduced-motion: reduce") && media.reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }))
  )
})

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute("data-curtain")
  document.documentElement.classList.remove("dark")
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
