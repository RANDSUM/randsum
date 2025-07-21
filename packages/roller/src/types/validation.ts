import type { DiceNotation, RollOptions } from './core'

export interface ValidValidationResult {
  valid: true
  argument: DiceNotation
  description: string[][]
  options: RollOptions[]
  notation: DiceNotation[]
}

export interface InvalidValidationResult {
  valid: false
  argument: string
}

export type ValidationResult = ValidValidationResult | InvalidValidationResult
