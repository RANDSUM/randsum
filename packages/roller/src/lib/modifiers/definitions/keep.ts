import type { KeepOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { keepSchema } from '../../notation/definitions/keep'
import { keepBehavior } from '../behaviors/keep'
import { defineModifier } from '../registry'

export const keepModifier: ModifierDefinition<KeepOptions> = defineModifier(
  keepSchema,
  keepBehavior
)
