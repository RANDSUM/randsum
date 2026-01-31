import type { RandomFn } from '../../lib/random'
import type { RollParams, RollRecord } from '../../types'
import { executeRollPipeline } from '../RollPipeline'

/**
 * Generate a complete roll record for a single set of parameters.
 *
 * This function delegates to the RollPipeline for execution.
 * Use RollPipeline directly if you need access to intermediate state.
 *
 * @param parameters - Fully resolved roll parameters
 * @param rng - Optional custom random function
 * @returns Complete roll record
 */
export function generateRollRecord<T>(parameters: RollParams<T>, rng?: RandomFn): RollRecord<T> {
  return executeRollPipeline(parameters, rng)
}
