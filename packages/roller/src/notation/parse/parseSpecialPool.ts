// Patterns that allow an optional leading sign for pool arithmetic context
const PERCENTILE_POOL_PATTERN = /^([+-]?)(\d*)[Dd]%$/
const GEOMETRIC_POOL_PATTERN = /^([+-]?)(\d*)[Gg](\d+)$/
const DRAW_POOL_PATTERN = /^([+-]?)(\d*)[Dd][Dd](\d+)$/

export interface SpecialPoolResult {
  readonly quantity: number
  readonly sides: number
  readonly arithmetic: 'add' | 'subtract'
  readonly kind: 'percentile' | 'geometric' | 'draw'
}

/**
 * Parse a special pool segment (d%, gN, DDN) that may carry a leading +/- sign
 * from multi-pool splitting. Returns a SpecialPoolResult or null if not matched.
 */
export function parseSpecialPoolSegment(segment: string): SpecialPoolResult | null {
  const trimmed = segment.trim()

  const percentileMatch = PERCENTILE_POOL_PATTERN.exec(trimmed)
  if (percentileMatch) {
    const sign = percentileMatch[1]
    const arithmetic = sign === '-' ? ('subtract' as const) : ('add' as const)
    const quantityStr = percentileMatch[2]
    const quantity = quantityStr && quantityStr.length > 0 ? Number(quantityStr) : 1
    return { quantity, sides: 100, arithmetic, kind: 'percentile' }
  }

  const geometricMatch = GEOMETRIC_POOL_PATTERN.exec(trimmed)
  if (geometricMatch) {
    const sign = geometricMatch[1]
    const arithmetic = sign === '-' ? ('subtract' as const) : ('add' as const)
    const quantityStr = geometricMatch[2]
    const quantity = quantityStr && quantityStr.length > 0 ? Number(quantityStr) : 1
    const sides = Number(geometricMatch[3])
    return { quantity, sides, arithmetic, kind: 'geometric' }
  }

  const drawMatch = DRAW_POOL_PATTERN.exec(trimmed)
  if (drawMatch) {
    const sign = drawMatch[1]
    const arithmetic = sign === '-' ? ('subtract' as const) : ('add' as const)
    const quantityStr = drawMatch[2]
    const quantity = quantityStr && quantityStr.length > 0 ? Number(quantityStr) : 1
    const sides = Number(drawMatch[3])
    return { quantity, sides, arithmetic, kind: 'draw' }
  }

  return null
}
