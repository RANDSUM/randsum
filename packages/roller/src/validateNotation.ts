import type { RollOptions } from './types'
import { isDiceNotation } from './isDiceNotation'
import { notationToOptions } from './lib/notation'
import { optionsToNotation, optionsToDescription } from './lib/transformers'

/**
 * Result of notation validation
 */
export type ValidateNotationResult =
  | {
      valid: true
      options: RollOptions[]
      notation: string[]
      description: string[][]
    }
  | {
      valid: false
      error?: string
    }

/**
 * Validate and parse dice notation
 * 
 * Checks if a notation string is valid and returns detailed information
 * about the parsed notation including options, notation, and descriptions.
 * 
 * @param notation - The dice notation string to validate
 * @returns A validation result with parsed information or error
 * 
 * @example
 * ```typescript
 * const result = validateNotation("4d6L+3")
 * 
 * if (result.valid) {
 *   console.log(result.options)      // [{ sides: 6, quantity: 4, ... }]
 *   console.log(result.notation)     // ["4d6L+3"]
 *   console.log(result.description)  // [["Roll 4 6-sided dice", "Drop lowest", ...]]
 * }
 * ```
 */
export function validateNotation(notation: string): ValidateNotationResult {
  // Check if it's valid dice notation
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      error: 'Invalid dice notation format'
    }
  }
  
  try {
    // Parse the notation
    const options = notationToOptions(notation)
    
    // Generate notation and descriptions for each option
    const notations: string[] = []
    const descriptions: string[][] = []
    
    for (const option of options) {
      const generatedNotation = optionsToNotation(option)
      const description = optionsToDescription(option)
      
      notations.push(generatedNotation)
      descriptions.push(description)
    }
    
    return {
      valid: true,
      options,
      notation: notations,
      description: descriptions
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

