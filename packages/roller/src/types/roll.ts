import type { DiceNotation, RollArgument, RollOptions } from './core'
import type { ModifierLog } from './modifiers'

export interface RollParams<T = string> extends RollOptions<T> {
  quantity: number
  sides: number
  faces?: T[]
  arithmetic: 'add' | 'subtract'
  key?: string
  argument: RollArgument<T>
  description: string[]
  notation: DiceNotation
}

export interface RollRecord<T = string> {
  description: RollParams<T>['description']
  parameters: RollParams<T>
  rolls: number[]
  modifierHistory: {
    modifiedRolls: number[]
    total: number
    initialRolls: number[]
    logs: ModifierLog[]
  }
  appliedTotal: number
  customResults?: T[]
  total: number
}

export interface RollResult<TResult = number, TRollRecord = RollRecord> {
  rolls: TRollRecord[]
  result: TResult
}

export interface RollerRollResult<T = string>
  extends RollResult<T[], RollRecord<T>> {
  total: number
}
