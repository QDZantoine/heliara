/**
 * Les huit pictos du kit visuel Heliara : quatre familles d'expertise, quatre temps
 * de la méthode. Générés depuis `heliara-kit-visuel/04-pictos/svg/fond-clair`, tracés
 * inchangés.
 *
 * **Deux couleurs, deux variables, et c'est ce qui les rend utilisables partout** :
 * l'encre du kit (`#101012`) est devenue `currentColor`, l'orange (`#E9591F`)
 * `var(--picto-accent, currentColor)`. Le picto suit donc le thème sans fichier
 * sombre, et l'accent reste éteint tant que le parent ne l'allume pas - quatre pictos
 * orange alignés feraient quatre gestes de marque sur un écran qui n'en admet qu'un.
 * Les listes l'allument au survol de leur ligne.
 *
 * Ne pas retoucher les tracés à la main : la charte interdit de déformer le symbole,
 * et le picto « construire » le contient.
 */
export const pictos = {
  "applications-mobiles":
    '<rect x="16" y="4" width="32" height="56" rx="9" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M28 11 H36" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(23.48 24.00) scale(0.0400)"><path d="M85 7 H304 A78 78 0 0 1 382 85 V166.23 L32.39 243.08 Q7 248.66 7 222.66 V85 A78 78 0 0 1 85 7 Z" fill="var(--picto-accent, currentColor)"/><path d="M44 282.43 L391.59 206.87 Q417 201.35 417 227.35 V364 A78 78 0 0 1 339 442 H122 A78 78 0 0 1 44 364 Z" fill="var(--picto-accent, currentColor)"/></g>',
  cadrer:
    '<path d="M6 18 V10 a4 4 0 0 1 4 -4 H18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 6 H54 a4 4 0 0 1 4 4 V18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 46 V54 a4 4 0 0 1 -4 4 H46" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 58 H10 a4 4 0 0 1 -4 -4 V46" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="32" r="8" fill="var(--picto-accent, currentColor)"/>',
  concevoir:
    '<rect x="6" y="6" width="40" height="40" rx="7" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M14 17 H38 M14 26 H30" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><g transform="rotate(-45 44 44)"><rect x="37" y="30" width="14" height="32" rx="3" fill="var(--picto-accent, currentColor)"/><path d="M37 62 L44 72 L51 62 Z" fill="var(--picto-accent, currentColor)"/></g>',
  construire:
    '<g transform="translate(6.44 5.00) scale(0.1200)"><path d="M85 7 H304 A78 78 0 0 1 382 85 V166.23 L32.39 243.08 Q7 248.66 7 222.66 V85 A78 78 0 0 1 85 7 Z" fill="none" stroke="currentColor" stroke-width="29.17" stroke-linejoin="round"/><path d="M44 282.43 L391.59 206.87 Q417 201.35 417 227.35 V364 A78 78 0 0 1 339 442 H122 A78 78 0 0 1 44 364 Z" fill="var(--picto-accent, currentColor)"/></g>',
  "faire-durer":
    '<path d="M52 26 A21 21 0 0 0 13 22" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 38 A21 21 0 0 0 51 42" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 12 V22 H23" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M51 52 V42 H41" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 32 L30 38 L41 26" fill="none" stroke="var(--picto-accent, currentColor)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
  "ia-api":
    '<path d="M19 18 L6 32 L19 46" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M45 18 L58 32 L45 46" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 21 C33.65 30.35 33.65 30.35 43 32 C33.65 33.65 33.65 33.65 32 43 C30.35 33.65 30.35 33.65 21 32 C30.35 30.35 30.35 30.35 32 21 Z" fill="var(--picto-accent, currentColor)"/>',
  "plateformes-saas":
    '<rect x="6" y="10" width="52" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M6 21 H58" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 21 V54" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="27" y="38" width="6" height="10" rx="2" fill="var(--picto-accent, currentColor)" stroke="none" stroke-width="3.5"/><rect x="36" y="32" width="6" height="16" rx="2" fill="var(--picto-accent, currentColor)" stroke="none" stroke-width="3.5"/><rect x="45" y="27" width="6" height="21" rx="2" fill="var(--picto-accent, currentColor)" stroke="none" stroke-width="3.5"/>',
  "sites-ecommerce":
    '<rect x="6" y="8" width="52" height="42" rx="8" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M6 19 H58" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13" cy="13.5" r="1.8" fill="currentColor"/><circle cx="19" cy="13.5" r="1.8" fill="currentColor"/><path d="M21 30 H43 L41 46 Q40.6 48 38.6 48 H25.4 Q23.4 48 23 46 Z" fill="var(--picto-accent, currentColor)"/><path d="M27 30 V28 a5 5 0 0 1 10 0 V30" fill="none" stroke="var(--picto-accent, currentColor)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 58 H42" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
} as const

export type PictoName = keyof typeof pictos

/**
 * Le picto de chaque famille d'expertise. Une table et non un champ de la famille :
 * les familles sont administrables, et une famille créée depuis l'administration n'a
 * pas de picto - elle s'affiche alors sans, sans casser la ligne.
 */
export const familyPictos: Record<string, PictoName> = {
  "plateformes-saas": "plateformes-saas",
  "sites-e-commerce": "sites-ecommerce",
  "ia-api": "ia-api",
  "applications-mobiles": "applications-mobiles",
}

/** Les quatre temps de l'aperçu de méthode, dans l'ordre de `methodPreview`. */
export const methodPictos: PictoName[] = [
  "cadrer",
  "concevoir",
  "construire",
  "faire-durer",
]
