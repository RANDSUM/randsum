import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import { DEFAULT_EXPLOSION_DEPTH } from '../lib/constants'
import type { ModifierDefinition } from './schema'
import { assertRequiredContext } from './schema'
import { ExplosionStrategies, applyAccumulatingExplosion } from './shared/explosion'

const wildDiePattern = /[Ww](?![{])/

export const wildDieSchema: NotationSchema<boolean> = defineNotationSchema<boolean>({
  name: 'wildDie',
  priority: 55,

  pattern: wildDiePattern,

  parse: notation => {
    const match = wildDiePattern.exec(notation)
    if (!match) return {}
    return { wildDie: true }
  },

  toNotation: options => {
    if (options) return 'W'
    return undefined
  },

  toDescription: options => {
    if (options) return ['Wild Die (compound on max, penalty on 1)']
    return []
  },

  docs: [
    {
      key: 'W',
      category: 'Dispatch',
      color: '#facc15',
      colorLight: '#a16207',
      title: 'Wild Die',
      description:
        'D6 System wild die: compound-explode on max, drop wild die and highest on 1, no effect otherwise. A macro that dispatches to multiple primitives based on runtime state.',
      displayBase: 'W',
      forms: [{ notation: 'W', note: 'Apply wild die rule' }],
      examples: [
        { description: 'D6 System with wild die', notation: '5d6W', options: { sides: 6, quantity: 5, modifiers: { wildDie: true } } }
      ]
    }
  ]
})

export const wildDieModifier: ModifierDefinition<boolean> = {
  ...wildDieSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, _options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides } = parameters

    if (rolls.length === 0) return { rolls: [] }

    const wildIndex = rolls.length - 1
    const wildValue = rolls[wildIndex]

    if (wildValue === undefined) return { rolls }

    // Wild die shows max: compound explode via shared utility
    if (wildValue === sides) {
      const result = [...rolls]
      const compoundTotal = applyAccumulatingExplosion(
        wildValue,
        sides,
        rollOne,
        DEFAULT_EXPLOSION_DEPTH,
        ExplosionStrategies.compound
      )
      result[wildIndex] = compoundTotal
      return { rolls: result }
    }

    // Wild die shows 1: remove wild die AND highest non-wild die
    if (wildValue === 1) {
      const nonWild = rolls.slice(0, wildIndex)

      if (nonWild.length === 0) {
        return { rolls: [] }
      }

      // Find and remove the highest non-wild die
      const maxNonWild = Math.max(...nonWild)
      const maxIndex = nonWild.indexOf(maxNonWild)
      const result = nonWild.filter((_, i) => i !== maxIndex)
      return { rolls: result }
    }

    // Normal: no change
    return { rolls: [...rolls] }
  }
}
