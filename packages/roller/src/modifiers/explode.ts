import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { assertRequiredContext } from './schema'

const explodePattern = /(?<!!)!(?!!|[pPsSiIrR])/

export const explodeSchema: NotationSchema<boolean> = defineNotationSchema<boolean>({
  name: 'explode',
  priority: 50,

  pattern: /(?<!!)!(?!!|[pPsSiIrR])/,

  parse: notation => {
    if (explodePattern.test(notation)) {
      return { explode: true }
    }
    return {}
  },

  toNotation: options => {
    return options ? '!' : undefined
  },

  toDescription: options => {
    if (!options) return []
    return ['Exploding Dice']
  },

  docs: [
    {
      key: '!',
      category: 'Explode',
      color: '#fbbf24',
      title: 'Explode',
      description:
        'Each die showing its maximum value triggers an extra die roll. Continues if new dice also max.',
      displayBase: '!',
      forms: [{ notation: '!', note: 'Explode on max value' }],
      examples: [
        { notation: '3d6!', description: 'Roll 3d6; any 6 adds another d6' },
        { notation: '4d6L!', description: 'Roll 4d6, explode, then drop lowest' }
      ]
    }
  ]
})

export const explodeModifier: ModifierDefinition<boolean> = {
  ...explodeSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, _options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const explosions = rolls.filter(roll => roll === parameters.sides).map(() => rollOne())

    return { rolls: [...rolls, ...explosions] }
  }
}
