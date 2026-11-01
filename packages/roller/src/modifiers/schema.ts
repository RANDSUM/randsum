import type { ModifierLog, RequiredNumericRollParameters } from '../types'
import type { NotationSchema } from '../notation/schema'

/**
 * Context passed to modifier handlers that may need dice rolling or roll info.
 */
export interface ModifierContext {
  /** Function to roll a single die */
  readonly rollOne: () => number
  /** Roll parameters (sides, quantity) */
  readonly parameters: RequiredNumericRollParameters
  /** Raw random function for modifiers that need to roll dice of different sizes */
  readonly randomFn: () => number
}

/**
 * What a modifier's `validate` sees: the pool's size, plus its numeric faces
 * when they are not [1..sides] (dF, zN and numeric d{...} dice).
 */
export interface ModifierValidationContext extends RequiredNumericRollParameters {
  faces?: readonly number[]
}

/**
 * Function that transforms the running total during roll calculation.
 * Receives current total and the modified rolls array.
 * Returns the new total.
 */
export type TotalTransformer = (currentTotal: number, rolls: number[]) => number

/**
 * Result of applying a modifier to rolls.
 */
export interface ModifierApplyResult {
  /** Updated roll values */
  rolls: number[]
  /**
   * Optional function to transform the running total.
   * Called in priority order during total calculation.
   * Use this for modifiers that affect how the total is computed
   * (e.g., multiply, count, plus/minus).
   */
  transformTotal?: TotalTransformer
  /** Paired replacements for modifiers that do 1:1 substitution */
  replacements?: readonly { readonly from: number; readonly to: number }[]
}

/**
 * Execution-only half of a modifier definition.
 *
 * Covers dice manipulation concerns:
 * - Applying the modifier to rolls
 * - Validating modifier options
 * - Declaring context requirements (rollOne, parameters)
 *
 * @template TOptions - The type of options this modifier accepts
 */
export interface ModifierBehavior<TOptions = unknown> {
  /**
   * Apply this modifier to roll values.
   * Returns new rolls array (should not mutate input).
   */
  apply(rolls: number[], options: TOptions, ctx: ModifierContext): ModifierApplyResult

  /**
   * Validate options against roll context.
   * Throws ModifierError if invalid.
   */
  validate?(options: TOptions, rollContext: ModifierValidationContext): void

  /**
   * Whether this modifier rolls new dice (spec 3.3 stage metadata: a Stage 1
   * modifier never does). The pipeline always supplies ctx.rollOne.
   */
  requiresRollFn?: boolean

  /** Whether this modifier reads the pool's sides and quantity from ctx.parameters. */
  requiresParameters?: boolean

  /** Whether this modifier rolls dice of other sizes with ctx.randomFn. */
  requiresRandomFn?: boolean

  /**
   * Whether apply() may return a different rolls array reference.
   * When false, apply() returns a reference-equal rolls array and only uses transformTotal.
   * The registry calls createArithmeticLog() instead of createModifierLog() when false,
   * skipping the frequency-diff computation.
   * Misannotation degrades to an empty diff log entry, not a corrupted result.
   */
  readonly mutatesRolls?: boolean
}

/**
 * Complete definition of a dice roll modifier.
 *
 * Combines the notation schema (string transformation) and modifier behavior
 * (dice execution) into one unified type. This is what the registry stores.
 *
 * @template TOptions - The type of options this modifier accepts
 */
export type ModifierDefinition<TOptions = unknown> = NotationSchema<TOptions> &
  ModifierBehavior<TOptions>

/**
 * Result of processing all modifiers through the registry.
 */
export interface RegistryProcessResult {
  /** Final roll values after all modifiers */
  rolls: number[]
  /** Log of each modifier's changes */
  logs: ModifierLog[]
  /** Chain of total transformers to apply in order */
  totalTransformers: TotalTransformer[]
}
