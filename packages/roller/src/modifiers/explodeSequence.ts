import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import { DEFAULT_EXPLOSION_DEPTH } from '../lib/constants'
import { coreRandom } from '../lib/random'
import type { ModifierDefinition } from './schema'
import { assertRequiredContext } from './schema'

const explodeSequencePattern = /![sS]\{[\d,]+\}/

export const explodeSequenceSchema: NotationSchema<number[]> = defineNotationSchema<number[]>({
  name: 'explodeSequence',
  priority: 53,

  pattern: /![sS]\{[\d,]+\}|![iI]|![rR]/,

  parse: notation => {
    const match = explodeSequencePattern.exec(notation)
    if (!match) return {}

    const inner = match[0].slice(3, -1) // strip "!s{" and "}"
    const sequence = inner.split(',').map(Number)
    return { explodeSequence: sequence }
  },

  toNotation: options => {
    if (!Array.isArray(options) || options.length === 0) return undefined
    return `!s{${options.join(',')}}`
  },

  toDescription: options => {
    if (!Array.isArray(options) || options.length === 0) return []
    const parts = options.map(s => `d${s}`)
    return [`Explode through sequence: ${parts.join(', ')}`]
  }
})

/**
 * Roll a single die with a given number of sides using the raw RNG.
 */
function rollWithSides(sides: number, rng: () => number): number {
  return coreRandom(sides, rng) + 1
}

/**
 * Walk through the die size sequence, rolling each die and continuing
 * if max is hit. The last die in the sequence repeats (capped by DEFAULT_EXPLOSION_DEPTH).
 */
function explodeThroughSequence(sequence: number[], rng: () => number): number[] {
  const results: number[] = []
  const lastSize = sequence[sequence.length - 1]
  if (lastSize === undefined) return results

  const maxIterations = sequence.length + DEFAULT_EXPLOSION_DEPTH
  const remaining = [...sequence]

  for (const _ of Array.from({ length: maxIterations })) {
    const currentSize = remaining.shift() ?? lastSize
    const rolled = rollWithSides(currentSize, rng)
    results.push(rolled)

    if (rolled !== currentSize) break // Didn't hit max, stop
    // Hit max, continue to next in sequence (or repeat last)
  }

  return results
}

export const explodeSequenceModifier: ModifierDefinition<number[]> = {
  ...explodeSequenceSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, options, ctx) => {
    const { parameters } = assertRequiredContext(ctx)

    if (!Array.isArray(options) || options.length === 0) {
      return { rolls }
    }

    const { sides } = parameters
    const rng = ctx.randomFn ?? Math.random
    const additionalRolls: number[] = []

    for (const roll of rolls) {
      if (roll !== sides) continue

      // This die hit max, start the sequence
      const seqRolls = explodeThroughSequence(options, rng)
      additionalRolls.push(...seqRolls)
    }

    return { rolls: [...rolls, ...additionalRolls] }
  }
}
