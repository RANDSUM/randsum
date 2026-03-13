import type {
  ComparePoolOperation,
  Condition,
  CountMatchingOperation,
  DegreeOfSuccessOperation,
  InputDeclaration,
  IntegerOrInput,
  ModifyOperation,
  PostResolveModifyOperation,
  RemoteTableLookupOperation,
  TableDefinition,
  TableRange
} from './types'

// ---- Pool (ref-free) ----

export interface NormalizedPoolDefinition {
  readonly sides: IntegerOrInput
  readonly quantity?: IntegerOrInput
}

// ---- Dice config (pool always materialized) ----

export interface NormalizedDiceConfig {
  readonly pool: NormalizedPoolDefinition
  readonly quantity?: IntegerOrInput
  readonly key?: string
}

// ---- Resolve operation (tableLookup ref-free) ----

export type NormalizedResolveOperation =
  | 'sum'
  | { readonly countMatching: CountMatchingOperation }
  | { readonly tableLookup: TableDefinition }
  | { readonly comparePoolHighest: ComparePoolOperation }
  | { readonly comparePoolSum: ComparePoolOperation }
  | { readonly remoteTableLookup: RemoteTableLookupOperation }

// ---- Outcome (always concrete, never Ref) ----

export type NormalizedOutcome =
  | { readonly ranges: readonly TableRange[] }
  | { readonly degreeOfSuccess: DegreeOfSuccessOperation }
  | { readonly tableLookup: TableDefinition }

// ---- Details (discriminated with kind) ----

export type NormalizedDetailsLeafDef =
  | { readonly $input: string; readonly default?: number | string | boolean }
  | { readonly expr: 'diceTotal' | 'total' }
  | { readonly $pool: string; readonly field: 'total' }
  | { readonly $conditionalPool: string; readonly field: 'total' }

export type NormalizedDetailsFieldDef =
  | {
      readonly kind: 'leaf'
      readonly def: NormalizedDetailsLeafDef
    }
  | {
      readonly kind: 'nested'
      readonly fields: Readonly<Record<string, NormalizedDetailsLeafDef>>
    }
  | {
      readonly kind: 'conditional'
      readonly when: { readonly input: string }
      readonly fields: Readonly<Record<string, NormalizedDetailsLeafDef>>
    }

// ---- Conditional pool (ref-free) ----

export interface NormalizedConditionalPool {
  readonly condition: Condition
  readonly pool: NormalizedPoolDefinition
  readonly arithmetic: 'add' | 'subtract'
}

// ---- Pipeline override (ref-free) ----

export interface NormalizedPipelineOverride {
  readonly dice?: NormalizedDiceConfig | readonly NormalizedDiceConfig[]
  readonly modify?: readonly ModifyOperation[]
  readonly resolve?: NormalizedResolveOperation
  readonly outcome?: NormalizedOutcome
  readonly postResolveModifiers?: readonly PostResolveModifyOperation[]
}

// ---- Roll case (ref-free) ----

export interface NormalizedRollCase {
  readonly condition: Condition
  readonly override: NormalizedPipelineOverride
}

// ---- Roll definition (fully resolved) ----

export interface NormalizedRollDefinition {
  readonly inputs?: Readonly<Record<string, InputDeclaration>>
  readonly dice?: NormalizedDiceConfig | readonly NormalizedDiceConfig[]
  readonly dicePools?: Readonly<Record<string, NormalizedDiceConfig>>
  readonly conditionalPools?: Readonly<Record<string, NormalizedConditionalPool>>
  readonly modify?: readonly ModifyOperation[]
  readonly postResolveModifiers?: readonly PostResolveModifyOperation[]
  readonly resolve: NormalizedResolveOperation
  readonly outcome?: NormalizedOutcome
  readonly when?: readonly NormalizedRollCase[]
  readonly details?: Readonly<Record<string, NormalizedDetailsFieldDef>>
}

// ---- Top-level normalized spec ----

export interface NormalizedSpec {
  readonly name: string
  readonly shortcode: string
  readonly version?: string
  readonly game_url: string
  readonly srd_url?: string
  readonly rolls: Readonly<Record<string, NormalizedRollDefinition>>
}
