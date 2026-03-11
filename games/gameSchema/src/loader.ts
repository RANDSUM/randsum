import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { SchemaError } from './errors'
import { executePipeline } from './pipeline'
import type { GameRollResult, LoadedSpec, RandSumSpec, RollDefinition, RollInput } from './types'
import { validateSpec } from './validator'

function isRollDefinition(value: unknown): value is RollDefinition {
  return typeof value === 'object' && value !== null && 'dice' in value && 'resolve' in value
}

function assertValidSpec(spec: unknown): asserts spec is RandSumSpec {
  const result = validateSpec(spec)
  if (!result.valid) {
    const summary = result.errors.map(e => `${e.path}: ${e.message}`).join('; ')
    throw new SchemaError('INVALID_SPEC', `Invalid spec: ${summary}`)
  }
}

function specToLoadedSpec(spec: RandSumSpec): LoadedSpec {
  const patternKeys = Object.keys(spec).filter(k => /^roll[A-Z][a-zA-Z]*$/.test(k))
  const rollKeys = ['roll', ...patternKeys]

  const entries = rollKeys
    .filter(key => isRollDefinition(spec[key]))
    .map(key => {
      const rollDef = spec[key] as RollDefinition
      const fn = (input?: RollInput): GameRollResult => executePipeline(rollDef, input ?? {}, spec)
      return [key, fn] as const
    })

  return Object.fromEntries(entries) as LoadedSpec
}

export function loadSpec(input: RandSumSpec | string): LoadedSpec {
  if (typeof input === 'string') {
    const parsed: unknown = JSON.parse(readFileSync(input, 'utf-8'))
    assertValidSpec(parsed)
    return specToLoadedSpec(parsed)
  }
  assertValidSpec(input)
  return specToLoadedSpec(input)
}

export async function loadSpecAsync(input: RandSumSpec | string): Promise<LoadedSpec> {
  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`)
      }
      const parsed: unknown = await response.json()
      assertValidSpec(parsed)
      return specToLoadedSpec(parsed)
    }
    const parsed: unknown = JSON.parse(await readFile(input, 'utf-8'))
    assertValidSpec(parsed)
    return specToLoadedSpec(parsed)
  }
  assertValidSpec(input)
  return specToLoadedSpec(input)
}
