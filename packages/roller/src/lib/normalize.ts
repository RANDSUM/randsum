import type { DiceNotation } from '../types'
import { NotationParseError } from '../errors'
import { notationToOptions } from './notation'
import { optionsToNotation } from './transformers'

export function normalize(notation: DiceNotation): DiceNotation {
  const options = notationToOptions(notation)[0]
  if (options === undefined) {
    throw new NotationParseError(notation, 'Could not parse notation into options')
  }
  return optionsToNotation(options)
}

export function equate(a: DiceNotation, b: DiceNotation): boolean {
  return normalize(a) === normalize(b)
}
