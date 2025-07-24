import type { DiceNotation, RollArgument, RollOptions } from './core'
import type { NumericRollBonus } from './modifiers'

export interface RollParams<T = string> extends Required<Omit<RollOptions<T>, 'sides'>> {
  sides: number
  faces?: T[]
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
    logs: NumericRollBonus['logs']
    modifiedRolls: number[]
    total: number
    initialRolls: number[]
  }
  appliedTotal: number
  customResults?: T[]
  total: number
}

export interface RollResult<TResult = number, TRollRecord = RollRecord> {
  rolls: TRollRecord[]
  result: TResult
}

export interface RollerRollResult<T = string> extends RollResult<T[], RollRecord<T>> {
  total: number
}
