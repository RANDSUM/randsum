import { type DiceNotation, type RollConfig } from '../../types'
import {
  formatCoreNotation,
  formatModifierNotation
} from '../configToNotation/notationFormatters'

export function configToNotation(options: RollConfig): DiceNotation {
  return `${formatCoreNotation(options)}${formatModifierNotation(options)}` as DiceNotation
}
