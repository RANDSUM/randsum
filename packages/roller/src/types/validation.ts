import type { DiceNotation, RollOptions } from './core'

export interface ValidValidationResult {
  valid: true
  description: string[]
  options: RollOptions
  notation: DiceNotation
}

export interface InvalidValidationResult {
  valid: false
  description: string[]
  options: Record<string, never>
}

export type ValidationResult = ValidValidationResult | InvalidValidationResult
