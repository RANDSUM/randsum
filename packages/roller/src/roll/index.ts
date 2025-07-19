import type { RollArgument, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll(arg: RollArgument): RollerRollResult {
  const parameter = argToParameter(arg)
  const record = generateRollRecord(parameter)
  return {
    rolls: [record],
    result: record.total,
    total: record.total
  }
}
