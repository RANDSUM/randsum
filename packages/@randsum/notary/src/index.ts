import { coreNotationPattern } from './patterns'
import type { DiceNotation, RollConfig } from '@randsum/core'
import { OptionsModel } from '@randsum/core'
import { parseCoreNotation, parseModifiers } from './optionsParsers'
import { isDiceNotationArg } from './guards'
import type { NotationValidationResult } from './types'

function toOptions(notationString: DiceNotation): RollConfig {
  const coreNotationMatch = notationString.match(coreNotationPattern)!.at(0)!

  return {
    ...parseCoreNotation(coreNotationMatch),
    ...parseModifiers(notationString.replace(coreNotationMatch, ''))
  }
}

function validate(notation: DiceNotation | string): NotationValidationResult {
  const isValid = isDiceNotationArg(notation)

  const rollConfig = isValid ? toOptions(notation) : undefined
  return {
    valid: isValid,
    notation: rollConfig ? OptionsModel.toNotation(rollConfig) : notation,
    config: rollConfig,
    description: isValid
      ? OptionsModel.toDescription(toOptions(notation))
      : undefined
  }
}

export default { toOptions, validate }
