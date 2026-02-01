import { coreNotationPattern } from './coreNotationPattern'
import { buildCombinedPattern } from '../modifiers'

/**
 * Build the complete roll pattern source from core notation + all registered modifiers.
 */
function buildCompletePatternSource(): string {
  const modifierPattern = buildCombinedPattern()
  return [coreNotationPattern.source, modifierPattern.source].join('|')
}

/**
 * Factory function to get the global RegExp for complete roll pattern.
 * Returns a fresh pattern each time to avoid stateful regex issues.
 */
export function createCompleteRollPattern(): RegExp {
  const source = buildCompletePatternSource()
  return new RegExp(source, 'g')
}
