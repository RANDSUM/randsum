import type {
  ModifierOptions,
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../types'

/**
 * Abstract base class for all dice roll modifiers
 *
 * Modifiers alter the behavior or results of dice rolls
 * and can be applied to both numeric and custom dice.
 *
 * @template T - The type of options this modifier accepts
 */
export abstract class BaseModifier<T = unknown> {
  /**
   * Options for configuring the modifier's behavior
   */
  protected options: T | undefined

  /**
   * Creates a new modifier instance
   *
   * @param options - Configuration options for the modifier
   */
  constructor(options: T | undefined) {
    this.options = options
  }

  /**
   * Applies the modifier to a roll result
   *
   * @param bonuses - The current roll bonuses to modify
   * @param parameters - Parameters of the roll being modified
   * @param rollOne - Function to roll a single die if needed
   * @returns Modified roll bonuses
   */
  public abstract apply(
    bonuses: NumericRollBonus,
    parameters?: RequiredNumericRollParameters,
    rollOne?: () => number
  ): NumericRollBonus

  /**
   * Generates a human-readable description of the modifier
   *
   * @returns Array of description strings or undefined if no description
   */
  public abstract toDescription(): string[] | undefined

  /**
   * Converts the modifier to dice notation format
   *
   * @returns Dice notation string or undefined if not applicable
   */
  public abstract toNotation(): string | undefined

  /**
   * Parses a modifier string into modifier options
   *
   * @param _modifiersString - The string to parse
   * @returns Partial modifier options object
   */
  public static parse(_modifiersString: string): Partial<ModifierOptions> {
    return {}
  }
}
