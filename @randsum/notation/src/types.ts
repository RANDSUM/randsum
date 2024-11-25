import { type RollConfig } from '@randsum/core'

export type NotationValidationResult = {
  valid: boolean
  notation: DiceNotation | string
  config: RollConfig | undefined
  description: string[] | undefined
}

export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`
