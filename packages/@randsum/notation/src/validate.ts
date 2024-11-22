import {
  configToDescription,
  configToNotation,
  type DiceNotation
} from '@randsum/core'

import { isDiceNotation } from './guards'
import type { NotationValidationResult } from './types'
import { notationToRollConfig } from './utils/notationToRollConfig'

export function validate(
  notation: DiceNotation | string
): NotationValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      notation,
      config: undefined,
      description: undefined
    }
  }

  const config = notationToRollConfig(notation)
  return {
    valid: true,
    config,
    notation: configToNotation(config),
    description: configToDescription(config)
  }
}
