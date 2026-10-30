// Presentation helpers for the landing page's game cards.

interface CardPackage {
  readonly id: string
  readonly category: 'core' | 'game' | 'tool'
  readonly color?: string | undefined
}

// Daggerheart's gold is bright in dark mode only, so its hover text flips with it
const darkTextOnAccent = new Set(['daggerheart'])

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
