// Shared presentation helpers for the landing-page package/game/tool card grids.
// Extracted verbatim from src/pages/index.astro (L7c) so the three grid components
// share one implementation. Behaviour is unchanged.

interface CardPackage {
  readonly id: string
  readonly npmPackage: string
  readonly version?: string | undefined
  readonly color?: string | undefined
}

const gameColorMap: Record<string, string> = {
  roller: 'var(--core-roller)',
  fifth: 'var(--game-fifth)',
  blades: 'var(--game-blades)',
  daggerheart: 'var(--game-daggerheart)',
  'root-rpg': 'var(--game-root-rpg)',
  salvageunion: 'var(--game-salvageunion)',
  pbta: 'var(--game-pbta)'
}

// Light accent colors need dark text on hover
const darkTextOnAccent = new Set(['daggerheart', 'cli'])

// Cards that get the RANDSUM gradient instead of a flat color
const gradientAccent = new Set(['roller'])
const randsumGradient = 'linear-gradient(135deg, #c084fc, #a855f7, #7c3aed)'

export function getBadgeUrl(pkg: Pick<CardPackage, 'npmPackage' | 'version'>): string | null {
  if (pkg.version) {
    return `https://img.shields.io/badge/v${pkg.version}-a855f7?style=flat-square`
  }
  if (pkg.npmPackage.startsWith('@')) {
    return `https://img.shields.io/npm/v/${pkg.npmPackage}?style=flat-square&color=a855f7`
  }
  return null
}

export function getAccentColor(pkg: Pick<CardPackage, 'id' | 'color'>): string {
  return gameColorMap[pkg.id] ?? pkg.color ?? 'var(--sl-color-accent)'
}

export function getCardStyle(pkg: Pick<CardPackage, 'id' | 'color'>): string {
  const accent = getAccentColor(pkg)
  const textColor = darkTextOnAccent.has(pkg.id) ? '#18181b' : '#fff'
  const gradientBg = gradientAccent.has(pkg.id) ? `; --card-accent-bg: ${randsumGradient}` : ''
  return `--card-accent: ${accent}; --card-hover-text: ${textColor}${gradientBg}`
}

export function getCoreCardHref(pkg: Pick<CardPackage, 'id'>): string {
  if (pkg.id === 'games') return '/games/introduction/'
  if (pkg.id === 'cli') return '/tools/cli/'
  return `/${pkg.id}/introduction/`
}

export function getToolCardHref(pkg: Pick<CardPackage, 'id'>): string {
  return `/tools/${pkg.id}/`
}
