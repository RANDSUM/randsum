import type { RollOptions } from './types'
import { notationToOptions } from './lib/notation'
import { optionsToDescription, optionsToNotation } from './lib/transformers'
import { isDiceNotation } from './isDiceNotation'

export interface ValidNotationResult {
  valid: true
  options: RollOptions[]
  notation: string[]
  description: string[]
}

export interface InvalidNotationResult {
  valid: false
}

export type ValidateNotationResult = ValidNotationResult | InvalidNotationResult

export function validateNotation(input: string): ValidateNotationResult {
  if (!isDiceNotation(input)) {
    return { valid: false }
  }

  const options = notationToOptions(input)
  if (!options.length) return { valid: false }

  const notation = options.map(optionsToNotation)
  const description = options.map(opt => optionsToDescription(opt).join(' '))

  return {
    valid: true,
    options,
    notation,
    description
  }
}


