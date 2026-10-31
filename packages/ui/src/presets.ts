// A preset is a named roll. Every roller takes an optional `presets` list and
// keeps its keys first; each modifier's canonical presets are the examples its
// docs already teach, so the docs and the components never drift apart.
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { MODIFIER_TABLE } from './modifiers'
import type { ModifierName } from './modifiers'

export type { ModifierName } from './modifiers'

export interface Preset {
  /** What the preset button shows. */
  readonly label: string
  readonly notation: string
  /** A plain-language line, shown beside or under the label. */
  readonly description?: string
}

/** The documented examples for one modifier, as presets. */
export function modifierPresets(name: ModifierName): readonly Preset[] {
  return MODIFIER_TABLE[name].docKeys.flatMap(key =>
    (NOTATION_DOCS[key]?.examples ?? []).map(example => ({
      label: example.notation,
      notation: example.notation,
      description: example.description
    }))
  )
}
