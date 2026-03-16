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
  }
})

export const penetrateModifier: ModifierDefinition<boolean | number> = {
  ...penetrateSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.penetrate)
}
