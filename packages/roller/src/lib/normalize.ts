import type { DiceNotation } from '../types'
import { NotationParseError } from '../errors'
import { notationToOptions } from '@randsum/notation'
import { optionsToNotation } from './transformers'

export function normalize(notation: DiceNotation): DiceNotation {
  const parsed = notationToOptions(notation)
  if (parsed.length !== 1) {
    throw new NotationParseError(notation, 'normalize() only supports single-segment notation')
  }
  const [options] = parsed
  if (options === undefined) {
    throw new NotationParseError(notation, 'Could not parse notation into options')
  }
  return optionsToNotation(options)
}

export function equate(a: DiceNotation, b: DiceNotation): boolean {
  return normalize(a) === normalize(b)
}
