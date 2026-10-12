import type { RandomFn } from '../lib/random'
import { coreRandom, coreSpreadRolls } from '../lib/random'
import { MODIFIER_ORDER, type ModifierContext, applyAllModifiers } from '../modifiers'
import type { RegistryProcessResult } from '../modifiers/schema'
import type { RollParams, RollRecord } from '../types'

/**
 * Create a shuffled pool of [1..sides] using Fisher-Yates.
 */
function shuffledPool(sides: number, rng: RandomFn): number[] {
  const pool = Array.from({ length: sides }, (_, i) => i + 1)

  for (const i of Array.from({ length: sides - 1 }, (_, k) => sides - 1 - k)) {
    const j = Math.floor(rng() * (i + 1))
    const temp = pool[i] ?? 0
    pool[i] = pool[j] ?? 0
    pool[j] = temp
  }

  return pool
}

/**
 * Draw values without replacement from a pool of [1..sides].
 * If quantity exceeds sides, the pool reshuffles after exhaustion and drawing
 * continues from the fresh pool until all `quantity` values are produced.
 * Example: `8DD6` returns 8 values — a permutation of [1..6] followed by
 * 2 more values drawn from a reshuffled pool.
 *
 * Design decision: reshuffle (not cap) is the intended behavior.
 * The spec (RDN v1.0-alpha §4.4) and site docs both describe this semantics.
 */
function drawWithoutReplacement(quantity: number, sides: number, rng: RandomFn): number[] {
  const fullBatches = Array.from({ length: Math.floor(quantity / sides) }, () =>
    shuffledPool(sides, rng)
  ).flat()
  const remainder = quantity % sides
  return remainder > 0
    ? [...fullBatches, ...shuffledPool(sides, rng).slice(0, remainder)]
    : fullBatches
}

/**
 * Perform geometric rolls: for each of `quantity` sequences, roll dN until
 * a non-maximum value appears. Returns the actual die values from all
 * sequences concatenated.
 * Each sequence is capped at 1000 rolls to prevent infinite loops.
 */
function geometricRolls(quantity: number, sides: number, rng: RandomFn): number[] {
  const results: number[] = []
  for (const _ of Array.from({ length: quantity })) {
    for (const __ of Array.from({ length: 1000 })) {
      const value = coreRandom(sides, rng) + 1
      results.push(value)
      if (value !== sides) break
    }
  }
  return results
}

/**
 * Generate the initial dice rolls before any modifiers are applied.
 */
function initialRollsFor<T>(params: RollParams<T>, rng: RandomFn): number[] {
  const { sides, quantity, draw, geometric, numericFaces } = params
  if (draw === true) return drawWithoutReplacement(quantity, sides, rng)
  if (geometric === true) return geometricRolls(quantity, sides, rng)
  if (numericFaces !== undefined) {
    return Array.from(
      { length: quantity },
      () => numericFaces[coreRandom(numericFaces.length, rng)] ?? 0
    )
  }
  return coreSpreadRolls(quantity, sides, rng)
}

/**
 * Apply all modifiers to the rolls in priority order.
 */
function modify<T>(
  params: RollParams<T>,
  initialRolls: number[],
  rng: RandomFn
): RegistryProcessResult {
  const { sides, quantity, modifiers, numericFaces } = params
  if (!MODIFIER_ORDER.some(key => modifiers[key] !== undefined)) {
    return { rolls: initialRolls, logs: [], totalTransformers: [] }
  }

  const rollOne =
    numericFaces !== undefined
      ? (): number => numericFaces[coreRandom(numericFaces.length, rng)] ?? 0
      : (): number => coreRandom(sides, rng) + 1
  const ctx: ModifierContext = {
    rollOne,
    parameters: { sides, quantity },
    randomFn: rng
  }
  return applyAllModifiers(modifiers, initialRolls, ctx)
}

/**
 * Execute a single dice roll: generate the initial rolls, apply the modifiers,
 * compute the total and build the record.
 *
 * @param parameters - Fully resolved roll parameters
 * @param rng - Optional custom random function
 * @returns Complete roll record
 */
export function executeRollPipeline<T>(
  parameters: RollParams<T>,
  rng: RandomFn = Math.random
): RollRecord<T> {
  const initialRolls = initialRollsFor(parameters, rng)
  const { rolls, logs, totalTransformers } = modify(parameters, initialRolls, rng)
  const total = totalTransformers.reduce(
    (current, transform) => transform(current, rolls),
    rolls.reduce((acc, cur) => acc + cur, 0)
  )

  const { faces, arithmetic, description, argument, notation, label } = parameters
  return {
    ...(faces ? { customResults: initialRolls.map<T>(roll => faces[roll - 1] as T) } : {}),
    parameters,
    argument,
    notation,
    description,
    ...(label !== undefined ? { label } : {}),
    initialRolls,
    modifierLogs: logs,
    rolls,
    appliedTotal: arithmetic === 'subtract' ? -total : total,
    total
  }
}
