/**
 * @file Type guards for roll result discrimination
 * @module @randsum/dice/guards/isRollResult
 */

import type {
  CustomRollResult,
  MixedRollResult,
  NumericRollResult,
  RollResult
} from '../types'

/**
 * Type guard to check if a roll result is a numeric result
 *
 * This function determines whether a roll result contains only numeric dice,
 * allowing for type-safe access to numeric-specific properties.
 *
 * @param result - The roll result to check
 * @returns `true` if the result is numeric, `false` otherwise
 *
 * @example
 * import { roll, isNumericResult } from '@randsum/dice'
 *
 * const result = roll('4d6')
 * if (isNumericResult(result)) {
 *   // result.total is guaranteed to be a number
 *   console.log(`Total: ${result.total}`)
 *   // result.result is guaranteed to be number[]
 *   const average = result.result.reduce((a, b) => a + b) / result.result.length
 * }
 *
 * @example
 * // Filtering arrays of results
 * const results = [roll('4d6'), roll('2d20'), roll(D(['hit', 'miss']))]
 * const numericResults = results.filter(isNumericResult)
 * // numericResults is now NumericRollResult[]
 */
export function isNumericResult(
  result: RollResult
): result is NumericRollResult {
  return result.type === 'numerical'
}

/**
 * Type guard to check if a roll result is a custom result
 *
 * This function determines whether a roll result contains only custom dice
 * (dice with string faces), allowing for type-safe access to custom-specific properties.
 *
 * @param result - The roll result to check
 * @returns `true` if the result is custom, `false` otherwise
 *
 * @example
 * import { D, roll, isCustomResult } from '@randsum/dice'
 *
 * const result = roll(D(['critical', 'hit', 'miss']))
 * if (isCustomResult(result)) {
 *   // result.total is guaranteed to be a string
 *   console.log(`Outcome: ${result.total}`)
 *   // result.result is guaranteed to be string[]
 *   const outcomes = result.result.join(', ')
 * }
 *
 * @example
 * // Filtering arrays of results
 * const results = [roll('4d6'), roll(D(['heads', 'tails']))]
 * const customResults = results.filter(isCustomResult)
 * // customResults is now CustomRollResult[]
 */
export function isCustomResult(result: RollResult): result is CustomRollResult {
  return result.type === 'custom'
}

/**
 * Type guard to check if a roll result is a mixed result
 *
 * This function determines whether a roll result contains both numeric and custom dice,
 * allowing for type-safe handling of mixed roll scenarios.
 *
 * @param result - The roll result to check
 * @returns `true` if the result is mixed, `false` otherwise
 *
 * @example
 * import { D, roll, isMixedResult } from '@randsum/dice'
 *
 * const result = roll('2d6', D(['hit', 'miss']))
 * if (isMixedResult(result)) {
 *   // result.total is guaranteed to be a string (mixed results always have string totals)
 *   console.log(`Combined result: ${result.total}`)
 *   // result.result is guaranteed to be (string | number)[]
 *   const hasNumbers = result.result.some(r => typeof r === 'number')
 *   const hasStrings = result.result.some(r => typeof r === 'string')
 * }
 *
 * @example
 * // Filtering arrays of results
 * const results = [roll('4d6'), roll('2d6', D(['advantage']))]
 * const mixedResults = results.filter(isMixedResult)
 * // mixedResults is now MixedRollResult[]
 */
export function isMixedResult(result: RollResult): result is MixedRollResult {
  return result.type === 'mixed'
}
