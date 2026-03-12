import Ajv from 'ajv/dist/2019'

import schema from '../randsum.json'

export interface ValidationError {
  readonly path: string
  readonly message: string
}

export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: readonly ValidationError[] }

const ajv = new Ajv({ allErrors: true })
const _validate = ajv.compile(schema)

export function validateSpec(spec: unknown): ValidationResult {
  const valid = _validate(spec)
  if (valid) return { valid: true }

  const errors: ValidationError[] = (_validate.errors ?? []).map(e => ({
    path: e.instancePath || '/',
    message: e.message ?? 'unknown error'
  }))

  return { valid: false, errors }
}
