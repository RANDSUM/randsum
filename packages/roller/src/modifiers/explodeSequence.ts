import { explodeSequenceSchema } from '../notation/definitions/explodeSequence'
import { DEFAULT_EXPLOSION_DEPTH } from '../lib/constants'
import { coreRandom } from '../lib/random'
import { ModifierError } from '../errors'
import type { ModifierDefinition } from './schema'
import { assertParameters } from './schema'

/**
 * Walk through the die size sequence, rolling each die and continuing
 * if max is hit. The last die in the sequence repeats (capped by DEFAULT_EXPLOSION_DEPTH).
 * Uses a typed roll function consistent with the injected roll mechanism.
 */
function explodeThroughSequence(sequence: number[], rollOne: (sides: number) => number): number[] {
  const results: number[] = []
  const lastSize = sequence[sequence.length - 1]
  if (lastSize === undefined) return results

  const maxIterations = sequence.length + DEFAULT_EXPLOSION_DEPTH
  const remaining = [...sequence]

  for (const _ of Array.from({ length: maxIterations })) {
    const currentSize = remaining.shift() ?? lastSize
    const rolled = rollOne(currentSize)
    results.push(rolled)

    if (rolled !== currentSize) break // Didn't hit max, stop
    // Hit max, continue to next in sequence (or repeat last)
  }

  return results
}

export const explodeSequenceModifier: ModifierDefinition<number[]> = {
  ...explodeSequenceSchema,
  requiresParameters: true,
  requiresRandomFn: true,

  apply: (rolls, options, ctx) => {
    const { parameters } = assertParameters(ctx)

    if (!Array.isArray(options) || options.length === 0) {
      return { rolls }
    }

    const { sides } = parameters
    const rng = ctx.randomFn
    if (rng === undefined) {
      throw new ModifierError(
        'explodeSequence',
        'randomFn function required for explodeSequence modifier'
      )
    }
    const rollOneSized = (rollSides: number): number => coreRandom(rollSides, rng) + 1
    const additionalRolls: number[] = []

    for (const roll of rolls) {
      if (roll !== sides) continue

      // This die hit max, start the sequence
      const seqRolls = explodeThroughSequence(options, rollOneSized)
      additionalRolls.push(...seqRolls)
    }

    return { rolls: [...rolls, ...additionalRolls] }
  }
}
