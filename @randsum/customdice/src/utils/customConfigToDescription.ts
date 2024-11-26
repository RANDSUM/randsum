import { formatCoreDescriptions } from '@randsum/core'
import type { CustomRollConfig } from '../types'

export function customConfigToDescriptions({
  quantity,
  faces,
  sides
}: CustomRollConfig): string[] {
  return [
    formatCoreDescriptions({ quantity, sides }),
    `with faces: ${faces.join(', ')}`
  ]
}
