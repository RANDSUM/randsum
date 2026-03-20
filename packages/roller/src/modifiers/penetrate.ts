import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { ExplosionStrategies, createAccumulatingExplosionBehavior } from './shared/explosion'

const penetratePattern = /!p(\d+)?/i

export const penetrateSchema: NotationSchema<boolean | number> = defineNotationSchema<
  boolean | number
>({
  name: 'penetrate',
  priority: 52,

  pattern: penetratePattern,

  parse: notation => {
    const match = penetratePattern.exec(notation)
    if (!match) return {}

    const depth = match[1]
    if (depth === undefined) {
      return { penetrate: true }
    }
    return { penetrate: Number(depth) }
  },

  toNotation: options => {
    if (options === true) return '!p'
    if (typeof options === 'number') return `!p${options}`
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['Penetrating Dice']
    if (options === 0) return ['Penetrating Dice (unlimited)']
    if (typeof options === 'number') return [`Penetrating Dice (max ${options} times)`]
    return []
  },

  docs: [
    {
      key: '!p',
      category: 'Accumulate',
      color: '#d97706',
      colorLight: '#92400e',
      title: 'Penetrating Explode',
      description:
        'Like explode, but each subsequent explosion subtracts 1 from the result (Hackmaster-style).',
      displayBase: '!p',
      displayOptional: 'n',
      forms: [
        { notation: '!p(n)', note: 'Penetrate up to n times (default: once)' },
        { notation: '!p0', note: 'Unlimited depth (capped at 100)' }
      ],
      examples: [
        { notation: '1d6!p', description: 'Roll 1d6; max penetrates with -1 per chain' },
        { notation: '2d6!pL', description: 'Penetrate, then drop lowest' }
      ]
    }
  ]
})

export const penetrateModifier: ModifierDefinition<boolean | number> = {
  ...penetrateSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.penetrate)
}
