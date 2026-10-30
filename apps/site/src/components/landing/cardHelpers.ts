// Shared presentation helpers for the landing-page package/game/tool card grids.
// Extracted verbatim from src/pages/index.astro (L7c) so the three grid components
// share one implementation. Behaviour is unchanged.

interface CardPackage {
  readonly id: string
  readonly npmPackage: string
  readonly category: 'core' | 'game' | 'tool'
  readonly version?: string | undefined
  readonly color?: string | undefined
}

// Daggerheart's gold is bright in dark mode only, so its hover text flips with it
const darkTextOnAccent = new Set(['daggerheart'])

export function getBadgeUrl(pkg: Pick<CardPackage, 'npmPackage' | 'version'>): string | null {
  if (pkg.version) {
    return `https://img.shields.io/badge/v${pkg.version}-3f3f45?style=flat-square`
  }
  if (pkg.npmPackage.startsWith('@')) {
    return `https://img.shields.io/npm/v/${pkg.npmPackage}?style=flat-square&color=3f3f45`
  }
  return null
}

// A game's colour is always the theme's --game-<id>, so no page can disagree on it.
export function getAccentColor(pkg: Pick<CardPackage, 'id' | 'category' | 'color'>): string {
  if (pkg.category === 'game') return `var(--game-${pkg.id})`
  return pkg.color ?? 'var(--sl-color-accent)'
}

export function getCardStyle(pkg: Pick<CardPackage, 'id' | 'category' | 'color'>): string {
  const accent = getAccentColor(pkg)
  const textColor = darkTextOnAccent.has(pkg.id)
    ? 'light-dark(var(--rs-on-accent), var(--rs-ink))'
    : 'var(--rs-on-accent)'
  return `--card-accent: ${accent}; --card-hover-text: ${textColor}`
}

export function getCoreCardHref(pkg: Pick<CardPackage, 'id'>): string {
  if (pkg.id === 'games') return '/games/introduction/'
  return `/${pkg.id}/introduction/`
}

export function getToolCardHref(pkg: Pick<CardPackage, 'id'>): string {
  return `/tools/${pkg.id}/`
}
