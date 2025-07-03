import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  PlusModifier,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '../modifiers'

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const coreNotationPattern: RegExp = /^\d+[Dd](\d+|{.*})/

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const completeRollPattern: RegExp = new RegExp(
  [
    coreNotationPattern.source,
    DropModifier.highestPattern.source,
    DropModifier.lowestPattern.source,
    DropModifier.constraintsPattern.source,
    ExplodeModifier.pattern.source,
    UniqueModifier.pattern.source,
    ReplaceModifier.pattern.source,
    RerollModifier.pattern.source,
    CapModifier.pattern.source,
    PlusModifier.pattern.source,
    MinusModifier.pattern.source
  ].join('|'),
  'g'
)
