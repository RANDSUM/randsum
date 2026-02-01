import type { GameRollResult, RollOptions, RollRecord, RollerRollResult } from '../types'
import { roll } from '../roll'

/**
 * Configuration for creating a game-specific roll function.
 *
 * @template TInput - Type of the input argument
 * @template TResult - Type of the game-specific result
 */
export interface GameRollConfig<TInput, TResult> {
  /** Validation function that throws if input is invalid */
  validate: (input: TInput) => void
  /** Converts input to RollOptions or array of RollOptions */
  toRollOptions: (input: TInput) => RollOptions | RollOptions[]
  /** Interprets the roll result to produce game-specific result */
  interpretResult: (
    input: TInput,
    total: number,
    rolls: RollRecord[],
    fullResult: RollerRollResult
  ) => TResult
}

/**
 * Creates a game-specific roll function that follows the standard pattern:
 * validate → roll → interpret → return
 *
 * @param config - Configuration for the game roll function
 * @returns A function that takes game-specific input and returns a GameRollResult
 *
 * @example
 * ```ts
 * const actionRoll = createGameRoll({
 *   validate: (arg) => {
 *     validateFinite(arg.modifier, 'modifier')
 *     validateRange(arg.modifier, -30, 30, 'modifier')
 *   },
 *   toRollOptions: (arg) => ({
 *     sides: 20,
 *     quantity: arg.advantage ? 2 : 1,
 *     modifiers: { drop: arg.advantage ? { lowest: 1 } : undefined, plus: arg.modifier }
 *   }),
 *   interpretResult: (_input, total) => total
 * })
 * ```
 */
export function createGameRoll<TInput, TResult>(
  config: GameRollConfig<TInput, TResult>
): (input: TInput) => GameRollResult<TResult, undefined, RollRecord> {
  return (input: TInput) => {
    config.validate(input)
    const options = config.toRollOptions(input)
    const rollResult = Array.isArray(options) ? roll(...options) : roll(options)
    return {
      rolls: rollResult.rolls,
      total: rollResult.total,
      result: config.interpretResult(input, rollResult.total, rollResult.rolls, rollResult)
    }
  }
}

/**
 * Configuration for creating a game-specific roll function that requires multiple distinct rolls.
 *
 * This factory is for games like Daggerheart that need:
 * - Multiple distinct rolls with keys for identification
 * - Post-processing to find specific roll records by key
 * - Custom details field with structured information
 * - Modified total calculation after rolling
 *
 * @template TInput - Type of the input argument
 * @template TResult - Type of the game-specific result
 * @template TDetails - Type of additional details (defaults to undefined)
 */
export interface MultiRollGameConfig<TInput, TResult, TDetails = undefined> {
  /** Validation function that throws if input is invalid */
  validate: (input: TInput) => void
  /** Converts input to array of RollOptions with keys for identification */
  toRollOptions: (input: TInput) => RollOptions[]
  /** Interprets the roll result to produce game-specific result and details */
  interpretResult: (
    input: TInput,
    rollResult: RollerRollResult,
    rollsByKey: Map<string, RollRecord>
  ) => { result: TResult; details?: TDetails; total?: number }
}

/**
 * Creates a game-specific roll function for games requiring multiple distinct rolls.
 *
 * This factory handles the common pattern of:
 * 1. Validating input
 * 2. Creating multiple rolls with keys
 * 3. Building a map of rolls by key for easy lookup
 * 4. Interpreting results with access to the full roll result and keyed rolls
 * 5. Returning a GameRollResult with optional custom total and details
 *
 * @param config - Configuration for the multi-roll game function
 * @returns A function that takes game-specific input and returns a GameRollResult
 *
 * @example
 * ```ts
 * const rollDaggerheart = createMultiRollGameRoll({
 *   validate: (arg) => {
 *     // Validate input
 *   },
 *   toRollOptions: (arg) => [
 *     { sides: 12, key: 'hope' },
 *     { sides: 12, key: 'fear' },
 *     { sides: 6, key: arg.rollingWith }
 *   ],
 *   interpretResult: (input, rollResult, rollsByKey) => {
 *     const hopeRoll = rollsByKey.get('hope')
 *     const fearRoll = rollsByKey.get('fear')
 *     // Calculate result and details
 *     return { result: type, details: {...}, total: customTotal }
 *   }
 * })
 * ```
 */
export function createMultiRollGameRoll<TInput, TResult, TDetails = undefined>(
  config: MultiRollGameConfig<TInput, TResult, TDetails>
): (input: TInput) => GameRollResult<TResult, TDetails, RollRecord> {
  return (input: TInput): GameRollResult<TResult, TDetails, RollRecord> => {
    config.validate(input)
    const options = config.toRollOptions(input)
    const rollResult = roll(...options)

    const rollsByKey = new Map<string, RollRecord>()
    for (const rollRecord of rollResult.rolls) {
      if (rollRecord.parameters.key !== undefined) {
        rollsByKey.set(rollRecord.parameters.key, rollRecord)
      }
    }

    const interpreted = config.interpretResult(input, rollResult, rollsByKey)

    const gameResult: GameRollResult<TResult, TDetails, RollRecord> = {
      rolls: rollResult.rolls,
      total: interpreted.total ?? rollResult.total,
      result: interpreted.result
    }

    if (interpreted.details !== undefined) {
      gameResult.details = interpreted.details
    }

    return gameResult
  }
}
