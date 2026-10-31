// The dice pad and modifier keys edit the notation string in place, so what
// they build is always what the input shows and what rolls.

const TRAILING_CONSTANT = /([+-])(\d+)$/
// The last pool and any modifiers on it: 2d20, 4d6L, 3d6R{<3}!
const TRAILING_POOL = /(^|[+-])(\d*)d(\d+)([^+\-\d][^+-]*)?$/
const DROPS = new Set(['L', 'H'])

function poolCount(count: string | undefined): number {
  return count === '' || count === undefined ? 1 : Number(count)
}

/** Adds one die of `sides`: 1d20 → 2d20, 4d6L → 5d6L, or appends a new pool. */
export function addDie(notation: string, sides: number): string {
  const trimmed = notation.trim()
  if (trimmed.length === 0) return `1d${sides}`
  const pool = TRAILING_POOL.exec(trimmed)
  if (pool !== null && pool[3] === String(sides)) {
    const count = poolCount(pool[2])
    return `${trimmed.slice(0, pool.index)}${pool[1] ?? ''}${count + 1}d${sides}${pool[4] ?? ''}`
  }
  return `${trimmed}+1d${sides}`
}

/** Moves the trailing constant by `delta`: 1d20 → 1d20+1, 1d20+1 → 1d20. */
export function adjustConstant(notation: string, delta: number): string {
  const trimmed = notation.trim()
  if (trimmed.length === 0) return trimmed
  const match = TRAILING_CONSTANT.exec(trimmed)
  const current = match === null ? 0 : (match[1] === '-' ? -1 : 1) * Number(match[2])
  const base = match === null ? trimmed : trimmed.slice(0, match.index)
  const next = current + delta
  if (next === 0) return base
  return `${base}${next > 0 ? '+' : '-'}${Math.abs(next)}`
}

/**
 * Adds or removes a modifier on the last pool, ahead of any trailing constant.
 * Dropping from a single die would leave nothing to roll, so a drop on 1d20
 * makes it 2d20L: advantage, or 2d20H for disadvantage.
 */
export function toggleModifier(notation: string, modifier: string): string {
  const trimmed = notation.trim()
  if (trimmed.length === 0) return trimmed
  const match = TRAILING_CONSTANT.exec(trimmed)
  const base = match === null ? trimmed : trimmed.slice(0, match.index)
  const tail = match === null ? '' : match[0]
  if (base.endsWith(modifier)) return `${base.slice(0, -modifier.length)}${tail}`
  const pool = TRAILING_POOL.exec(base)
  if (DROPS.has(modifier) && pool !== null && poolCount(pool[2]) === 1) {
    return `${base.slice(0, pool.index)}${pool[1] ?? ''}2d${pool[3] ?? ''}${pool[4] ?? ''}${modifier}${tail}`
  }
  return `${base}${modifier}${tail}`
}
