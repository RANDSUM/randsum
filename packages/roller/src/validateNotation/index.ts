import { OptionsConverter } from '../lib/utils'
import { isDiceNotation } from '../isDiceNotation'
import type { ValidationResult } from '../types'
import { notationToOptions } from './notationToOptions'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      options: {}
    }
  }

  const options = notationToOptions(notation)
  const converter = new OptionsConverter(options)
  return {
    valid: true,
    options,
    notation: converter.toNotation,
    description: converter.toDescription
  }
}
