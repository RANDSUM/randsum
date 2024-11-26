import type { CustomDiceNotation, CustomRollConfig } from '../types'

export function customConfigToCustomNotation({
  quantity,
  faces
}: CustomRollConfig): CustomDiceNotation {
  return `${quantity}d${faces.join('')}`
}
