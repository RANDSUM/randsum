import { optionsConverter } from '@randsum/core'
import { isDiceNotation } from './isDiceNotation'
import type { ValidationResult } from './types'
import { notationToOptions } from './utils/notationToOptions'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      digested: {},
      type: 'invalid'
    }
  }

  const digested = notationToOptions(notation)

  const dieType = caclulateDieType(digested.sides)

  const hasCustomFaces = dieType === 'custom'
  const hasModifiers =
    digested.modifiers && Object.keys(digested.modifiers).length > 0

  if (hasCustomFaces && hasModifiers) {
    return {
      valid: false,
      description: ['Custom dice faces cannot be used with modifiers'],
      digested: {},
      type: 'invalid'
    }
  }

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
