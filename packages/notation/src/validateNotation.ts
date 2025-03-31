import { optionsConverter } from '@randsum/core'
import { isDiceNotation } from './isDiceNotation'
import type { ValidationResult } from './types'
import { notationToOptions } from './utils/notationToOptions'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: [],
      digested: {},
      type: 'invalid'
    }
  }

  const digested = notationToOptions(notation)

  return {
    valid: true,
    digested,
    notation: optionsConverter.toNotation(digested),
    type: caclulateDieType(digested.sides),
    description: optionsConverter.toDescription(digested)
  } as ValidationResult
}

function caclulateDieType(sides: number | string[]): 'custom' | 'numerical' {
  if (Array.isArray(sides)) {
    return 'custom'
  }
  return 'numerical'
}
