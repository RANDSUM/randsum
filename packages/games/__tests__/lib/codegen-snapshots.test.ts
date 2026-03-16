import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'bun:test'
import { format, resolveConfig } from 'prettier'

import { generateCode } from '../../src/lib/codegen'
import { resolveExternalRefs } from '../../src/lib/externalRefResolver'
import type { RandSumSpec } from '../../src/lib/types'

const packageDir = join(import.meta.dirname, '..', '..')
const srcDir = join(packageDir, 'src')
const fixturesDir = join(packageDir, '__fixtures__')

const specFiles = readdirSync(packageDir).filter(f => f.endsWith('.randsum.json'))

async function formatCode(code: string, filepath: string): Promise<string> {
  const config = await resolveConfig(filepath)
  return format(code, { ...(config ?? {}), parser: 'typescript' })
}

function loadRemoteDataCache(spec: RandSumSpec): ReadonlyMap<string, readonly unknown[]> {
  const cache = new Map<string, readonly unknown[]>()
  const roll = spec.roll as Record<string, unknown> | undefined
  const resolve = roll?.resolve as Record<string, unknown> | undefined
  const rtl = resolve?.remoteTableLookup as Record<string, unknown> | undefined
  const url = typeof rtl?.url === 'string' ? rtl.url : undefined
  if (url) {
    const fixturePath = join(fixturesDir, `${spec.shortcode}-tables.json`)
    if (existsSync(fixturePath)) {
      const data = JSON.parse(readFileSync(fixturePath, 'utf-8')) as readonly unknown[]
      cache.set(url, data)
    }
  }
  return cache
}

describe('codegen snapshot tests', () => {
  for (const specFile of specFiles) {
    const absPath = join(packageDir, specFile)
    const raw: unknown = JSON.parse(readFileSync(absPath, 'utf-8'))
    const spec = raw as RandSumSpec
    const expectedFile = join(srcDir, `${spec.shortcode}.generated.ts`)

    test(
      `${specFile} matches checked-in ${spec.shortcode}.generated.ts`,
      async () => {
        const resolved = await resolveExternalRefs(spec)
        const remoteDataCache = loadRemoteDataCache(resolved)
        const code = await generateCode(resolved, { remoteDataCache })
        const formatted = await formatCode(code, expectedFile)
        const checkedIn = readFileSync(expectedFile, 'utf-8')
        expect(formatted).toBe(checkedIn)
      },
      { timeout: 120_000 }
    )
  }
})
