import type { ModifierBehavior } from '../schema'
import { assertRequiredContext } from '../schema'
import { DEFAULT_EXPLOSION_DEPTH } from '../../constants'
import { ExplosionStrategies, applyAccumulatingExplosion } from '../definitions/explosion'

export const wildDieBehavior: ModifierBehavior<boolean> = {
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
