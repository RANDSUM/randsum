export type SchemaErrorCode =
  | 'REF_NOT_FOUND'
  | 'INPUT_NOT_FOUND'
  | 'INVALID_INPUT_TYPE'
  | 'NO_TABLE_MATCH'
  | 'CONDITION_TYPE_MISMATCH'
  | 'INVALID_SPEC'

export class SchemaError extends Error {
  public readonly code: SchemaErrorCode

  constructor(code: SchemaErrorCode, message: string) {
    super(message)
    this.name = 'SchemaError'
    this.code = code
  }
}
