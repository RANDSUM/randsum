import type { RollConfig } from '@randsum/core'
import {
  formatCoreNotation,
  formatModifierNotation
} from './notationFormatters'
import type { DiceNotation } from '../../types'

export function configToNotation(options: RollConfig): DiceNotation {
  return `${formatCoreNotation(options)}${formatModifierNotation(options)}`
}

export * from './notationFormatters'
