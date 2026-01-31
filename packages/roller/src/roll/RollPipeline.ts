import type { RandomFn } from '../lib/random'
import { coreRandom, coreSpreadRolls } from '../lib/random'
import {
  type ModifierContext,
  applyAllModifiersFromRegistry,
  getModifierOrder
} from '../lib/modifiers'
import type { RegistryProcessResult } from '../lib/modifiers/schema'
import type { ModifierLog, RollParams, RollRecord } from '../types'

/**
 * RollPipeline encapsulates the execution of a single dice roll.
 *
 * It provides a clear, step-by-step flow for:
 * 1. Generating initial rolls
 * 2. Applying modifiers
 * 3. Calculating the final total
 * 4. Building the complete roll record
 *
 * This pattern makes the roll execution explicit and testable at each stage.
 *
 * @template T - Type for custom dice faces
 *
 * @example
 * ```ts
 * const record = new RollPipeline(parameters)
 *   .generateInitialRolls()
 *   .applyModifiers()
 *   .build()
 * ```
 */
export class RollPipeline<T = string> {
  private readonly params: RollParams<T>
  private readonly rng: RandomFn

  // Mutable state through the pipeline
  private initialRolls: number[] = []
  private modifierResult: RegistryProcessResult | null = null

  constructor(parameters: RollParams<T>, rng?: RandomFn) {
    this.params = parameters
    this.rng = rng ?? Math.random
  }

  /**
   * Generate the initial dice rolls before any modifiers are applied.
   */
  public generateInitialRolls(): this {
    const { sides, quantity = 1 } = this.params
    this.initialRolls = coreSpreadRolls(quantity, sides, this.rng)
    return this
  }

  /**
   * Apply all modifiers to the rolls in priority order.
   */
  public applyModifiers(): this {
    const { sides, quantity = 1, modifiers = {} } = this.params
    const modifierOrder = getModifierOrder()
    const hasModifiers = modifierOrder.some(key => modifiers[key] !== undefined)

    if (!hasModifiers) {
      // No modifiers - create empty result
      this.modifierResult = {
        rolls: this.initialRolls,
        logs: [],
        totalTransformers: []
      }
      return this
    }

    // Create context for modifiers that need additional info
    const rollOne = (): number => coreRandom(sides, this.rng)
    const ctx: ModifierContext = {
      rollOne,
      parameters: { sides, quantity }
    }

    this.modifierResult = applyAllModifiersFromRegistry(modifiers, this.initialRolls, ctx)
    return this
  }

  /**
   * Calculate the final total, applying any total transformers.
   */
  private calculateTotal(): number {
    if (this.modifierResult === null) {
      throw new Error('Must call applyModifiers() before calculating total')
    }

    const result = this.modifierResult
    const rolls = result.rolls
    const transformers = result.totalTransformers

    let total = rolls.reduce((acc, cur) => acc + cur, 0)

    // Apply all total transformers in order
    transformers.forEach(fn => {
      total = fn(total, rolls)
    })

    return total
  }

  /**
   * Build the final RollRecord with all computed values.
   */
  public build(): RollRecord<T> {
    if (this.initialRolls.length === 0) {
      throw new Error('Must call generateInitialRolls() before building')
    }
    if (!this.modifierResult) {
      throw new Error('Must call applyModifiers() before building')
    }

    const { faces, arithmetic, description } = this.params
    const total = this.calculateTotal()
    const isNegative = arithmetic === 'subtract'

    // Build custom results for non-numeric dice
    const customResults = faces
      ? { customResults: this.initialRolls.map(roll => faces[roll - 1] as T) }
      : {}

    return {
      ...customResults,
      parameters: this.params,
      description,
      modifierHistory: {
        logs: this.modifierResult.logs,
        modifiedRolls: this.modifierResult.rolls,
        total,
        initialRolls: this.initialRolls
      },
      rolls: this.modifierResult.rolls,
      appliedTotal: isNegative ? -total : total,
      total
    }
  }

  /**
   * Convenience method to execute the full pipeline in one call.
   */
  public execute(): RollRecord<T> {
    return this.generateInitialRolls().applyModifiers().build()
  }

  // ============================================================================
  // Getters for intermediate state (useful for testing/debugging)
  // ============================================================================

  /** Get the initial rolls before modifiers */
  public getInitialRolls(): readonly number[] {
    return this.initialRolls
  }

  /** Get the rolls after modifiers */
  public getModifiedRolls(): readonly number[] {
    return this.modifierResult?.rolls ?? []
  }

  /** Get the modifier logs */
  public getModifierLogs(): readonly ModifierLog[] {
    return this.modifierResult?.logs ?? []
  }
}

/**
 * Create and execute a roll pipeline for a single set of parameters.
 * This is the recommended way to generate a roll record.
 *
 * @param parameters - Fully resolved roll parameters
 * @param rng - Optional custom random function
 * @returns Complete roll record
 */
export function executeRollPipeline<T>(parameters: RollParams<T>, rng?: RandomFn): RollRecord<T> {
  return new RollPipeline(parameters, rng).execute()
}
