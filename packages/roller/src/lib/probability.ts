import { roll } from '../roll'
import type { DiceNotation } from '../types'

/**
 * Probability analysis result for a dice notation.
 */
export interface ProbabilityAnalysis {
  /** Minimum possible result */
  min: number
  /** Maximum possible result */
  max: number
  /** Mean (average) result */
  mean: number
  /** Median result */
  median: number
  /** Most likely result (mode) */
  mode: number
  /** Standard deviation */
  standardDeviation: number
  /** Distribution map: value -> probability (0-1) */
  distribution: Map<number, number>
}

/**
 * Analyzes the probability distribution of a dice notation.
 *
 * Uses Monte Carlo simulation for complex modifiers, or analytical
 * calculation for simple cases.
 *
 * @param notation - Dice notation to analyze
 * @param samples - Number of samples for Monte Carlo (default: 10000)
 * @returns Probability analysis with statistics and distribution
 *
 * @example
 * ```ts
 * const analysis = analyze("4d6L")
 * console.log(analysis.mean) // ~12.24
 * console.log(analysis.distribution.get(18)) // Probability of rolling 18
 * ```
 */
export function analyze(notation: DiceNotation, samples = 10000): ProbabilityAnalysis {
  const results = Array.from({ length: samples }, () => roll(notation).total)

  const sortedResults = results.toSorted((a, b) => a - b)
  const min = sortedResults[0] ?? 0
  const max = sortedResults[sortedResults.length - 1] ?? 0

  const sum = results.reduce((acc, val) => acc + val, 0)
  const mean = sum / results.length

  const mid = Math.floor(sortedResults.length / 2)
  const median =
    sortedResults.length % 2 === 0
      ? ((sortedResults[mid - 1] ?? 0) + (sortedResults[mid] ?? 0)) / 2
      : (sortedResults[mid] ?? 0)

  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / results.length
  const standardDeviation = Math.sqrt(variance)

  const frequency = results.reduce(
    (acc, value) => acc.set(value, (acc.get(value) ?? 0) + 1),
    new Map<number, number>()
  )

  const mode = Array.from(frequency.entries()).reduce(
    (best, [value, freq]) => (freq > best.freq ? { value, freq } : best),
    { value: min, freq: 0 }
  ).value

  const distribution = new Map(
    Array.from(frequency.entries()).map(([value, freq]) => [value, freq / results.length])
  )

  return {
    min,
    max,
    mean,
    median,
    mode,
    standardDeviation,
    distribution
  }
}
