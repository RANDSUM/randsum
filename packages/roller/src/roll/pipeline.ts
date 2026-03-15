import type { RandomFn } from '../lib/random'
import { coreRandom, coreSpreadRolls } from '../lib/random'
import { type ModifierContext, applyAllModifiers, getModifierOrder } from '../lib/modifiers'
import type { RegistryProcessResult } from '../lib/modifiers/schema'
import type { RollParams, RollRecord } from '../types'
import { RollError } from '../errors'

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
    const { sides, quantity, draw, geometric } = this.params
    if (draw === true) {
      this.initialRolls = this.drawWithoutReplacement(quantity, sides)
    } else if (geometric === true) {
      this.initialRolls = Array.from({ length: quantity }, () => this.geometricRoll(sides))
    } else {
      this.initialRolls = coreSpreadRolls(quantity, sides, this.rng)
    }
    return this
  }

  /**
   * Perform a single geometric roll: roll dN until a 1 appears.
   * Returns the number of rolls it took (including the final 1).
   * Capped at 1000 to prevent infinite loops.
   */
  private geometricRoll(sides: number, count = 1): number {
    if (count > 1000) return 1000
    const value = coreRandom(sides, this.rng) + 1
    if (value === 1) return count
    return this.geometricRoll(sides, count + 1)
  }

  /**
   * Draw values without replacement from a pool of [1..sides].
   * If quantity exceeds sides, the pool reshuffles after exhaustion.
   */
  private drawWithoutReplacement(quantity: number, sides: number): number[] {
    const result: number[] = []
    const fullBatches = Math.floor(quantity / sides)
    const remainder = quantity % sides

    for (const _batch of Array.from({ length: fullBatches })) {
      result.push(...this.shuffledPool(sides))
    }

    if (remainder > 0) {
      result.push(...this.shuffledPool(sides).slice(0, remainder))
    }

    return result
  }

  /**
   * Create a shuffled pool of [1..sides] using Fisher-Yates.
   */
  private shuffledPool(sides: number): number[] {
    const pool = Array.from({ length: sides }, (_, i) => i + 1)

    for (const i of Array.from({ length: sides - 1 }, (_, k) => sides - 1 - k)) {
      const j = Math.floor(this.rng() * (i + 1))
      const temp = pool[i] ?? 0
      pool[i] = pool[j] ?? 0
      pool[j] = temp
    }

    return pool
  }

  /**
   * Apply all modifiers to the rolls in priority order.
   */
  public applyModifiers(): this {
    const { sides, quantity, modifiers } = this.params
    const modifierOrder = getModifierOrder()
    const hasModifiers = modifierOrder.some(key => modifiers[key] !== undefined)

    if (!hasModifiers) {
      this.modifierResult = {
        rolls: this.initialRolls,
        logs: [],
        totalTransformers: []
      }
      return this
    }

    const rollOne = (): number => coreRandom(sides, this.rng) + 1
    const ctx: ModifierContext = {
      rollOne,
      parameters: { sides, quantity }
    }

    this.modifierResult = applyAllModifiers(modifiers, this.initialRolls, ctx)
    return this
  }

  /**
   * Calculate the final total, applying any total transformers.
   */
  private calculateTotal(): number {
    if (this.modifierResult === null) {
      throw new RollError('Must call applyModifiers() before calculating total')
    }

    const result = this.modifierResult
    const rolls = result.rolls
    const transformers = result.totalTransformers

    const baseTotal = rolls.reduce((acc, cur) => acc + cur, 0)

    return transformers.reduce((total, fn) => fn(total, rolls), baseTotal)
  }

  /**
   * Build the final RollRecord with all computed values.
   *
   * Must be called after `generateInitialRolls()` and `applyModifiers()`.
   * Prefer `execute()` which handles step ordering automatically.
   *
   * @throws {RollError} if called out of order (programmer error — not a user-facing error)
   * @internal Not part of the public API. Use `executeRollPipeline()` instead.
   */
  public build(): RollRecord<T> {
    if (this.initialRolls.length === 0) {
      throw new RollError('Must call generateInitialRolls() before building')
    }
    if (!this.modifierResult) {
      throw new RollError('Must call applyModifiers() before building')
    }

    const { faces, arithmetic, description, argument, notation, label } = this.params
    const total = this.calculateTotal()
    const isNegative = arithmetic === 'subtract'

    const customResults = faces
      ? { customResults: this.initialRolls.map<T>(roll => faces[roll - 1] as T) }
      : {}

    return {
      ...customResults,
      parameters: this.params,
      argument,
      notation,
      description,
      ...(label !== undefined ? { label } : {}),
      initialRolls: this.initialRolls,
      modifierLogs: this.modifierResult.logs,
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
