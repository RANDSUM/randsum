import type { DiceNotation, RollArgument, RollOptions } from './core'
import type { ModifierLog } from './modifiers'

export interface ModifierHistory {
  modifiedRolls: number[]
  total: number
  initialRolls: number[]
  logs: ModifierLog[]
}

export interface RollParams extends RollOptions {
  arithmetic: 'add' | 'subtract'
  argument: RollArgument
  description: string[]
  notation: DiceNotation
}

export interface RollRecord {
  description: RollParams['description']
  parameters: RollParams
  rolls: number[]
  modifierHistory: ModifierHistory
  total: number
}

export interface RollResult<TResult = number, TRollRecord = RollerRollResult> {
  rolls: TRollRecord[]
  result: TResult
}

export interface RollerRollResult extends RollResult<number, RollRecord> {
  total: number
}
