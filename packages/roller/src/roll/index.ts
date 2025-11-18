import type { RollOptions, RollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

/**
 * Roll dice with the specified parameters
 * 
 * This is the main entry point for rolling dice. It accepts multiple arguments
 * in various formats (numbers, strings, or RollOptions objects) and returns
 * a complete result with totals, individual rolls, and descriptions.
 * 
 * @param args - Any number of roll arguments
 * @returns A RollResult with totals and detailed roll information
 * 
 * @example
 * ```typescript
 * // Simple number argument
 * roll(20) // Roll 1d20
 * 
 * // Dice notation string
 * roll("4d6L") // Roll 4d6, drop lowest
 * 
 * // RollOptions object
 * roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })
 * 
 * // Multiple arguments
 * roll("1d20", "2d6", 20) // Roll 1d20, 2d6, and 1d20
 * 
 * // Multi-dice notation
 * roll("1d20+2d6-1d8") // Roll 1d20, add 2d6, subtract 1d8
 * ```
 */
export function roll(
  ...args: (number | string | RollOptions)[]
): RollResult {
  // Convert all arguments to parameters
  const allParams = args.flatMap((arg, index) => argToParameter(arg, index + 1))
  
  // Generate roll records for each parameter set
  const rolls = allParams.map(params => generateRollRecord(params))
  
  // Calculate grand total based on arithmetic operations
  let grandTotal = 0
  
  for (const record of rolls) {
    if (record.parameters.arithmetic === 'subtract') {
      grandTotal -= record.total
    } else {
      grandTotal += record.total
    }
  }
  
  // Build result array (for custom faces or numeric results)
  const result: (number | string)[] = []
  
  for (const record of rolls) {
    if (record.parameters.faces) {
      // Map numeric rolls to custom faces
      for (const roll of record.modifierHistory.modifiedRolls) {
        const faceIndex = roll - 1
        if (faceIndex >= 0 && faceIndex < record.parameters.faces.length) {
          result.push(record.parameters.faces[faceIndex]!)
        }
      }
    } else {
      // Add numeric rolls
      result.push(...record.modifierHistory.modifiedRolls)
    }
  }
  
  // Build notation and description
  const notation = rolls.map(r => r.parameters.notation).join('')
  const description = rolls.flatMap(r => r.parameters.description)
  
  return {
    total: grandTotal,
    result,
    rolls,
    notation,
    description
  }
}

