import {
  validateNotation,
  type NotationValidationResult
} from '@randsum/notation'
import { isCustomFacesDiceNotation } from './guards'
import type { CustomFacesNotationValidationResult } from './types'
import { customConfigToCustomFacesNotation } from './utils/customFacesConfigToCustomFacesNotation'
import { customFacesConfigToDescriptions } from './utils/customFacesConfigToDescription'
import { customFacesNotationToCustomFacesRollConfig } from './utils/customFacesNotationToCustomFacesRollConfig'

export function validateCustomFacesNotation(
  notation: string
): CustomFacesNotationValidationResult | NotationValidationResult {
  if (isCustomFacesDiceNotation(notation)) {
    const config = customFacesNotationToCustomFacesRollConfig(notation)
    return {
      valid: true,
      notation: customConfigToCustomFacesNotation(config),
      config,
      description: customFacesConfigToDescriptions(config)
    }
  }
  return validateNotation(notation)
}
