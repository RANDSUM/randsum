import {
  ArithmeticModifier,
  CapModifier,
  DropModifier,
  ExplodeModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../modifiers'
import { coreNotationPattern } from './coreNotationPattern'

const completeRollPatternSource = [
  coreNotationPattern.source,
  DropModifier.highestPattern.source,
  DropModifier.lowestPattern.source,
  DropModifier.constraintsPattern.source,
  ExplodeModifier.pattern.source,
  UniqueModifier.pattern.source,
  ReplaceModifier.pattern.source,
  RerollModifier.pattern.source,
  CapModifier.pattern.source,
  ArithmeticModifier.plusPattern.source,
  ArithmeticModifier.minusPattern.source
].join('|')

export const completeRollPattern: RegExp = new RegExp(
  completeRollPatternSource,
  'g'
) satisfies RegExp
