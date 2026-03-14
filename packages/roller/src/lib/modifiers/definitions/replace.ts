import type { ReplaceOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { replaceSchema } from '@randsum/notation/schemas'
import { replaceBehavior } from '../behaviors/replace'
import { defineModifier } from '../registry'

export const replaceModifier: ModifierDefinition<ReplaceOptions | ReplaceOptions[]> =
  defineModifier(replaceSchema, replaceBehavior)
