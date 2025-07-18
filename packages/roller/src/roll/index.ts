import type { RollArgument, RollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll(arg: RollArgument): RollResult {
  const parameter = argToParameter(arg)
  const record = generateRollRecord(parameter)
  return {
    rolls: [record],
    total: record.total
  }
}
