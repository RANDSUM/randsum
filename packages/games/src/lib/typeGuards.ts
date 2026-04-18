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
 * Returns the single `roll` definition from a spec as a keyed record,
 * preserving the callsites that iterate over `nspec.rolls`.
 */
export function getRollDefinitions(spec: RandSumSpec): Readonly<Record<string, RollDefinition>> {
  return { roll: spec.roll }
}
