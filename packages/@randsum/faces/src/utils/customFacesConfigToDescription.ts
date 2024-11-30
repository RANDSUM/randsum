import { formatCoreDescriptions } from '@randsum/core'
import type { CustomFacesRollConfig } from '../types'

export function customFacesConfigToDescriptions({
  quantity,
  faces,
  sides
}: CustomFacesRollConfig): string[] {
  return [
    formatCoreDescriptions({ quantity, sides }),
    `with faces: ${faces.join(', ')}`
  ]
}
