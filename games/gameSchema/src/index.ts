export { resolveExternalRefs } from './externalRefResolver'
export { loadSpec, loadSpecAsync } from './loader'
export { generateCode, specToFilename } from './codegen'
export { validateSpec } from './validator'
export { SchemaError } from './errors'
export { roll as executeRoll } from '@randsum/roller'
export type { RollRecord } from '@randsum/roller'
export type { SchemaErrorCode } from './errors'
export type { ValidationResult, ValidationError } from './validator'
export type {
  LoadedSpec,
  RandSumSpec,
  RollInput,
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
  ConditionalPool
} from './types'
