import type { DropOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { dropSchema } from '@randsum/notation'
import { dropBehavior } from '../behaviors/drop'
import { defineModifier } from '../registry'

export const dropModifier: ModifierDefinition<DropOptions> = defineModifier(
  dropSchema,
  dropBehavior
)
