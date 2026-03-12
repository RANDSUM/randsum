export type IntegerOrInput =
  | number
  | { readonly $input: string }
  | { readonly $input: string; readonly ifTrue: number; readonly ifFalse: number }

export type InputValue = number | string | boolean

export interface PoolDefinition {
  readonly sides: IntegerOrInput
  readonly quantity?: IntegerOrInput
}

export interface PoolCondition {
  readonly pool?: 'preModify' | 'postModify'
  readonly countWhere: {
    readonly operator: '>' | '>=' | '<' | '<=' | '='
    readonly value: IntegerOrInput
  }
  readonly atLeast?: IntegerOrInput
  readonly atLeastRatio?: number
}

export interface TableRange {
  readonly result: string
  readonly min?: number
  readonly max?: number
  readonly exact?: number
  readonly poolCondition?: PoolCondition
}

export interface TableDefinition {
  readonly ranges: readonly TableRange[]
}

export interface Ref {
  readonly $ref: string
}

export type RefOrTableDefinition = Ref | TableDefinition

export interface DiceConfig {
  readonly pool: Ref | PoolDefinition
  readonly quantity?: IntegerOrInput
  readonly key?: string
}

export interface MarkDiceOperation {
  readonly operator: '>' | '>=' | '<' | '<=' | '='
  readonly value: IntegerOrInput
  readonly flag: string
}

export interface CapOperation {
  readonly min?: IntegerOrInput
  readonly max?: IntegerOrInput
}

export interface ModifyOperation {
  readonly keepHighest?: IntegerOrInput
  readonly keepLowest?: IntegerOrInput
  readonly add?: IntegerOrInput
  readonly cap?: CapOperation
  readonly markDice?: MarkDiceOperation
  readonly keepMarked?: string
}

export interface PostResolveModifyOperation {
  readonly add?: IntegerOrInput
}

export interface CountMatchingOperation {
  readonly operator: '>' | '>=' | '<' | '<=' | '='
  readonly value: IntegerOrInput
}

export interface ComparePoolOperation {
  readonly pools: readonly [string, string]
  readonly ties?: string
  readonly outcomes: Readonly<Record<string, string>>
}

export interface ExternalTableLookupOperation {
  readonly package: string
  readonly export: string
  readonly keyInput: string
  readonly lookupBy: string
}

export type ResolveOperation =
  | 'sum'
  | { readonly countMatching: CountMatchingOperation }
  | { readonly tableLookup: RefOrTableDefinition }
  | { readonly comparePoolHighest: ComparePoolOperation }
  | { readonly comparePoolSum: ComparePoolOperation }
  | { readonly externalTableLookup: ExternalTableLookupOperation }

export interface DegreeOfSuccessOperation {
  readonly criticalSuccess?: number
  readonly success?: number
  readonly failure?: number
  readonly criticalFailure?: number
}

export type OutcomeOperation =
  | { readonly ranges: readonly TableRange[] }
  | { readonly degreeOfSuccess: DegreeOfSuccessOperation }
  | { readonly tableLookup: RefOrTableDefinition }

export interface Condition {
  readonly input: string
  readonly operator: '=' | '>' | '>=' | '<' | '<='
  readonly value: InputValue
}

export interface PipelineOverride {
  readonly dice?: DiceConfig | readonly DiceConfig[]
  readonly modify?: readonly ModifyOperation[]
  readonly resolve?: ResolveOperation
  readonly outcome?: OutcomeOperation | Ref
  readonly postResolveModifiers?: readonly PostResolveModifyOperation[]
}

export interface RollCase {
  readonly condition: Condition
  readonly override: PipelineOverride
}

export interface InputDeclaration {
  readonly type: 'integer' | 'string' | 'boolean'
  readonly minimum?: number
  readonly maximum?: number
  readonly default?: InputValue
  readonly enum?: readonly InputValue[]
  readonly description?: string
}

export interface ConditionalPool {
  readonly condition: Condition
  readonly pool: PoolDefinition | Ref
  readonly arithmetic: 'add' | 'subtract'
}

export type DetailsFieldDef =
  | { readonly $input: string; readonly default?: InputValue }
  | { readonly expr: 'diceTotal' | 'total' }

export interface RollDefinition {
  readonly inputs?: Readonly<Record<string, InputDeclaration>>
  readonly dice?: DiceConfig | readonly DiceConfig[]
  readonly dicePools?: Readonly<Record<string, DiceConfig>>
  readonly conditionalPools?: readonly ConditionalPool[]
  readonly modify?: readonly ModifyOperation[]
  readonly postResolveModifiers?: readonly PostResolveModifyOperation[]
  readonly resolve: ResolveOperation
  readonly outcome?: OutcomeOperation | Ref
  readonly when?: readonly RollCase[]
  readonly details?: Readonly<Record<string, DetailsFieldDef>>
}

export interface RandSumSpec {
  readonly $schema: string
  readonly name: string
  readonly shortcode: string
  readonly version?: string
  readonly game_url: string
  readonly srd_url?: string
  readonly pools?: Readonly<Record<string, PoolDefinition>>
  readonly tables?: Readonly<Record<string, TableDefinition>>
  readonly outcomes?: Readonly<Record<string, OutcomeOperation>>
  readonly [key: string]: unknown
}

import type { GameRollResult, RollRecord } from '@randsum/roller'

export type { GameRollResult, RollRecord }

export type RollInput = Readonly<Record<string, InputValue>>

export type LoadedSpec = Readonly<
  Record<
    string,
    (
      input?: RollInput
    ) => GameRollResult<
      string | number,
      Readonly<Record<string, InputValue | number>> | undefined,
      RollRecord
    >
  >
>
