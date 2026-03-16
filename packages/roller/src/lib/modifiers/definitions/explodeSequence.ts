import type { ModifierDefinition } from '../schema'
import { explodeSequenceSchema } from '../../../notation/definitions/explodeSequence'
import { explodeSequenceBehavior } from '../behaviors/explodeSequence'

export const explodeSequenceModifier: ModifierDefinition<number[]> = {
  ...explodeSequenceSchema,
  ...explodeSequenceBehavior
}
