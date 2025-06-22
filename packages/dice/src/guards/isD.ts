import type { BaseD } from '../types'

// Import the internal base class for instanceof checks
// We need to access the internal DieBase class, but it's not exported
// So we'll check for the presence of the required properties instead

/**
 * Type guard to check if a value is a D (die) instance
 *
 * This function determines whether a given value is an instance of a
 * die object in the RANDSUM system.
 *
 * @param arg - The value to check
 * @returns `true` if the argument is a die instance, `false` otherwise
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
    (arg.type === 'numerical' || arg.type === 'custom')
  )
}

/**
 * Type guard to check if a die is a numeric die
 *
 * @param die - The die to check
 * @returns `true` if the die is numeric, `false` otherwise
 */
export function isNumericDie(die: BaseD): die is import('../types').NumericDie {
  return die.type === 'numerical'
}

/**
 * Type guard to check if a die is a custom die
 *
 * @param die - The die to check
 * @returns `true` if the die is custom, `false` otherwise
 */
export function isCustomDie(die: BaseD): die is import('../types').CustomDie {
  return die.type === 'custom'
}
