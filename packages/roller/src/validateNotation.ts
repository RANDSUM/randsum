import type { ValidationResult } from './types'
import { isDiceNotation } from './isDiceNotation'
import { notationToOptions } from './lib/notation'
import { optionsToDescription, optionsToNotation } from './lib/transformers'

export function validateNotation(notation: string): ValidationResult {
  if (!notation || typeof notation !== 'string') {
    return { valid: false }
  }

  const trimmed = notation.trim()
  if (trimmed === '') {
    return { valid: false }
  }

  // First check if it's valid dice notation
  if (!isDiceNotation(trimmed)) {
    return { valid: false }
  }

  try {
    const options = notationToOptions(trimmed)
    
    if (options.length === 0) {
      return { valid: false }
    }

    const notations: string[] = []
    const descriptions: string[][] = []

    for (let i = 0; i < options.length; i++) {
      const opt = options[i]
      let notation = optionsToNotation(opt)
      // Preserve negative sign for first option if original started with -
      if (i === 0 && trimmed.startsWith('-') && opt.arithmetic === 'subtract') {
        notation = `-${notation}`
      }
      const description = optionsToDescription(opt)
      notations.push(notation)
      descriptions.push(description)
    }

    return {
      valid: true,
      options,
      notation: notations,
      description: descriptions
    }
  } catch {
    return { valid: false }
  }
}

