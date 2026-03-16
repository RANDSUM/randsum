import type {
  ComparisonOptions,
  CountOptions,
  DropOptions,
  KeepOptions,
  ModifierLog,
  ModifierOptions,
  ReplaceOptions,
  RequiredNumericRollParameters,
  RerollOptions,
  UniqueOptions
} from '../../types'
import type { NotationSchema } from '../../notation/schema'

/**
 * Context passed to modifier handlers that may need dice rolling or roll info.
 */
export interface ModifierContext {
  /** Function to roll a single die */
  rollOne?: () => number
  /** Roll parameters (sides, quantity) */
  parameters?: RequiredNumericRollParameters
  /** Raw random function for modifiers that need to roll dice of different sizes */
  randomFn?: () => number
}

/**
 * Context with required rollOne function.
 * Use this type when a modifier has `requiresRollFn: true`.
 */
export interface ContextWithRollFn extends ModifierContext {
  rollOne: () => number
}

/**
 * Context with required parameters.
 * Use this type when a modifier has `requiresParameters: true`.
 */
export interface ContextWithParameters extends ModifierContext {
  parameters: RequiredNumericRollParameters
}

/**
 * Context with both required rollOne and parameters.
 * Use this type when a modifier has both `requiresRollFn: true` and `requiresParameters: true`.
 */
export interface RequiredModifierContext extends ModifierContext {
  rollOne: () => number
  parameters: RequiredNumericRollParameters
}

/**
 * Asserts that the context has the required rollOne function.
 * Use when the modifier definition has `requiresRollFn: true`.
 *
 * This function performs both compile-time type narrowing and runtime validation.
 * If rollOne is missing, it indicates a bug in the modifier system (the registry
 * should have validated requirements before calling the modifier's apply function).
 *
 * @param ctx - The modifier context
 * @returns Context with rollOne guaranteed to exist
 * @throws Error if rollOne is not defined (indicates internal bug)
 */
export function assertRollFn(ctx: ModifierContext): ContextWithRollFn {
  if (ctx.rollOne === undefined) {
    throw new Error('Internal error: rollOne function required but not provided')
  }
  return ctx as ContextWithRollFn
}

/**
 * Asserts that the context has the required parameters.
 * Use when the modifier definition has `requiresParameters: true`.
 *
 * This function performs both compile-time type narrowing and runtime validation.
 * If parameters is missing, it indicates a bug in the modifier system.
 *
 * @param ctx - The modifier context
 * @returns Context with parameters guaranteed to exist
 * @throws Error if parameters is not defined (indicates internal bug)
 */
export function assertParameters(ctx: ModifierContext): ContextWithParameters {
  if (ctx.parameters === undefined) {
    throw new Error('Internal error: parameters required but not provided')
  }
  return ctx as ContextWithParameters
}

/**
 * Asserts that the context has both required rollOne and parameters.
 * Use when the modifier definition has both requirements.
 *
 * This function performs both compile-time type narrowing and runtime validation.
 *
 * @param ctx - The modifier context
 * @returns Context with both rollOne and parameters guaranteed to exist
 * @throws Error if either requirement is not defined (indicates internal bug)
 */
export function assertRequiredContext(ctx: ModifierContext): RequiredModifierContext {
  if (ctx.rollOne === undefined) {
    throw new Error('Internal error: rollOne function required but not provided')
  }
  if (ctx.parameters === undefined) {
    throw new Error('Internal error: parameters required but not provided')
  }
  return ctx as RequiredModifierContext
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
  apply: (rolls: number[], options: TOptions, ctx: ModifierContext) => ModifierApplyResult

  /**
   * Validate options against roll context.
   * Throws ModifierError if invalid.
   */
  validate?: (options: TOptions, rollContext: RequiredNumericRollParameters) => void

  /**
   * Whether this modifier requires the rollOne function.
   * If true, ctx.rollOne must be provided when applying.
   */
  requiresRollFn?: boolean

  /**
   * Whether this modifier requires roll parameters (sides, quantity).
   * If true, ctx.parameters must be provided when applying.
   */
  requiresParameters?: boolean

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
 * Standard priority order:
 * - 10-19: Pre-processing (cap)
 * - 20-29: Pool reduction (drop, keep)
 * - 30-39: Value replacement (replace)
 * - 40-49: Rerolling (reroll)
 * - 50-59: Explosions (explode, compound, penetrate)
 * - 60-69: Uniqueness (unique)
 * - 70-79: Counting (count)
 * - 80-89: Multiplication (multiply)
 * - 90-99: Arithmetic (plus, minus)
 * - 100+: Final (multiplyTotal)
 *
 * @template TOptions - The type of options this modifier accepts
 */
export type ModifierDefinition<TOptions = unknown> = NotationSchema<TOptions> &
  ModifierBehavior<TOptions>

/**
 * Maps modifier names to their option types.
 * Used for type-safe modifier definitions.
 */
export interface ModifierOptionTypes {
  cap: ComparisonOptions
  count: CountOptions
  drop: DropOptions
  keep: KeepOptions
  replace: ReplaceOptions | ReplaceOptions[]
  reroll: RerollOptions
  unique: boolean | UniqueOptions
  explode: boolean
  compound: boolean | number
  penetrate: boolean | number
  explodeSequence: number[]
  multiply: number
  plus: number
  minus: number
  sort: 'asc' | 'desc'
  wildDie: boolean
  integerDivide: number
  modulo: number
  multiplyTotal: number
}

/**
 * The modifier registry - maps modifier names to their definitions.
 */
export type ModifierRegistry = Map<keyof ModifierOptions, ModifierDefinition>

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
