import type { RollConfig } from '@randsum/core'
import {
  formatCoreNotation,
  formatModifierNotation
} from '../configToNotation/notationFormatters'
import type { DiceNotation } from '../../types'

export function configToNotation(options: RollConfig): DiceNotation {
  return `${formatCoreNotation(options)}${formatModifierNotation(options)}` as DiceNotation
}
