import type { ModifierOptions } from './modifiers'

export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`

export interface BaseRollOptions {
  quantity?: number
}

export interface RollOptions {
  quantity?: number
  sides: number
  modifiers?: ModifierOptions
}

export type RequiredNumericRollParameters = Required<
  Omit<RollOptions, 'modifiers'>
>

export type RollArgument = RollOptions | DiceNotation | number | `${number}`
