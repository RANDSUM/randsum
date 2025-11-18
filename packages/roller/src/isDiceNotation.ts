import { coreNotationPattern, completeRollPattern } from './lib/patterns'

/**
 * Check if a value is valid dice notation
 * 
 * Validates that:
 * 1. The input is a string
 * 2. It contains valid core dice notation (XdY)
 * 3. All components match the complete roll pattern
 * 4. No extraneous characters remain after parsing
 * 
 * @param value - The value to check
 * @returns true if the value is valid dice notation
 * 
 * @example
 * ```typescript
 * isDiceNotation("1d6")        // true
 * isDiceNotation("4d6L")       // true
 * isDiceNotation("1d20+2d6")   // true
 * isDiceNotation("hello")      // false
 * isDiceNotation(42)           // false
 * isDiceNotation({ sides: 6 }) // false
 * ```
 */
export function isDiceNotation(value: unknown): value is string {
  // Must be a string
  if (typeof value !== 'string') {
    return false
  }
  
  // Trim whitespace
  const trimmed = value.trim()
  
  // Must not be empty after trimming
  if (!trimmed) {
    return false
  }
  
  // Remove all whitespace for validation
  const cleanValue = trimmed.replace(/\s/g, '')
  
  // Must contain at least one core dice notation pattern
  if (!coreNotationPattern.test(cleanValue)) {
    return false
  }
  
  // Extract all valid components
  const matches = cleanValue.match(completeRollPattern)
  
  if (!matches) {
    return false
  }
  
  // Reconstruct the notation from matches
  const reconstructed = matches.join('')
  
  // The reconstructed notation should match the original (no extra characters)
  return reconstructed === cleanValue
}

