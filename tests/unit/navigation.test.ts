import { existsSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { articles } from "@/lib/content/articles"
import { caseStudies } from "@/lib/content/cases"
import { expertiseServices } from "@/lib/content/expertises"
import {
  cta,
  expertiseNav,
  footerNav,
  group,
  legalNav,
  mainNav,
  site,
} from "@/lib/site"

const root = path.resolve(import.meta.dirname, "../..")

/** Les slugs que les routes dynamiques savent servir, par segment de tête. */
const dynamicSlugs: Record<string, string[]> = {
  realisations: caseStudies.map((study) => study.slug),
  expertises: expertiseServices.map((service) => service.slug),
  ressources: articles.map((article) => article.slug),
}

/**
 * Une route interne est-elle réellement servie ?
 *
 * Le test lit l'arborescence `app/` plutôt qu'une liste recopiée : une page
 * supprimée ou renommée fait donc échouer les liens qui la visaient, ce qu'aucune
 * liste tenue à la main ne garantirait.
 */
function routeExists(href: string) {
  const segments = href.replace(/^\//, "").split("/").filter(Boolean)

  if (segments.length === 0) {
    return existsSync(path.join(root, "app/page.tsx"))
  }

  if (segments.length === 1) {
    return existsSync(path.join(root, "app", segments[0], "page.tsx"))
  }

  if (segments.length === 2) {
    const [collection, slug] = segments
    const dynamic = path.join(root, "app", collection, "[slug]", "page.tsx")
    return existsSync(dynamic) && dynamicSlugs[collection]?.includes(slug)
  }

  return false
}

/** Tous les liens internes déclarés dans lib/site.ts, aplatis. */
const internalLinks = [
  ...mainNav.map((item) => item.href),
  ...expertiseNav.map((item) => item.href),
  ...footerNav.flatMap((column) => column.links.map((link) => link.href)),
  ...legalNav.map((item) => item.href),
  cta.primary.href,
  cta.secondary.href,
  cta.method.href,
  group.href,
].filter((href) => href.startsWith("/"))

describe("site", () => {
  it("expose une URL absolue sans barre finale, ce dont dépendent sitemap et robots", () => {
    expect(site.url).toMatch(/^https:\/\/[^/]+$/)
  })

  it("expose une adresse e-mail valide", () => {
    expect(site.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/)
  })
})

describe("navigation", () => {
  it("compte cinq entrées principales, jamais plus : deux niveaux maximum", () => {
    expect(mainNav).toHaveLength(5)
  })

  it("ne fait figurer ni le groupe ni les pages légales dans la nav principale", () => {
    const hrefs = mainNav.map((item) => item.href)
    expect(hrefs).not.toContain(group.href)
    for (const legal of legalNav) {
      expect(hrefs).not.toContain(legal.href)
    }
  })

  it("ne déclare jamais deux fois la même entrée principale", () => {
    expect(new Set(mainNav.map((item) => item.href)).size).toBe(mainNav.length)
  })

  it("pointe chaque lien interne vers une route qui existe vraiment", () => {
    for (const href of internalLinks) {
      expect(routeExists(href), href).toBe(true)
    }
  })

  it("détecte bien une route absente - le contrôle ci-dessus n'est pas vide", () => {
    // Garde-fou : sans lui, une erreur dans `routeExists` rendrait le test
    // précédent toujours vert. Carrières est justement hors périmètre.
    expect(routeExists("/carrieres")).toBe(false)
    expect(routeExists("/realisations/slug-inexistant")).toBe(false)
  })

  it("libelle chaque entrée de nav", () => {
    for (const item of [...mainNav, ...expertiseNav, ...legalNav]) {
      expect(item.label).not.toBe("")
    }
  })

  it("reprend les trois familles d'expertise dans le sous-menu", () => {
    expect(expertiseNav).toHaveLength(3)
  })
})

describe("système de CTA", () => {
  it("tient les trois niveaux d'engagement, et pas un quatrième", () => {
    expect(Object.keys(cta).sort()).toEqual(["method", "primary", "secondary"])
  })

  it("mène le primaire au contact et le secondaire à la preuve", () => {
    expect(cta.primary.href).toBe("/contact")
    expect(cta.primary.label).toBe("Parlons de votre projet")
    expect(cta.secondary.href).toBe("/realisations")
  })

  it("donne au primaire un libellé court pour les zones denses", () => {
    expect(cta.primary.shortLabel.length).toBeLessThan(cta.primary.label.length)
  })
})

describe("endossement de groupe", () => {
  it("ne nomme pas le holding : l'endossement reste anonyme", () => {
    expect(group.endorsement).toBe("Heliara, une marque du groupe")
    expect(Object.keys(group)).not.toContain("name")
  })

  it("ne figure que dans le pied de page et sur sa propre route", () => {
    expect(group.href).toBe("/le-groupe")
    expect(mainNav.map((item) => item.href)).not.toContain(group.href)
  })
})

describe("pied de page", () => {
  it("organise trois colonnes titrées", () => {
    expect(footerNav).toHaveLength(3)
    for (const column of footerNav) {
      expect(column.title).not.toBe("")
      expect(column.links.length).toBeGreaterThan(0)
    }
  })

  it("y place l'e-mail en mailto, le seul lien non interne", () => {
    const mailto = footerNav
      .flatMap((column) => column.links)
      .find((link) => link.href.startsWith("mailto:"))
    expect(mailto?.href).toBe(`mailto:${site.email}`)
  })

  it("y reprend le groupe et les deux pages légales", () => {
    const hrefs = footerNav.flatMap((column) => column.links.map((l) => l.href))
    expect(hrefs).toContain(group.href)
    expect(legalNav.map((item) => item.href)).toEqual([
      "/mentions-legales",
      "/confidentialite",
    ])
  })
})

describe("plan du site", () => {
  const entries = sitemap()
  const urls = entries.map((entry) => entry.url)

  it("préfixe toutes les URL par le domaine, sans doublon", () => {
    for (const url of urls) {
      expect(url.startsWith(`${site.url}/`)).toBe(true)
    }
    expect(new Set(urls).size).toBe(urls.length)
  })

  it("déclare l'accueil en priorité maximale", () => {
    const home = entries.find((entry) => entry.url === `${site.url}/`)
    expect(home?.priority).toBe(1)
  })

  it("déclare les cinq pages de nav plus contact et le groupe", () => {
    for (const href of [
      ...mainNav.map((item) => item.href),
      cta.primary.href,
      group.href,
    ]) {
      expect(urls, href).toContain(`${site.url}${href}`)
    }
  })

  it("déclare chaque page des trois collections dynamiques", () => {
    for (const study of caseStudies) {
      expect(urls).toContain(`${site.url}/realisations/${study.slug}`)
    }
    for (const service of expertiseServices) {
      expect(urls).toContain(`${site.url}/expertises/${service.slug}`)
    }
    for (const article of articles) {
      expect(urls).toContain(`${site.url}/ressources/${article.slug}`)
    }
  })

  it("exclut les pages légales : elles portent robots noindex", () => {
    for (const legal of legalNav) {
      expect(urls).not.toContain(`${site.url}${legal.href}`)
    }
  })

  it("date les articles de leur publication, pour que lastModified ait un sens", () => {
    for (const article of articles) {
      const entry = entries.find(
        (candidate) =>
          candidate.url === `${site.url}/ressources/${article.slug}`
      )
      expect(entry?.lastModified).toEqual(new Date(article.publishedAt))
    }
  })

  it("borne toutes les priorités entre 0 et 1", () => {
    for (const entry of entries) {
      expect(entry.priority, entry.url).toBeGreaterThan(0)
      expect(entry.priority, entry.url).toBeLessThanOrEqual(1)
    }
  })
})

describe("robots", () => {
  it("ouvre tout le site et désigne le plan du site", () => {
    const result = robots()
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" })
    expect(result.sitemap).toBe(`${site.url}/sitemap.xml`)
  })
})
