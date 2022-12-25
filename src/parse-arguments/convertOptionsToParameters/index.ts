import {
  DetailedType,
  DieType,
  InternalRollParameters,
  RandsumOptions,
  SecondaryRandsumOptions,
  UserOptions
} from 'types'
import { defaultRandomizer } from 'utils'

import normalizeModifiers from './normalizeModifiers'

export default function convertOptionsToParameters(
  options:
    | RandsumOptions<DieType, DetailedType>
    | SecondaryRandsumOptions<DieType, DetailedType>
    | UserOptions<DetailedType>
): InternalRollParameters {
  const { sides, quantity, modifiers, randomizer, faces } = {
    sides: undefined,
    quantity: undefined,
    modifiers: undefined,
    faces: undefined,
    ...options
  }

  const isCustomSides = Array.isArray(sides)
  const providedFaces = faces !== undefined
  const normalizedModifiers = providedFaces
    ? []
    : isCustomSides
    ? []
    : normalizeModifiers(modifiers || [])

  return {
    ...options,
    randomizer: randomizer || defaultRandomizer,
    faces: providedFaces ? faces : isCustomSides ? sides : undefined,
    sides: isCustomSides ? sides.length : Number(sides),
    quantity: Number(quantity || 1),
    modifiers: normalizedModifiers
  }
}
