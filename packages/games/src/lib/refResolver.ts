import { SchemaError } from './errors'
import type { OutcomeOperation, PoolDefinition, RandSumSpec, Ref, TableDefinition } from './types'

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

function isPoolDefinition(value: unknown): value is PoolDefinition {
  if (typeof value !== 'object' || value === null) return false
  return 'sides' in value
}

function isTableDefinition(value: unknown): value is TableDefinition {
  if (typeof value !== 'object' || value === null) return false
  if (!('ranges' in value)) return false
  return Array.isArray((value as Record<string, unknown>)['ranges'])
}

function isOutcomeOperation(value: unknown): value is OutcomeOperation {
  if (typeof value !== 'object' || value === null) return false
  return 'ranges' in value || 'degreeOfSuccess' in value || 'tableLookup' in value
}

export function resolvePoolRef(spec: RandSumSpec, ref: string): PoolDefinition {
  const resolved = resolveRef(spec, ref)
  if (!isPoolDefinition(resolved)) {
    throw new SchemaError(
      'REF_NOT_FOUND',
      `Ref "${ref}" does not resolve to a PoolDefinition (expected object with "sides")`
    )
  }
  return resolved
}

export function resolveTableRef(spec: RandSumSpec, ref: string): TableDefinition {
  const resolved = resolveRef(spec, ref)
  if (!isTableDefinition(resolved)) {
    throw new SchemaError(
      'REF_NOT_FOUND',
      `Ref "${ref}" does not resolve to a TableDefinition (expected object with "ranges" array)`
    )
  }
  return resolved
}

export function resolveOutcomeRef(spec: RandSumSpec, ref: string): OutcomeOperation {
  const resolved = resolveRef(spec, ref)
  if (!isOutcomeOperation(resolved)) {
    throw new SchemaError(
      'REF_NOT_FOUND',
      `Ref "${ref}" does not resolve to an OutcomeOperation (expected "ranges", "degreeOfSuccess", or "tableLookup")`
    )
  }
  return resolved
}
