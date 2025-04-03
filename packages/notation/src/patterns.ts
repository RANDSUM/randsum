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

//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const coreNotationPattern: RegExp = /^\d+[Dd](\d+|{.*})/
//eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const completeRollPattern: RegExp = new RegExp(
  [
    coreNotationPattern.source,
    DropModifier.highestPattern,
    DropModifier.lowestPattern,
    DropModifier.constraintsPattern,
    ExplodeModifier.pattern,
    UniqueModifier.pattern,
    ReplaceModifier.pattern,
    RerollModifier.pattern,
    CapModifier.pattern,
    PlusModifier.pattern,
    MinusModifier.pattern
  ].join('|'),
  'g'
)
