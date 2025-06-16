import { D } from '../D'
import type { BaseD } from '../types'

/**
 * Type guard to check if a value is a D (die) instance
 *
 * This function determines whether a given value is an instance of the
 * D class, which represents a die object in the RANDSUM system.
 *
 * @param arg - The value to check
 * @returns `true` if the argument is a D instance, `false` otherwise
 *
 * @example
 * import { D6, isD } from '@randsum/dice'
 *
 * isD(D6) // true
 * isD(6) // false
 * isD('4d6') // false
 * isD(new D(6)) // true
 */
export function isD(arg: unknown): arg is BaseD<string[] | number> {
  return arg instanceof D
}
