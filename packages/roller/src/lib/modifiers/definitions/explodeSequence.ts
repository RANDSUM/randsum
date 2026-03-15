import type { ModifierDefinition } from '../schema'
import { explodeSequenceSchema } from '@randsum/notation'
import { explodeSequenceBehavior } from '../behaviors/explodeSequence'

export const explodeSequenceModifier: ModifierDefinition<number[]> = {
  ...explodeSequenceSchema,
  ...explodeSequenceBehavior
}
