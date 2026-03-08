import { coreNotationPattern } from './coreNotationPattern'
import { getCachedCombinedPattern } from '../modifiers'

/**
 * Get the complete roll pattern (core notation + all modifier patterns).
 * Result is cached and invalidated when modifiers change.
 * Returns a fresh RegExp instance each time to prevent shared lastIndex state.
 */
export function createCompleteRollPattern(): RegExp {
  const cached = getCachedCombinedPattern()
  const source = [coreNotationPattern.source, cached.source].join('|')
  return new RegExp(source, 'g')
}
