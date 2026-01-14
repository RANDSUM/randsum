import type { RollArgument, RollConfig, RollerRollResult } from '../types'
import type { Result } from '../lib/result'
import { error, success } from '../lib/result'
import { RollError } from '../errors'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

/**
 * Type guard to check if an argument is a RollConfig object.
 * RollConfig has randomFn but not sides/quantity, distinguishing it from RollOptions.
 */
function isRollConfig(arg: unknown): arg is RollConfig {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    'randomFn' in arg &&
    !('sides' in arg) &&
    !('quantity' in arg)
  )
}

/**
 * Rolls dice according to RANDSUM notation.
 *
 * Accepts multiple roll arguments and an optional configuration object. Each argument
 * can be a dice notation string, a number (sides), or a roll options object.
 *
 * @param args - One or more roll arguments (notation strings, numbers, or options objects),
 *               optionally followed by a RollConfig object
 * @returns Roll result containing individual rolls, total, and result array
 *
 * @example Basic roll
 * ```ts
 * const result = roll("2d6")
 * console.log(result.total) // Sum of 2d6
 * ```
 *
 * @example D&D ability score
 * ```ts
 * const result = roll("4d6L") // 4d6 drop lowest
 * ```
 *
 * @example With custom RNG
 * ```ts
 * const seeded = createSeededRandom(42)
 * const result = roll("1d20", { randomFn: seeded })
 * ```
 *
 * @example Multiple rolls
 * ```ts
 * const result = roll("1d20+5", "2d6+3")
 * // Returns combined total of both rolls
 * ```
 */
export function roll<T = string>(...args: RollArgument<T>[]): RollerRollResult<T>
export function roll<T = string>(...args: [...RollArgument<T>[], RollConfig]): RollerRollResult<T>
export function roll<T = string>(
  ...args: RollArgument<T>[] | [...RollArgument<T>[], RollConfig]
): RollerRollResult<T> {
  // Extract config if last arg is RollConfig (has randomFn but not sides/quantity)
  const lastArg = args[args.length - 1]
  let config: RollConfig | undefined
  let rollArgs: RollArgument<T>[]

  if (lastArg !== undefined && isRollConfig(lastArg)) {
    config = lastArg
    // After the type guard, we know the slice contains only RollArgument<T>
    const sliced = args.slice(0, -1)
    rollArgs = sliced as RollArgument<T>[]
  } else {
    // All args are roll arguments
    rollArgs = args as RollArgument<T>[]
  }

  const parameters = rollArgs.flatMap((arg, index) => argToParameter(arg, index + 1))
  const rolls = parameters.map(parameter => generateRollRecord(parameter, config?.randomFn))
  const total = rolls.reduce((acc, cur) => {
    const factor = cur.parameters.arithmetic === 'subtract' ? -1 : 1
    return acc + cur.total * factor
  }, 0)

  const isCustom = rolls.every(roll => roll.customResults)
  const result = rolls.flatMap(roll => {
    if (isCustom && roll.customResults) {
      return roll.customResults
    }
    // For numeric rolls, convert to string array and then to T
    // This is safe because T defaults to string
    return roll.rolls.map(String) as T[]
  })

  return {
    rolls,
    result,
    total
  }
}

/**
 * Safe version of roll() that returns a Result type instead of throwing.
 *
 * Use this when you want to handle errors without try/catch blocks.
 *
 * @param args - One or more roll arguments (notation strings, numbers, or options objects),
 *               optionally followed by a RollConfig object
 * @returns Result containing either the roll result or an error
 *
 * @example
 * ```ts
 * const result = tryRoll("4d6L")
 * if (isSuccess(result)) {
 *   console.log(result.data.total)
 * } else {
 *   console.error(result.error.message)
 * }
 * ```
 */
export function tryRoll<T = string>(
  ...args: RollArgument<T>[]
): Result<RollerRollResult<T>, RollError>
export function tryRoll<T = string>(
  ...args: [...RollArgument<T>[], RollConfig]
): Result<RollerRollResult<T>, RollError>
export function tryRoll<T = string>(
  ...args: RollArgument<T>[] | [...RollArgument<T>[], RollConfig]
): Result<RollerRollResult<T>, RollError> {
  try {
    const result = roll<T>(...(args as RollArgument<T>[]))
    return success(result)
  } catch (e) {
    if (e instanceof RollError) {
      return error(e)
    }
    return error(new RollError(e instanceof Error ? e.message : String(e)))
  }
}
