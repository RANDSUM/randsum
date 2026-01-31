import { coreNotationPattern } from './coreNotationPattern'
// Import modifiers to ensure registry is populated before building pattern
import { buildCombinedPattern } from '../modifiers'

/**
 * Build the complete roll pattern source from core notation + all registered modifiers.
 * Lazy-evaluated to ensure registry is populated.
 */
function buildCompletePatternSource(): string {
  const modifierPattern = buildCombinedPattern()
  return [coreNotationPattern.source, modifierPattern.source].join('|')
}

// Cached pattern - built on first access
let cachedGlobalPattern: RegExp | null = null

function ensurePatternCached(): RegExp {
  if (cachedGlobalPattern === null) {
    const source = buildCompletePatternSource()
    cachedGlobalPattern = new RegExp(source, 'g')
  }
  return cachedGlobalPattern
}

/**
 * Factory function to get the global RegExp for complete roll pattern.
 * Returns a cached pattern with lastIndex reset to avoid stateful regex issues.
 */
export function createCompleteRollPattern(): RegExp {
  const pattern = ensurePatternCached()
  // Reset lastIndex for global patterns (they're stateful)
  pattern.lastIndex = 0
  return pattern
}
