import type { ModifierDefinition } from '../schema'
import { minusSchema } from '../../notation/definitions/minus'
import { minusBehavior } from '../behaviors/arithmetic'
import { defineModifier } from '../registry'

export const minusModifier: ModifierDefinition<number> = defineModifier(minusSchema, minusBehavior)
