import type { KeepOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { keepSchema } from '../../../notation/definitions/keep'
import { keepBehavior } from '../behaviors/keep'

export const keepModifier: ModifierDefinition<KeepOptions> = {
  ...keepSchema,
  ...keepBehavior
}
