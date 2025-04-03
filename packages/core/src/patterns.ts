/**
 * @file Regular expression patterns for parsing dice notation
 * @module @randsum/core/patterns
 */

/**
 * Pattern to match drop highest notation
 *
 * Matches 'H' or 'h' optionally followed by a number
 *
 * @example
 * // Matches: 'H', 'h', 'H1', 'h2', etc.
 * // In notation: '2d20H' - Roll 2d20 and drop the highest
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const dropHighestPattern: RegExp = /[Hh]\d*/g

/**
 * Pattern to match drop lowest notation
 *
 * Matches 'L' or 'l' optionally followed by a number
 *
 * @example
 * // Matches: 'L', 'l', 'L1', 'l2', etc.
 * // In notation: '2d20L' - Roll 2d20 and drop the lowest
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const dropLowestPattern: RegExp = /[Ll]\d*/g

/**
 * Pattern to match unique dice notation
 *
 * Matches 'U' or 'u' optionally followed by a list of numbers in curly braces
 *
 * @example
 * // Matches: 'U', 'u', 'U{1}', 'U{1,2}', etc.
 * // In notation: '4d6U' - Roll 4d6 with unique values
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const uniquePattern: RegExp = /[Uu]({(\d+,)*(\d+)})?/g

/**
 * Pattern to match plus modifier notation
 *
 * Matches '+' followed by one or more digits
 *
 * @example
 * // Matches: '+1', '+20', etc.
 * // In notation: '1d20+5' - Roll 1d20 and add 5
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const plusPattern: RegExp = /\+\d+/g

/**
 * Pattern to match minus modifier notation
 *
 * Matches '-' followed by one or more digits
 *
 * @example
 * // Matches: '-1', '-20', etc.
 * // In notation: '1d20-2' - Roll 1d20 and subtract 2
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const minusPattern: RegExp = /-\d+/g

/**
 * Pattern to match exploding dice notation
 *
 * Matches '!' character
 *
 * @example
 * // Matches: '!'
 * // In notation: '3d6!' - Roll 3d6 with exploding dice
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const explodePattern: RegExp = /!/g

/**
 * Core pattern for matching greater than or less than expressions
 *
 * @private
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
const coreGreaterLessThan: RegExp = /[<>]?\d+/

/**
 * Core pattern for matching greater/less than or equals expressions
 *
 * @private
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
const coreGreaterLessThanEquals: RegExp = new RegExp(
  coreGreaterLessThan.source + /=?\d+/.source
)

/**
 * Creates a repeated pattern with curly braces for lists of values
 *
 * @param core - The core pattern to repeat
 * @returns A new RegExp that matches the core pattern in curly braces
 * @private
 */
function createRepeatedPattern(core: RegExp): RegExp {
  return new RegExp(`{(${core.source},)*(${core.source})}`, 'g')
}

/**
 * Pattern for matching greater/less than equality expressions in curly braces
 *
 * @private
 */
const greaterThanLessEqualityThanMatcher: RegExp = createRepeatedPattern(
  coreGreaterLessThanEquals
)

/**
 * Pattern to match replace modifier notation
 *
 * Matches 'V' or 'v' followed by a list of replacement rules in curly braces
 *
 * @example
 * // Matches: 'V{1=2}', 'v{>18=18}', etc.
 * // In notation: '3d6V{1=2}' - Roll 3d6 and replace all 1s with 2s
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const replacePattern: RegExp = new RegExp(
  /[Vv]/.source + greaterThanLessEqualityThanMatcher.source,
  'g'
)

/**
 * Pattern for matching greater/less than expressions in curly braces
 *
 * @private
 */
const greaterThanLessThanMatcher: RegExp =
  createRepeatedPattern(coreGreaterLessThan)

/**
 * Pattern to match drop constraints notation
 *
 * Matches 'D' or 'd' followed by a list of constraints in curly braces
 *
 * @example
 * // Matches: 'D{1}', 'd{>3}', 'D{<2,4}', etc.
 * // In notation: '4d6D{1}' - Roll 4d6 and drop any 1s
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const dropConstraintsPattern: RegExp = new RegExp(
  /[Dd]/.source + greaterThanLessThanMatcher.source,
  'g'
)

/**
 * Pattern to match reroll notation
 *
 * Matches 'R' or 'r' followed by constraints and an optional max reroll count
 *
 * @example
 * // Matches: 'R{1}', 'r{<3}2', etc.
 * // In notation: '3d6R{1}' - Roll 3d6 and reroll any 1s
 * // In notation: '3d6R{<3}2' - Roll 3d6 and reroll any values less than 3, up to 2 times
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const rerollPattern: RegExp = new RegExp(
  `${/[Rr]/.source}${greaterThanLessThanMatcher.source}${/\d*/.source}`,
  'g'
)

/**
 * Pattern to match cap notation
 *
 * Matches 'C' or 'c' followed by a list of constraints in curly braces
 *
 * @example
 * // Matches: 'C{>18}', 'c{<2}', etc.
 * // In notation: '3d20C{>18}' - Roll 3d20 and cap any values greater than 18 at 18
 */
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const capPattern: RegExp = new RegExp(
  `${/[Cc]/.source}${greaterThanLessThanMatcher.source}`,
  'g'
)
