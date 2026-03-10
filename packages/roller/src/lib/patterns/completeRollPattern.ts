import { coreNotationPattern } from './coreNotationPattern'
import { getCachedCombinedPattern } from '../modifiers'

/**
 * Get the complete roll pattern (core notation + all modifier patterns).
 * Constructs the complete roll pattern from the cached combined modifier source.
 * The underlying pattern source is cached and only rebuilt when modifiers change.
 * Returns a fresh RegExp instance each call to prevent shared lastIndex state.
 */
export function createCompleteRollPattern(): RegExp {
  const cached = getCachedCombinedPattern()
  const source = [coreNotationPattern.source, cached.source].join('|')
  return new RegExp(source, 'g')
}
