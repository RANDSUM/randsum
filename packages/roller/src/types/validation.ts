import type { DiceNotation, RollOptions } from './core'

interface BaseValidationResult {
  valid: boolean
  description: string[]
}

export interface ValidValidationResult extends BaseValidationResult {
  valid: true
  options: RollOptions
  notation: DiceNotation
}

export interface InvalidValidationResult extends BaseValidationResult {
  valid: false
  options: Record<string, never>
}

export type ValidationResult = ValidValidationResult | InvalidValidationResult
