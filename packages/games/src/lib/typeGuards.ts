import type {
  DetailsFieldDef,
  DetailsLeafDef,
  IntegerOrInput,
  RandSumSpec,
  RollDefinition
} from './types'

/**
 * Matches keys like `rollFoo`, `rollBar`, etc. — the naming convention
 * for additional roll definitions beyond the base `roll` key.
 */
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const ROLL_KEY_PATTERN: RegExp = /^roll[A-Z][a-zA-Z]*$/

export function isRollDefinition(value: unknown): value is RollDefinition {
  if (typeof value !== 'object' || value === null) return false
  if (!('resolve' in value)) return false
  return 'dice' in value || 'dicePools' in value
}

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
 * Discovers all roll definitions in a spec by checking the `roll` key
 * and any keys matching ROLL_KEY_PATTERN (`rollFoo`, `rollBar`, etc.).
 */
export function getRollDefinitions(spec: RandSumSpec): Readonly<Record<string, RollDefinition>> {
  const patternKeys = Object.keys(spec).filter(k => ROLL_KEY_PATTERN.test(k))
  const rollKeys = ['roll', ...patternKeys]
  const entries = rollKeys
    .filter(key => isRollDefinition(spec[key]))
    .map(key => [key, spec[key] as RollDefinition] as const)
  return Object.fromEntries(entries)
}
