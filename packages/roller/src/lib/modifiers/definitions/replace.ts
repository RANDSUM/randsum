import type { ReplaceOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { replaceSchema } from '../../notation/definitions/replace'
import { replaceBehavior } from '../behaviors/replace'
import { defineModifier } from '../registry'

export const replaceModifier: ModifierDefinition<ReplaceOptions | ReplaceOptions[]> =
  defineModifier(replaceSchema, replaceBehavior)
