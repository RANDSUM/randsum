import type { CustomFacesDiceNotation, CustomFacesRollConfig } from '../types'

export function customConfigToCustomFacesNotation({
  quantity,
  faces
}: CustomFacesRollConfig): CustomFacesDiceNotation {
  return `${quantity}d{${faces.join('')}}`
}
