import { notationToRollConfig } from '@randsum/notation'
import type { CustomDiceNotation, CustomRollConfig } from '../types'
import type { DiceNotation } from '@randsum/core'

// Hmmm.
export function customNotationToCustomRollConfig(
  notation: CustomDiceNotation
): CustomRollConfig {
  return notationToRollConfig(notation as DiceNotation) as CustomRollConfig
}
