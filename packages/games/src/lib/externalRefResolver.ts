import { SchemaError } from './errors'
import type { RandSumSpec } from './types'

const EXTERNAL_REF_RE = /^https?:\/\//

function isExternalRef(value: unknown): value is { readonly $ref: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$ref' in value &&
    typeof (value as Record<string, unknown>)['$ref'] === 'string' &&
    EXTERNAL_REF_RE.test((value as { $ref: string }).$ref)
  )
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new SchemaError(
        `Failed to fetch external ref "${url}": HTTP ${response.status}`,
        'EXTERNAL_REF_FAILED'
      )
    }
    return await response.json()
  } catch (e) {
    if (e instanceof SchemaError) throw e
    throw new SchemaError(
      `Failed to fetch external ref "${url}": ${e instanceof Error ? e.message : String(e)}`,
      'EXTERNAL_REF_FAILED'
    )
  }
}

function resolvePointer(data: unknown, pointer: string, url: string): unknown {
  if (!pointer || pointer === '/') return data
  const segments = pointer.startsWith('/') ? pointer.slice(1).split('/') : pointer.split('/')
  return segments.reduce<unknown>((cur, seg) => {
    if (cur === null || typeof cur !== 'object') {
      throw new SchemaError(
        `Cannot resolve pointer "${pointer}" in "${url}": hit non-object at "${seg}"`,
        'EXTERNAL_REF_FAILED'
      )
    }
    const record = cur as Record<string, unknown>
    if (!(seg in record)) {
      throw new SchemaError(
        `Cannot resolve pointer "${pointer}" in "${url}": segment "${seg}" not found`,
        'EXTERNAL_REF_FAILED'
      )
    }
    return record[seg]
  }, data)
}

async function fetchAndResolve(ref: string): Promise<unknown> {
  const hashIdx = ref.indexOf('#')
  const url = hashIdx === -1 ? ref : ref.slice(0, hashIdx)
  const pointer = hashIdx === -1 ? '' : ref.slice(hashIdx + 1)
  const data = await fetchJson(url)
  return resolvePointer(data, pointer, url)
}

function collectExternalRefs(obj: unknown, refs: Set<string>): void {
  if (typeof obj !== 'object' || obj === null) return
  if (isExternalRef(obj)) {
    refs.add(obj.$ref)
    return
  }
  for (const val of Object.values(obj as Record<string, unknown>)) {
    collectExternalRefs(val, refs)
  }
}

function inlineRefs(obj: unknown, resolved: ReadonlyMap<string, unknown>): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (isExternalRef(obj)) return resolved.get(obj.$ref)
  if (Array.isArray(obj)) return obj.map(item => inlineRefs(item, resolved))
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, inlineRefs(v, resolved)])
  )
}

export async function resolveExternalRefs(spec: RandSumSpec): Promise<RandSumSpec> {
  const refs = new Set<string>()
  collectExternalRefs(spec, refs)
  if (refs.size === 0) return spec

  const entries = await Promise.all(
    Array.from(refs).map(async ref => {
      const value = await fetchAndResolve(ref)
      return [ref, value] as const
    })
  )

  const resolved = new Map(entries)
  return inlineRefs(spec, resolved) as RandSumSpec
}
