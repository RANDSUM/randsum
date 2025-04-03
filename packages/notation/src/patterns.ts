import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '@randsum/core'

export const coreNotationPattern = /^\d+[Dd](\d+|{.*})/

export const completeRollPattern = new RegExp(
  [
    coreNotationPattern.source,
    (DropModifier.highestPattern as RegExp).source,
    (DropModifier.lowestPattern as RegExp).source,
    (DropModifier.constraintsPattern as RegExp).source,
    (ExplodeModifier.pattern as RegExp).source,
    (UniqueModifier.pattern as RegExp).source,
    (ReplaceModifier.pattern as RegExp).source,
    (RerollModifier.pattern as RegExp).source,
    (CapModifier.pattern as RegExp).source,
    (PlusModifier.pattern as RegExp).source,
    (MinusModifier.pattern as RegExp).source
  ].join('|'),
  'g'
)
