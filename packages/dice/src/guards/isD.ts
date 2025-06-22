import type { BaseD } from '../types'

/**
 * Type guard to check if a value is a D (die) instance
 *
 * This function determines whether a given value is an instance of a
 * die object in the RANDSUM system by checking for the required properties
 * and methods that define a die.
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
 * isD(D(6)) // true
 */
export function isD(arg: unknown): arg is BaseD {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    'type' in arg &&
    'sides' in arg &&
    'faces' in arg &&
    'isCustom' in arg &&
    'roll' in arg &&
    'rollSpread' in arg &&
    'rollModified' in arg &&
    'toOptions' in arg &&
    (arg.type === 'numerical' || arg.type === 'custom') &&
    typeof arg.sides === 'number' &&
    Array.isArray(arg.faces) &&
    typeof arg.isCustom === 'boolean' &&
    typeof arg.roll === 'function' &&
    typeof arg.rollSpread === 'function' &&
    typeof arg.rollModified === 'function'
  )
}
