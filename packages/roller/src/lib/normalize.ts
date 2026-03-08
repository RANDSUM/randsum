import type { DiceNotation } from '../types'
import type { RandsumError } from '../errors'
import { NotationParseError } from '../errors'
import { notationToOptions } from './notation'
import { optionsToNotation } from './transformers'

export type NormalizeResult =
  | { value: DiceNotation; error: null }
  | { value: null; error: RandsumError }

export type EquateResult = { value: boolean; error: null } | { value: null; error: RandsumError }

export function normalize(notation: DiceNotation): NormalizeResult {
  const parsed = notationToOptions(notation)
  if (parsed.length !== 1) {
    return {
      value: null,
      error: new NotationParseError(notation, 'normalize() only supports single-segment notation')
    }
  }
  const [options] = parsed
  if (options === undefined) {
    return {
      value: null,
      error: new NotationParseError(notation, 'Could not parse notation into options')
    }
  }
  return { value: optionsToNotation(options), error: null }
}

export function equate(a: DiceNotation, b: DiceNotation): EquateResult {
  const normalizedA = normalize(a)
  if (normalizedA.error !== null) return { value: null, error: normalizedA.error }
  const normalizedB = normalize(b)
  if (normalizedB.error !== null) return { value: null, error: normalizedB.error }
  return { value: normalizedA.value === normalizedB.value, error: null }
}
