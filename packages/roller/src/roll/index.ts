import type { RollArgument, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll(...args: RollArgument[]): RollerRollResult {
  if (args.length === 0) {
    throw new Error('At least one argument is required')
  }

  // Handle single string with multiple dice notation
  if (args.length === 1 && typeof args[0] === 'string') {
    const notation = args[0].trim()
    // Check if it contains multiple dice (has + or - separating dice)
    const hasMultipleDice = /[\+\-]\d+d/i.test(notation)
    
    if (hasMultipleDice) {
      // Parse as single string with multiple dice
      const params = argToParameter(notation, 1)
      const rolls = params.map(param => generateRollRecord(param))
      
      let total = 0
      for (const rollRecord of rolls) {
        if (rollRecord.parameters.arithmetic === 'subtract') {
          total -= rollRecord.total
        } else {
          total += rollRecord.total
        }
      }

      return {
        total,
        rolls,
        result: rolls.length > 0 && rolls[0].result ? rolls.flatMap(r => r.result || []) : undefined
      }
    }
  }

  // Handle multiple arguments or single argument
  const allParams: ReturnType<typeof argToParameter>[number][] = []
  args.forEach((arg, index) => {
    const params = argToParameter(arg, index + 1)
    allParams.push(...params)
  })

  const rolls = allParams.map(param => generateRollRecord(param))

  let total = 0
  for (const rollRecord of rolls) {
    if (rollRecord.parameters.arithmetic === 'subtract') {
      total -= rollRecord.total
    } else {
      total += rollRecord.total
    }
  }

  return {
    total,
    rolls,
    result: rolls.length > 0 && rolls[0].result ? rolls.flatMap(r => r.result || []) : undefined
  }
}

