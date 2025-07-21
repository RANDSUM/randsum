import type { DiceNotation, RollArgument, RollOptions } from './core'
import type { ModifierLog } from './modifiers'

export interface RollParams extends RollOptions {
  quantity: number
  sides: number
  arithmetic: 'add' | 'subtract'
  key?: string
  argument: RollArgument
  description: string[]
  notation: DiceNotation
}

export interface RollRecord {
  description: RollParams['description']
  parameters: RollParams
  rolls: number[]
  modifierHistory: {
    modifiedRolls: number[]
    total: number
    initialRolls: number[]
    logs: ModifierLog[]
  }
  appliedTotal: number
  customResults?: string[]
  total: number
}

export interface RollResult<TResult = number, TRollRecord = RollRecord> {
  rolls: TRollRecord[]
  result: TResult
}

export interface RollerRollResult extends RollResult<string[]> {
  total: number
}
