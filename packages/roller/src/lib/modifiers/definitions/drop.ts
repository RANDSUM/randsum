import type { DropOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { dropSchema } from '../../../notation/definitions/drop'
import { dropBehavior } from '../behaviors/drop'

export const dropModifier: ModifierDefinition<DropOptions> = {
  ...dropSchema,
  ...dropBehavior
}
