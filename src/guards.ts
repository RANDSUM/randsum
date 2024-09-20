import {
  capPattern,
  coreNotationPattern,
  dropConstraintsPattern,
  dropHighestPattern,
  dropLowestPattern,
  explodePattern,
  minusPattern,
  plusPattern,
  replacePattern,
  rerollPattern,
  uniquePattern
} from '~patterns'
import {
  RandsumNotation,
  RandsumRollOptions,
  RandsumRollParameters,
  Modifiers,
  RandsumRollArgument
} from '~types'

const completeRollPattern = new RegExp(
  `${coreNotationPattern.source}|${dropHighestPattern.source}|${dropLowestPattern.source}|${dropConstraintsPattern.source}|${explodePattern.source}|${uniquePattern.source}|${replacePattern.source}|${rerollPattern.source}|${capPattern.source}|${plusPattern.source}|${minusPattern.source}`,
  'g'
)

export function isDiceNotation(argument: unknown): argument is RandsumNotation {
  const notAString = typeof argument !== 'string'
  const basicTest = !!coreNotationPattern.test(String(argument))
  if (!basicTest || notAString) return false

  const cleanArg = argument.replace(/\s/g, '')

  return cleanArg.replace(completeRollPattern, '').length === 0
}

export function isCustomSides(
  argument: RandsumRollArgument | undefined
): argument is string[] {
  return (
    Array.isArray(argument) && argument.every((arg) => typeof arg === 'string')
  )
}

export function isDicePoolOptions(
  argument: unknown
): argument is RandsumRollOptions {
  return (
    typeof argument === 'object' &&
    (argument as RandsumRollOptions).sides !== undefined
  )
}

export function isValidModifier(
  modifiers: unknown | Modifiers | undefined
): modifiers is Modifiers {
  return Object.keys(modifiers || {}).length > 0
}

export function isCustomParameters(
  poolParameters: RandsumRollParameters
): poolParameters is RandsumRollParameters<string> {
  return Array.isArray(poolParameters.options.sides)
}

export function isFullNumArray(arr: unknown[]): arr is number[] {
  return arr.every((item) => typeof item === 'number')
}
