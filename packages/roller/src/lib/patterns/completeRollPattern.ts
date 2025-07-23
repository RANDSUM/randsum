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

const completeRollPatternSource = [
  coreNotationPattern.source,
  dropHighestPattern.source,
  dropLowestPattern.source,
  dropConstraintsPattern.source,
  explodePattern.source,
  uniquePattern.source,
  replacePattern.source,
  rerollPattern.source,
  capPattern.source,
  plusPattern.source,
  minusPattern.source
].join('|')

export const completeRollPattern: RegExp = new RegExp(
  completeRollPatternSource,
  'g'
) satisfies RegExp
