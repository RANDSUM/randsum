import { SchemaError } from './errors'
import type { RandSumSpec, Ref } from './types'

export function isRef(value: unknown): value is Ref {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$ref' in value &&
    typeof (value as Record<string, unknown>)['$ref'] === 'string'
  )
}

export function resolveRef(spec: RandSumSpec, ref: string): unknown {
  // Strip leading '#/' and split into segments
  const path = ref.startsWith('#/') ? ref.slice(2) : ref
  const segments = path.split('/')

  return segments.reduce<unknown>((current: unknown, segment) => {
    if (current === null || typeof current !== 'object') {
      throw new SchemaError(
        'REF_NOT_FOUND',
        `Cannot resolve ref "${ref}": hit non-object at "${segment}"`
      )
    }
    const record = current as Record<string, unknown>
    if (!(segment in record)) {
      throw new SchemaError(
        'REF_NOT_FOUND',
        `Cannot resolve ref "${ref}": segment "${segment}" not found`
      )
    }
    return record[segment]
  }, spec)
}
