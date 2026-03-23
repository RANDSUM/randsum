import { ValidationError } from '../../errors'

export function validateInteger(value: number, name: string): asserts value is number {
  if (!Number.isInteger(value)) {
    throw new ValidationError(`${name} must be an integer, received: ${value}`)
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
