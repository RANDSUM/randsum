import { type RollConfig } from '@randsum/core'

export interface NotationValidationResult<V = boolean> {
  valid: V
  notation: V extends true ? DiceNotation : undefined
  config: V extends true ? RollConfig : undefined
  description: V extends true ? string[] : undefined
}

export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`
