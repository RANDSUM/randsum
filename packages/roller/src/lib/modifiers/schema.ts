import type {
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  ModifierLog,
  ModifierOptions,
  ReplaceOptions,
  RequiredNumericRollParameters,
  RerollOptions,
  SuccessCountOptions,
  UniqueOptions
} from '../../types'

/**
 * Context passed to modifier handlers that may need dice rolling or roll info.
 */
export interface ModifierContext {
  /** Function to roll a single die */
  rollOne?: () => number
  /** Roll parameters (sides, quantity) */
  parameters?: RequiredNumericRollParameters
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
   * (e.g., multiply, countSuccesses, plus/minus).
   */
  transformTotal?: TotalTransformer
}

/**
 * Complete definition of a dice roll modifier.
 *
 * This schema defines everything needed to:
 * - Parse the modifier from notation
 * - Apply the modifier to dice rolls
 * - Convert back to notation string
 * - Generate human-readable description
 * - Validate the modifier options
 *
 * @template TOptions - The type of options this modifier accepts
 */
export interface ModifierDefinition<TOptions = unknown> {
  /** Unique identifier matching the key in ModifierOptions */
  name: keyof ModifierOptions

  /**
   * Execution priority (lower = earlier).
   * Standard order:
   * - 10-19: Pre-processing (cap)
   * - 20-29: Pool reduction (drop, keep)
   * - 30-39: Value replacement (replace)
   * - 40-49: Rerolling (reroll)
   * - 50-59: Explosions (explode, compound, penetrate)
   * - 60-69: Uniqueness (unique)
   * - 70-79: Counting (countSuccesses)
   * - 80-89: Multiplication (multiply)
   * - 90-99: Arithmetic (plus, minus)
   * - 100+: Final (multiplyTotal)
   */
  priority: number

  /**
   * Regex pattern to match this modifier in notation string.
   * Should NOT include 'g' flag - that's handled by the registry.
   */
  pattern: RegExp

  /**
   * Parse notation string into modifier options.
   * Receives the full notation string to allow finding multiple matches.
   * Returns a partial ModifierOptions with just this modifier's key.
   */
  parse: (notation: string) => Partial<ModifierOptions>

  /**
   * Convert options to notation string (e.g., "C{>5}").
   * Returns undefined if options would produce empty notation.
   */
  toNotation: (options: TOptions) => string | undefined

  /**
   * Convert options to human-readable description strings.
   * Returns array of descriptions (some modifiers produce multiple lines).
   */
  toDescription: (options: TOptions) => string[]

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
}

/**
 * Maps modifier names to their option types.
 * Used for type-safe modifier definitions.
 */
export interface ModifierOptionTypes {
  cap: ComparisonOptions
  drop: DropOptions
  keep: KeepOptions
  replace: ReplaceOptions | ReplaceOptions[]
  reroll: RerollOptions
  unique: boolean | UniqueOptions
  explode: boolean | number
  compound: boolean | number
  penetrate: boolean | number
  countSuccesses: SuccessCountOptions
  multiply: number
  plus: number
  minus: number
  multiplyTotal: number
}

/**
 * Helper type to create a correctly-typed modifier definition.
 */
export type TypedModifierDefinition<K extends keyof ModifierOptions> = ModifierDefinition<
  ModifierOptionTypes[K]
>

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
