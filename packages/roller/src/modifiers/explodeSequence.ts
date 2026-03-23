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
  },

  docs: [
    {
      key: '!s{..}',
      category: 'Generate',
      color: '#fcd34d',
      colorLight: '#ca8a04',
      title: 'Explode Sequence',
      description:
        'On max, re-roll with the next die size in a custom sequence rather than reusing the same die.',
      displayBase: '!s{..}',
      forms: [{ notation: '!s{N1,N2,...}', note: 'Step through die sizes on each explosion' }],
      examples: [
        { description: 'Explode through d4, d6, d8, d10', notation: '1d4!s{4,6,8,10}', options: { sides: 4, modifiers: { explodeSequence: [4, 6, 8, 10] } } },
        { description: 'Explode to d8, then d12', notation: '1d6!s{8,12}', options: { sides: 6, modifiers: { explodeSequence: [8, 12] } } }
      ]
    },
    {
      key: '!i',
      category: 'Generate',
      color: '#fcd34d',
      colorLight: '#ca8a04',
      title: 'Inflation',
      description:
        'Explode upward through the TTRPG standard die set (4, 6, 8, 10, 12, 20, 100). Sugar for Explode Sequence going up.',
      displayBase: '!i',
      forms: [{ notation: '!i', note: 'Inflate through standard dice sizes' }],
      examples: [
        { description: 'Explode d4 through d6, d8, d10, d12, d20', notation: '1d4!i', options: { sides: 4, modifiers: { explodeSequence: [6, 8, 10, 12, 20] } } }
      ]
    },
    {
      key: '!r',
      category: 'Generate',
      color: '#fcd34d',
      colorLight: '#ca8a04',
      title: 'Reduction',
      description:
        'Explode downward through the TTRPG standard die set (4, 6, 8, 10, 12, 20, 100). Sugar for Explode Sequence going down.',
      displayBase: '!r',
      forms: [{ notation: '!r', note: 'Reduce through standard dice sizes' }],
      examples: [
        { description: 'Explode d20 through d12, d10, d8, d6, d4', notation: '1d20!r', options: { sides: 20, modifiers: { explodeSequence: [12, 10, 8, 6, 4] } } }
      ]
    }
  ]
})

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
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, options, ctx) => {
    const { parameters } = assertRequiredContext(ctx)

    if (!Array.isArray(options) || options.length === 0) {
      return { rolls }
    }

    const { sides } = parameters
    // Build a sized roll function backed by the injected RNG (always provided when requiresRollFn: true).
    const rng = ctx.randomFn
    if (rng === undefined) throw new Error('Internal error: randomFn required for explodeSequence')
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
