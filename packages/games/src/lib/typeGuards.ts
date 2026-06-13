import type {
  DetailsFieldDef,
  DetailsLeafDef,
  IntegerOrInput,
  RandSumSpec,
  RollDefinition
} from './types'

export function isDetailsLeaf(def: DetailsFieldDef): def is DetailsLeafDef {
  return (
    '$input' in def ||
    'expr' in def ||
    '$pool' in def ||
    '$conditionalPool' in def ||
    '$dieCheck' in def
  )
}

export function isConditionalDetails(def: DetailsFieldDef): def is {
  readonly when: { readonly input: string }
  readonly value: Readonly<Record<string, DetailsLeafDef>>
} {
  return 'when' in def && 'value' in def
}

export function isInputRef(value: IntegerOrInput): value is { readonly $input: string } {
  return typeof value === 'object' && '$input' in value
}

export function isConditionalRef(value: IntegerOrInput): value is {
  readonly $input: string
  readonly ifTrue: number
  readonly ifFalse: number
} {
  return typeof value === 'object' && '$input' in value && 'ifTrue' in value && 'ifFalse' in value
}

/**
 * Returns a spec's roll definitions as a keyed record. A spec declares either a single
 * `roll` (keyed as `roll`) or multiple named `rolls`. Validation guarantees exactly one
 * of the two is present; an empty record is returned only for an already-invalid spec.
 */
export function getRollDefinitions(spec: RandSumSpec): Readonly<Record<string, RollDefinition>> {
  if (spec.rolls !== undefined) return spec.rolls
  if (spec.roll !== undefined) return { roll: spec.roll }
  return {}
}
