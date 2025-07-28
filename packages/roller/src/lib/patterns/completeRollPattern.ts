import { coreNotationPattern } from './coreNotationPattern'
import {
  capPattern,
  dropConstraintsPattern,
  dropHighestPattern,
  dropLowestPattern,
  explodePattern,
  minusPattern,
  plusPattern,
  replacePattern,
  rerollPattern,
  uniquePattern
} from './modifierPatterns'

const modifierPatterns = [
  dropHighestPattern,
  dropLowestPattern,
  dropConstraintsPattern,
  explodePattern,
  uniquePattern,
  replacePattern,
  rerollPattern,
  capPattern,
  plusPattern,
  minusPattern
]

const completeRollPatternSource = [
  coreNotationPattern.source,
  ...modifierPatterns.map(pattern => pattern.source)
].join('|')

export const completeRollPattern: RegExp = new RegExp(
  completeRollPatternSource,
  'g'
) satisfies RegExp
