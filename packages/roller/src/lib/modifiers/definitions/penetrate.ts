import type { ModifierDefinition } from '../schema'
import { penetrateSchema } from '../../../notation/definitions/penetrate'
import { penetrateBehavior } from '../behaviors/penetrate'

export const penetrateModifier: ModifierDefinition<boolean | number> = {
  ...penetrateSchema,
  ...penetrateBehavior
}
