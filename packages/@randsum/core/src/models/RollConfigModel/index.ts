import { type DiceNotation, type RollConfig } from '../../types'
import {
  formatCoreNotation,
  formatModifierNotation
} from './notationFormatters'
import {
  formatCoreDescriptions,
  formatModifierDescriptions
} from './stringFormatters'

function toDescription(options: RollConfig) {
  return [
    formatCoreDescriptions(options),
    ...formatModifierDescriptions(options)
  ]
}

function toNotation(options: RollConfig): DiceNotation {
  return `${formatCoreNotation(options)}${formatModifierNotation(options)}` as DiceNotation
}

export default { toDescription, toNotation }
