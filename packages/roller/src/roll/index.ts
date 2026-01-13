import type { RollArgument, RollConfig, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

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

  if (
    lastArg &&
    typeof lastArg === 'object' &&
    'randomFn' in lastArg &&
    !('sides' in lastArg) &&
    !('quantity' in lastArg) &&
    typeof lastArg !== 'string' &&
    typeof lastArg !== 'number'
  ) {
    config = lastArg
    rollArgs = args.slice(0, -1) as RollArgument<T>[]
  } else {
    rollArgs = args as RollArgument<T>[]
  }

  const parameters = rollArgs.flatMap((arg, index) => argToParameter(arg, index + 1))
  const rolls = parameters.map(parameter => generateRollRecord(parameter, config?.randomFn))
  const total = rolls.reduce((acc, cur) => {
    const factor = cur.parameters.arithmetic === 'subtract' ? -1 : 1
    return acc + cur.total * factor
  }, 0)

  const isCustom = rolls.every(roll => roll.customResults)
  const result = rolls.flatMap(roll =>
    isCustom ? (roll.customResults ?? []) : (roll.rolls.map(String) as T)
  )

  return {
    rolls,
    result,
    total
  }
}
