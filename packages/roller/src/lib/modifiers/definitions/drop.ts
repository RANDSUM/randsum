import type { DropOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { dropSchema } from '@randsum/notation'
import { dropBehavior } from '../behaviors/drop'

export const dropModifier: ModifierDefinition<DropOptions> = {
  ...dropSchema,
  ...dropBehavior
}
