import type { ModifierOptions } from './modifiers'

export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`

export interface RollOptions {
  quantity?: number
  arithmetic?: 'add' | 'subtract'
  sides: number | string[]
  modifiers?: ModifierOptions
}

export interface RequiredNumericRollParameters {
  quantity: number
  sides: number
}

export type RollArgument = RollOptions | DiceNotation | number | `${number}`
