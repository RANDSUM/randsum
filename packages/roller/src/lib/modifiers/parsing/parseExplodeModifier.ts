import type { ModifierOptions } from '../../../types'
import { explodePattern } from '../../patterns/modifierPatterns'

export function parseExplodeModifier(notation: string): Pick<ModifierOptions, 'explode'> {
  return explodePattern.test(notation) ? { explode: true } : {}
}
