import type { RollArgument, RollConfig, RollerRollResult } from '../types'
import { RandsumError, RollError } from '../errors'
import { parseArguments } from './parseArguments'
import { executeRollPipeline } from './pipeline'

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
 * Never throws - errors are returned in the result's `error` property.
 *
 * @typeParam T - Type for custom dice faces. Defaults to `string`.
 *   - For standard numeric dice (notation strings or numbers), `result` contains
 *     string representations of the roll values (e.g., `["5", "3", "6"]`).
 *   - For custom faces (options with `sides: T[]`), `result` contains the actual
 *     face values of type T.
 *
 * @param args - One or more roll arguments (notation strings, numbers, or options objects),
 *               optionally followed by a RollConfig object
 * @returns Roll result containing individual rolls, total, result array, and error (if any)
 *
 * @example Number (1 die, sides = number)
 * ```ts
 * const result = roll(20) // 1d20
 * ```
 *
 * @example Notation string
 * ```ts
 * const result = roll("2d6")
 * result.total // => Sum of 2d6
 * result.result // => ["3", "5"] - string representations
 * ```
 *
 * @example Options object
 * ```ts
 * const result = roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }) // same as 4d6L
 * ```
 *
 * @example Custom faces (Fate dice)
 * ```ts
 * const result = roll({ sides: ['+', '+', ' ', ' ', '-', '-'], quantity: 4 })
 * result.result // => ["+", "-", " ", "+"] - actual face values
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
 *
 * @example Error handling
 * ```ts
 * const result = roll("invalid notation")
 * if (result.error) {
 *   result.error.message // => "Invalid dice notation: ..."
 * }
 * ```
 */
export function roll<T = string>(...args: RollArgument<T>[]): RollerRollResult<T>
export function roll<T = string>(...args: [...RollArgument<T>[], RollConfig]): RollerRollResult<T>
export function roll<T = string>(
  ...args: RollArgument<T>[] | [...RollArgument<T>[], RollConfig]
): RollerRollResult<T> {
  try {
    const lastArg = args[args.length - 1]
    const hasConfig = lastArg !== undefined && isRollConfig(lastArg)
    const config: RollConfig | undefined = hasConfig ? lastArg : undefined

    const rollArgs = (hasConfig ? args.slice(0, -1) : args) as RollArgument<T>[]

    const parameters = rollArgs.flatMap((arg, index) => parseArguments(arg, index + 1))
    const rolls = parameters.map(parameter => executeRollPipeline(parameter, config?.randomFn))
    const total = rolls.reduce((acc, cur) => {
      const factor = cur.parameters.arithmetic === 'subtract' ? -1 : 1
      return acc + cur.total * factor
    }, 0)

    const result = rolls.flatMap<T>(r => {
      if (r.customResults) {
        return r.customResults
      }
      return r.rolls.map(n => String(n) as T)
    })

    return {
      rolls,
      result,
      total,
      error: null
    }
  } catch (e) {
    const error =
      e instanceof RandsumError ? e : new RollError(e instanceof Error ? e.message : String(e))

    const emptyResult: T[] = []

    return {
      rolls: [],
      result: emptyResult,
      total: 0,
      error
    }
  }
}
