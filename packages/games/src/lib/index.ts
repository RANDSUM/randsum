export { resolveExternalRefs } from './externalRefResolver'
export { loadSpec, loadSpecAsync } from './loader'
export { generateCode, specToFilename } from './codegen'
export type { GenerateCodeOptions } from './codegen'
export { validateSpec } from './validator'
export { SchemaError } from './errors'
export { lookupByRange } from './lookupByRange'
export {
  getRollDefinitions,
  isConditionalDetails,
  isConditionalRef,
  isDetailsLeaf,
  isInputRef,
  isRollDefinition,
  ROLL_KEY_PATTERN
} from './typeGuards'
export { roll as executeRoll } from '@randsum/roller/roll'
export { validateFinite, validateRange } from '@randsum/roller/validate'
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
  ConditionalPool,
  RemoteTableLookupOperation,
  ResultMappingLeaf,
  DetailsLeafDef,
  DetailsFieldDef
} from './types'
