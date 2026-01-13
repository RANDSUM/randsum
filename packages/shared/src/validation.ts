// Validation utilities for RANDSUM packages

/**
 * Asserts that a value is an integer.
 *
 * @param value - Value to validate
 * @param name - Name of the parameter for error messages
 * @throws Error if value is not an integer
 *
 * @example
 * ```ts
 * validateInteger(5, "count") // OK
 * validateInteger(5.5, "count") // Throws error
 * ```
 */
export function validateInteger(value: number, name: string): asserts value is number {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer, received: ${value}`)
  }
}

/**
 * Validates that a value is within a specified range.
 *
 * @param value - Value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param name - Name of the parameter for error messages
 * @throws Error if value is outside the range
 *
 * @example
 * ```ts
 * validateRange(5, 1, 10, "bonus") // OK
 * validateRange(15, 1, 10, "bonus") // Throws error
 * ```
 */
export function validateRange(value: number, min: number, max: number, name: string): void {
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}, received: ${value}`)
  }
}

/**
 * Validates that a value is non-negative (>= 0).
 *
 * @param value - Value to validate
 * @param name - Name of the parameter for error messages
 * @throws Error if value is negative
 *
 * @example
 * ```ts
 * validateNonNegative(5, "count") // OK
 * validateNonNegative(-1, "count") // Throws error
 * ```
 */
export function validateNonNegative(value: number, name: string): void {
  if (value < 0) {
    throw new Error(`${name} must be non-negative, received: ${value}`)
  }
}

/**
 * Validates that a value is a finite number (not Infinity or NaN).
 *
 * @param value - Value to validate
 * @param name - Name of the parameter for error messages
 * @throws Error if value is not finite
 *
 * @example
 * ```ts
 * validateFinite(5, "bonus") // OK
 * validateFinite(Infinity, "bonus") // Throws error
 * ```
 */
export function validateFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number, received: ${value}`)
  }
}

export function validateGreaterThan(value: number, threshold: number, name: string): void {
  if (value <= threshold) {
    throw new Error(`${name} must be greater than ${threshold}, received: ${value}`)
  }
}

export function validateLessThan(value: number, threshold: number, name: string): void {
  if (value >= threshold) {
    throw new Error(`${name} must be less than ${threshold}, received: ${value}`)
  }
}
