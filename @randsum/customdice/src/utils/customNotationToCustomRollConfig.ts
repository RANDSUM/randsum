import type { DiceNotation } from '@randsum/core'
import { customCoreNotationPattern } from '../patterns'
import type {
  CustomDiceNotation,
  CustomRollConfig,
  RequiredCustomCoreDiceParameters
} from '../types'
import { isDiceNotation } from '@randsum/notation'
import { argumentToRollConfig } from '@randsum/tower'
import { facesFromSides } from './facesFromSides'

export function parseCustomCoreNotation(
  notationString: string
): RequiredCustomCoreDiceParameters {
  const [quantity, rawFaces] = notationString.split(/[Dd]/)
  const faces = rawFaces.replace('{', '').replace('}', '').split('')

  return {
    quantity: Number(quantity),
    sides: Number(faces.length),
    faces
  }
}

export function customNotationToCustomRollConfig(
  notationString: CustomDiceNotation | DiceNotation
): CustomRollConfig {
  if (isDiceNotation(notationString)) {
    const { quantity, sides } = argumentToRollConfig(notationString)
    return {
      quantity,
      sides,
      faces: facesFromSides(sides)
    }
  }

  const customCoreNotationMatch = notationString
    .match(customCoreNotationPattern)!
    .at(0)!

  return parseCustomCoreNotation(customCoreNotationMatch)
}
