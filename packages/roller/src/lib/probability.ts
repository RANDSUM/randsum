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
  // For now, use Monte Carlo simulation
  // In the future, could add analytical calculation for simple cases
  const results: number[] = []

  for (let i = 0; i < samples; i++) {
    const result = roll(notation)
    results.push(result.total)
  }

  // Calculate statistics
  results.sort((a, b) => a - b)
  const min = results[0] ?? 0
  const max = results[results.length - 1] ?? 0

  // Mean
  const sum = results.reduce((acc, val) => acc + val, 0)
  const mean = sum / results.length

  // Median
  const mid = Math.floor(results.length / 2)
  const median =
    results.length % 2 === 0
      ? ((results[mid - 1] ?? 0) + (results[mid] ?? 0)) / 2
      : (results[mid] ?? 0)

  // Standard deviation
  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / results.length
  const standardDeviation = Math.sqrt(variance)

  // Mode (most frequent value)
  const frequency = new Map<number, number>()
  for (const value of results) {
    frequency.set(value, (frequency.get(value) ?? 0) + 1)
  }
  let maxFreq = 0
  let mode = min
  for (const [value, freq] of frequency.entries()) {
    if (freq > maxFreq) {
      maxFreq = freq
      mode = value
    }
  }

  // Distribution (probability for each value)
  const distribution = new Map<number, number>()
  for (const [value, freq] of frequency.entries()) {
    distribution.set(value, freq / results.length)
  }

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
