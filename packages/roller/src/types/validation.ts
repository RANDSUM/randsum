import type { DiceNotation, RollOptions } from './core'

interface BaseValidationResult {
  valid: boolean
  description: string[]
}

export interface ValidValidationResult extends BaseValidationResult {
  valid: true
  digested: RollOptions
  notation: DiceNotation
}

export interface InvalidValidationResult extends BaseValidationResult {
  valid: false
  digested: Record<string, never>
}

export type ValidationResult = ValidValidationResult | InvalidValidationResult
