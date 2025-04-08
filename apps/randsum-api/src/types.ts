/**
 * Query parameters for the roll endpoint
 */
export interface RollQueryParams {
  /** Dice notation string (e.g., "2d20", "4d6L") */
  notation?: string
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string
  status: number
}
