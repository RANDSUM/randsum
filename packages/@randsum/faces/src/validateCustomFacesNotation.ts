import {
  validate as validateCore,
  type NotationValidationResult
} from '@randsum/notation'
import { isCustomDiceNotation } from './guards'
import type { CustomFacesNotationValidationResult } from './types'
import { customConfigToCustomFacesNotation } from './utils/customFacesConfigToCustomFacesNotation'
import { customFacesConfigToDescriptions } from './utils/customFacesConfigToDescription'
import { customFacesNotationToCustomFacesRollConfig } from './utils/customFacesNotationToCustomFacesRollConfig'

export function validateCustomFacesNotation(
  notation: string
): CustomFacesNotationValidationResult | NotationValidationResult {
  if (isCustomDiceNotation(notation)) {
    const config = customFacesNotationToCustomFacesRollConfig(notation)
    return {
      valid: true,
      notation: customConfigToCustomFacesNotation(config),
      config,
      description: customFacesConfigToDescriptions(config)
    }
  }
  return validateCore(notation)
}
