import Ajv from 'ajv/dist/2019'

import schema from '../../randsum.json'

/** One problem Ajv found in a spec: where (`path`) and what (`message`). */
export interface SpecValidationIssue {
  readonly path: string
  readonly message: string
}

export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: readonly SpecValidationIssue[] }

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true })
const _validate = ajv.compile(schema)

export function validateSpec(spec: unknown): ValidationResult {
  const valid = _validate(spec)
  if (valid) return { valid: true }

  const errors: SpecValidationIssue[] = (_validate.errors ?? []).map(e => ({
    path: e.instancePath || '/',
    message: e.message ?? 'unknown error'
  }))

  return { valid: false, errors }
}
