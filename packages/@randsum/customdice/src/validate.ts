import {
  validate as validateCore,
  type NotationValidationResult
} from '@randsum/notation'
import { isCustomDiceNotation } from './guards'
import { customNotationToCustomRollConfig } from './utils/customNotationToCustomRollConfig'
import type { CustomNotationValidationResult } from './types'
import { customConfigToCustomNotation } from './utils/customConfigToCustomNotation'
import { customConfigToDescriptions } from './utils/customConfigToDescription'

export function validate(
  notation: string
): CustomNotationValidationResult | NotationValidationResult {
  if (isCustomDiceNotation(notation)) {
    const config = customNotationToCustomRollConfig(notation)
    return {
      valid: true,
      notation: customConfigToCustomNotation(config),
      config,
      description: customConfigToDescriptions(config)
    }
  }
  return validateCore(notation)
}
