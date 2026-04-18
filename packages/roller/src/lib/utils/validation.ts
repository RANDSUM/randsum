import { ValidationError } from '../../errors'

/**
 * Upper bound for the number of dice in a single pool.
 * Protects against unbounded allocation / CPU from user-supplied `quantity`.
 */
export const MAX_QUANTITY = 10000

/**
 * Upper bound for the number of sides on a die.
 * Protects against unbounded ranges in downstream modifier logic and RNG.
 */
export const MAX_SIDES = 1_000_000

export function validateInteger(value: number, name: string): asserts value is number {
  if (!Number.isInteger(value)) {
    throw new ValidationError(`${name} must be an integer, received: ${value}`)
  }
}

export function validateMaxQuantity(value: number): void {
  if (value > MAX_QUANTITY) {
    throw new ValidationError(`quantity ${value} exceeds maximum of ${MAX_QUANTITY}`)
  }
}

export function validateMaxSides(value: number): void {
  if (value > MAX_SIDES) {
    throw new ValidationError(`sides ${value} exceeds maximum of ${MAX_SIDES}`)
  }
}

export function validateRange(value: number, min: number, max: number, name: string): void {
  if (value < min || value > max) {
    throw new ValidationError(`${name} must be between ${min} and ${max}, received: ${value}`)
  }
}

export function validateNonNegative(value: number, name: string): void {
  if (value < 0) {
    throw new ValidationError(`${name} must be non-negative, received: ${value}`)
  }
}

export function validateFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new ValidationError(`${name} must be a finite number, received: ${value}`)
  }
}

export function validateGreaterThan(value: number, threshold: number, name: string): void {
  if (value <= threshold) {
    throw new ValidationError(`${name} must be greater than ${threshold}, received: ${value}`)
  }
}
