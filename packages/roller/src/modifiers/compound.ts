import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { ExplosionStrategies, createAccumulatingExplosionBehavior } from './shared/explosion'

const compoundPattern = /!!(\d+)?/

export const compoundSchema: NotationSchema<boolean | number> = defineNotationSchema<
  boolean | number
>({
  name: 'compound',
  priority: 51,

  pattern: compoundPattern,

  parse: notation => {
    const match = compoundPattern.exec(notation)
    if (!match) return {}

    const depth = match[1]
    if (depth === undefined) {
      return { compound: true }
    }
    return { compound: Number(depth) }
  },

  toNotation: options => {
    if (options === true) return '!!'
    if (typeof options === 'number') return `!!${options}`
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['Compounding Dice']
    if (options === 0) return ['Compounding Dice (unlimited)']
    if (typeof options === 'number') return [`Compounding Dice (max ${options} times)`]
    return []
  },

  docs: [
    {
      key: '!!',
      category: 'Explode',
      title: 'Compound Explode',
      description:
        'Like explode, but extra rolls add to the triggering die rather than creating new dice.',
      displayBase: '!!',
      displayOptional: 'n',
      forms: [
        {
          notation: '!!(n)',
          note: 'Compound up to n times (default: once)'
        },
        { notation: '!!0', note: 'Unlimited depth (capped at 100)' }
      ],
      examples: [
        {
          notation: '3d6!!',
          description: 'Roll 3d6; 6s add to themselves'
        },
        {
          notation: '1d8!!5',
          description: 'Roll 1d8, compound up to 5 times'
        }
      ]
    }
  ]
})

export const compoundModifier: ModifierDefinition<boolean | number> = {
  ...compoundSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.compound)
}
