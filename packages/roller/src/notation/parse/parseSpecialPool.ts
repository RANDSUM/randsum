// Patterns that allow an optional leading sign for pool arithmetic context
const PERCENTILE_POOL_PATTERN = /^([+-]?)(\d*)[Dd]%$/
const GEOMETRIC_POOL_PATTERN = /^([+-]?)(\d*)[Gg](\d+)$/
const DRAW_POOL_PATTERN = /^([+-]?)(\d*)[Dd][Dd](\d+)$/
const FATE_POOL_PATTERN = /^([+-]?)(\d*)[Dd][Ff](?:\.([12]))?$/
const CUSTOM_FACES_POOL_PATTERN = /^([+-]?)(\d*)[Dd]\{([^}]+)\}$/
const ZERO_BIAS_POOL_PATTERN = /^([+-]?)(\d*)[Zz](\d+)$/

export type SpecialPoolKind = 'percentile' | 'geometric' | 'draw' | 'fate' | 'custom' | 'zeroBias'

export interface SpecialPoolResult {
  readonly quantity: number
  readonly sides: number
  readonly arithmetic: 'add' | 'subtract'
  readonly kind: SpecialPoolKind
  readonly fateVariant?: 1 | 2
  readonly customFaces?: readonly string[]
}

function extractSign(sign: string | undefined): 'add' | 'subtract' {
  return sign === '-' ? 'subtract' : 'add'
}

function extractQuantity(str: string | undefined): number {
  return str !== undefined && str.length > 0 ? Number(str) : 1
}

/**
 * Parse a special pool segment that may carry a leading +/- sign
 * from multi-pool splitting. Returns a SpecialPoolResult or null if not matched.
 */
export function parseSpecialPoolSegment(segment: string): SpecialPoolResult | null {
  const trimmed = segment.trim()

  const percentileMatch = PERCENTILE_POOL_PATTERN.exec(trimmed)
  if (percentileMatch) {
    return {
      quantity: extractQuantity(percentileMatch[2]),
      sides: 100,
      arithmetic: extractSign(percentileMatch[1]),
      kind: 'percentile'
    }
  }

  // Draw must be checked before Fate (both start with D)
  const drawMatch = DRAW_POOL_PATTERN.exec(trimmed)
  if (drawMatch) {
    return {
      quantity: extractQuantity(drawMatch[2]),
      sides: Number(drawMatch[3]),
      arithmetic: extractSign(drawMatch[1]),
      kind: 'draw'
    }
  }

  const geometricMatch = GEOMETRIC_POOL_PATTERN.exec(trimmed)
  if (geometricMatch) {
    return {
      quantity: extractQuantity(geometricMatch[2]),
      sides: Number(geometricMatch[3]),
      arithmetic: extractSign(geometricMatch[1]),
      kind: 'geometric'
    }
  }

  const zeroBiasMatch = ZERO_BIAS_POOL_PATTERN.exec(trimmed)
  if (zeroBiasMatch) {
    return {
      quantity: extractQuantity(zeroBiasMatch[2]),
      sides: Number(zeroBiasMatch[3]),
      arithmetic: extractSign(zeroBiasMatch[1]),
      kind: 'zeroBias'
    }
  }

  const fateMatch = FATE_POOL_PATTERN.exec(trimmed)
  if (fateMatch) {
    const variant = fateMatch[3] === '2' ? 2 : 1
    return {
      quantity: extractQuantity(fateMatch[2]),
      sides: variant === 2 ? 5 : 3,
      arithmetic: extractSign(fateMatch[1]),
      kind: 'fate',
      fateVariant: variant
    }
  }

  const customMatch = CUSTOM_FACES_POOL_PATTERN.exec(trimmed)
  if (customMatch) {
    const facesStr = customMatch[3]
    if (facesStr === undefined) return null
    const faces = facesStr.split(',').map(f => f.trim())
    return {
      quantity: extractQuantity(customMatch[2]),
      sides: faces.length,
      arithmetic: extractSign(customMatch[1]),
      kind: 'custom',
      customFaces: faces
    }
  }

  return null
}
