import type { ModifierDefinition } from '../schema'
import { plusSchema } from '@randsum/notation/schemas'
import { plusBehavior } from '../behaviors/arithmetic'
import { defineModifier } from '../registry'

export const plusModifier: ModifierDefinition<number> = defineModifier(plusSchema, plusBehavior)
