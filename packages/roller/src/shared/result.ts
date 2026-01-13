// Result type utilities for RANDSUM packages

/**
 * Discriminated union type for operations that can succeed or fail.
 *
 * @template T - Type of the success data
 * @template E - Type of the error (defaults to Error)
 *
 * @example
 * ```ts
 * const result: Result<number> = success(42)
 * if (isSuccess(result)) {
 *   console.log(result.data) // TypeScript knows this is number
 * }
 * ```
 */
export type Result<T, E = Error> = SuccessResult<T> | ErrorResult<E>

export interface SuccessResult<T> {
  success: true
  data: T
}

export interface ErrorResult<E> {
  success: false
  error: E
}

/**
 * Type guard to check if a Result is a success.
 *
 * @param result - Result to check
 * @returns True if result is successful
 *
 * @example
 * ```ts
 * const result = someOperation()
 * if (isSuccess(result)) {
 *   // TypeScript narrows to SuccessResult<T>
 *   console.log(result.data)
 * }
 * ```
 */
export function isSuccess<T, E>(result: Result<T, E>): result is SuccessResult<T> {
  return result.success
}

/**
 * Type guard to check if a Result is an error.
 *
 * @param result - Result to check
 * @returns True if result is an error
 *
 * @example
 * ```ts
 * const result = someOperation()
 * if (isError(result)) {
 *   // TypeScript narrows to ErrorResult<E>
 *   console.error(result.error)
 * }
 * ```
 */
export function isError<T, E>(result: Result<T, E>): result is ErrorResult<E> {
  return !result.success
}

/**
 * Creates a successful Result.
 *
 * @param data - The success data
 * @returns A SuccessResult containing the data
 *
 * @example
 * ```ts
 * const result = success(42)
 * ```
 */
export function success<T>(data: T): SuccessResult<T> {
  return { success: true, data }
}

/**
 * Creates an error Result.
 *
 * @param error - The error value
 * @returns An ErrorResult containing the error
 *
 * @example
 * ```ts
 * const result = error(new Error("Something went wrong"))
 * ```
 */
export function error<E>(error: E): ErrorResult<E> {
  return { success: false, error }
}
