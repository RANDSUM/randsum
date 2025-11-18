import type { RollOptions, RollParams, RollRecord } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export interface RollResult<T = number | string> {
  total: number
  rolls: RollRecord[]
  result: T[]
}

export function roll(
  ...args: Array<number | string | RollOptions>
): RollResult<any> {
  const allParams: RollParams[] = []
  args.forEach((arg, index) => {
    allParams.push(...argToParameter(arg as any, index))
  })

  const records = allParams.map(generateRollRecord)

  const total = records.reduce((sum, rec) => {
    return rec.parameters.arithmetic === 'subtract'
      ? sum - rec.total
      : sum + rec.total
  }, 0)

  // Flatten numeric results or map to faces if needed
  const result: any[] = []
  for (const rec of records) {
    const faces = rec.parameters.faces
    if (faces && faces.length) {
      // Map modifiedRolls to faces by index (1-based)
      rec.modifierHistory.modifiedRolls.forEach(value => {
        const face = faces[value - 1]
        result.push(face ?? value)
      })
    } else {
      result.push(...rec.modifierHistory.modifiedRolls)
    }
  }

  return {
    total,
    rolls: records,
    result
  }
}


