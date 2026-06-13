// Bun's bundler does not follow `export { X } from './Y'` re-exports,
// producing empty output. Importing into local bindings and then
// re-exporting forces the bundler to resolve and include each module.
//
// The `as typeof` cast preserves the original function signature in
// the type system while satisfying isolatedDeclarations.
import { resolveExternalRefs as _resolveExternalRefs } from './lib/externalRefResolver'
import { generateCode as _generateCode, specToFilename as _specToFilename } from './lib/codegen'
import { validateSpec as _validateSpec } from './lib/validator'
import { SchemaError as _SchemaError } from './lib/errors'
import { lookupByRange as _lookupByRange } from './lib/lookupByRange'

import type { RandSumSpec } from './lib/types'
import type { ValidationResult } from './lib/validator'

export const resolveExternalRefs: (spec: RandSumSpec) => Promise<RandSumSpec> = _resolveExternalRefs
export const generateCode: (spec: RandSumSpec) => Promise<string> = _generateCode
export const specToFilename: (name: string) => string = _specToFilename
export const validateSpec: (spec: unknown) => ValidationResult = _validateSpec
export const SchemaError: typeof _SchemaError = _SchemaError
export const lookupByRange: (
  table: Readonly<Record<string, unknown>>,
  value: number
) => {
  readonly key: string
  readonly result: { readonly label?: string | undefined; readonly value?: string | undefined }
} = _lookupByRange

export type { SchemaErrorCode } from './lib/errors'
export type { ValidationResult, ValidationError } from './lib/validator'
export type {
  RandSumSpec,
  GameRollResult,
  RollDefinition,
  PoolDefinition,
  TableDefinition,
  TableRange,
  DiceConfig,
  ModifyOperation,
  ResolveOperation,
  OutcomeOperation,
  Condition,
  RollCase,
  PipelineOverride,
  InputDeclaration,
  InputValue,
  IntegerOrInput,
  Ref,
  RefOrTableDefinition,
  DegreeOfSuccessOperation,
  CountMatchingOperation,
  ComparePoolOperation,
  CapOperation,
  MarkDiceOperation,
  PoolCondition,
  PostResolveModifyOperation,
  ConditionalPool,
  RemoteTableLookupOperation,
  ResultMappingLeaf,
  DetailsLeafDef,
  DetailsFieldDef
} from './lib/types'
