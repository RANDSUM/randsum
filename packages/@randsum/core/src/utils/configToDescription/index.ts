import type { RollConfig } from '../../types'
import {
  formatCoreDescriptions,
  formatModifierDescriptions
} from './stringFormatters'

export function configToDescription(options: RollConfig) {
  return [
    formatCoreDescriptions(options),
    ...formatModifierDescriptions(options)
  ]
}

export * from './stringFormatters'
