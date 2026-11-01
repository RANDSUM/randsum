// The ./schema subpath: the codegen and validation toolkit.
export { resolveExternalRefs } from './lib/externalRefResolver'
export { generateCode, specToFilename } from './lib/codegen'
export { validateSpec } from './lib/validator'
export { SchemaError } from './lib/errors'
export { lookupByRange } from './lib/lookupByRange'

export type { GenerateCodeOptions } from './lib/codegen'
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
