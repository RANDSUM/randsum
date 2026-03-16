import { defineNotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { assertRequiredContext } from './schema'

const explodePattern = /(?<!!)!(?!!|[pPsSiIrR])/

export const explodeSchema = defineNotationSchema<boolean>({
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
  }
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
