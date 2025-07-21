import type { ModifierOptions } from './modifiers'

export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`

export interface RollOptions<T = string> {
  quantity?: number
  arithmetic?: 'add' | 'subtract'
  sides: number | T[]
  modifiers?: ModifierOptions
}

export type RequiredNumericRollParameters = Pick<
  RollOptions,
  'quantity' | 'sides'
> & {
  quantity: number
  sides: number
}

export type RollArgument<T = string> =
  | RollOptions<T>
  | DiceNotation
  | number
  | `${number}`
