import { configToDescription } from '@randsum/core'

import { isDiceNotation } from './guards'
import type { DiceNotation, NotationValidationResult } from './types'
import { notationToRollConfig } from './utils/notationToRollConfig'
import { configToNotation } from './utils/configToNotation'

function validateNotation(
  notation: DiceNotation
): NotationValidationResult<true>
function validateNotation(
  notation: DiceNotation | string
): NotationValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      notation: undefined,
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

export { validateNotation }
