// Error types for RANDSUM packages

/**
 * Base error class for all RANDSUM errors.
 * All custom errors in the RANDSUM ecosystem should extend this class.
 */
export class RandsumError extends Error {
  public readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'RandsumError'
    this.code = code
  }
}
