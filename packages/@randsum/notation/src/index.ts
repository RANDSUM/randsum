import type { DiceNotation, RollConfig } from '@randsum/core'
import { RollConfigModel } from '@randsum/core'

import { coreNotationPattern } from './patterns'
import { parseCoreNotation, parseModifiers } from './optionsParsers'
import { isDiceNotation } from './guards'
import type { NotationValidationResult } from './types'

function toRollConfig(notationString: DiceNotation): RollConfig {
  const coreNotationMatch = notationString.match(coreNotationPattern)!.at(0)!

  return {
    ...parseCoreNotation(coreNotationMatch),
    ...parseModifiers(notationString.replace(coreNotationMatch, ''))
  }
}

function validate(notation: DiceNotation | string): NotationValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      notation,
      config: undefined,
      description: undefined
    }
  }

  const config = toRollConfig(notation)
  return {
    valid: true,
    config,
    notation: RollConfigModel.toNotation(config),
    description: RollConfigModel.toDescription(config)
  }
}

export default { validate }
