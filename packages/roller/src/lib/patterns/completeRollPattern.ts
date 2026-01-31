import { coreNotationPattern } from './coreNotationPattern'
import {
  capPattern,
  compoundPattern,
  dropConstraintsPattern,
  dropHighestPattern,
  dropLowestPattern,
  explodePattern,
  keepHighestPattern,
  keepLowestPattern,
  minusPattern,
  multiplyPattern,
  multiplyTotalPattern,
  penetratePattern,
  plusPattern,
  replacePattern,
  rerollPattern,
  successPattern,
  uniquePattern
} from './modifierPatterns'

const completeRollPatternSource = [
  coreNotationPattern.source,
  dropHighestPattern.source,
  dropLowestPattern.source,
  dropConstraintsPattern.source,
  keepHighestPattern.source,
  keepLowestPattern.source,
  // Note: compoundPattern (!!N) and penetratePattern (!pN) must come before explodePattern (!N)
  compoundPattern.source,
  penetratePattern.source,
  explodePattern.source,
  uniquePattern.source,
  replacePattern.source,
  rerollPattern.source,
  capPattern.source,
  successPattern.source,
  // Note: multiplyTotalPattern (**N) must come before multiplyPattern (*N)
  multiplyTotalPattern.source,
  multiplyPattern.source,
  plusPattern.source,
  minusPattern.source
].join('|')

// Cached global pattern - created once at module load
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
const cachedGlobalPattern: RegExp = new RegExp(completeRollPatternSource, 'g')

/**
 * Factory function to create a fresh global RegExp for complete roll pattern.
 * Returns a cached pattern with lastIndex reset to avoid stateful regex issues.
 * Use this when you need the 'g' flag.
 */
export function createCompleteRollPattern(): RegExp {
  // Reset lastIndex for global patterns (they're stateful)
  cachedGlobalPattern.lastIndex = 0
  return cachedGlobalPattern
}

/**
 * Non-global version of the complete roll pattern.
 * Safe for use with test() and match() without state issues.
 */
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const completeRollPattern: RegExp = new RegExp(completeRollPatternSource)

/**
 * Pattern source string for cases needing a fresh instance.
 */
export const completeRollPatternSourceString: string = completeRollPatternSource
