import { RandsumError } from '@randsum/roller/errors'

export type SchemaErrorCode =
  | 'REF_NOT_FOUND'
  | 'INPUT_NOT_FOUND'
  | 'INVALID_INPUT_TYPE'
  | 'NO_TABLE_MATCH'
  | 'CONDITION_TYPE_MISMATCH'
  | 'INVALID_SPEC'
  | 'EXTERNAL_REF_FAILED'

export class SchemaError extends RandsumError<SchemaErrorCode> {
  // Minified builds rename the class; keep SchemaError.name (and constructor.name) readable.
  static {
    Object.defineProperty(this, 'name', { value: 'SchemaError' })
  }

  constructor(message: string, code: SchemaErrorCode) {
    super(message, code)
    this.name = 'SchemaError'
  }
}
