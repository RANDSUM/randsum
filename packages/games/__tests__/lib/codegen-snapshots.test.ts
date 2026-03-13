import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'bun:test'
import { format, resolveConfig } from 'prettier'

import { generateCode } from '../../src/lib/codegen'
import { resolveExternalRefs } from '../../src/lib/externalRefResolver'
import type { RandSumSpec } from '../../src/lib/types'

const packageDir = join(import.meta.dirname, '..', '..')
const srcDir = join(packageDir, 'src')

const specFiles = readdirSync(packageDir).filter(f => f.endsWith('.randsum.json'))

async function formatCode(code: string, filepath: string): Promise<string> {
  const config = await resolveConfig(filepath)
  return format(code, { ...(config ?? {}), parser: 'typescript' })
}

describe('codegen snapshot tests', () => {
  for (const specFile of specFiles) {
    const absPath = join(packageDir, specFile)
    const raw: unknown = JSON.parse(readFileSync(absPath, 'utf-8'))
    const spec = raw as RandSumSpec
    const expectedFile = join(srcDir, `${spec.shortcode}.generated.ts`)

    test(`${specFile} matches checked-in ${spec.shortcode}.generated.ts`, async () => {
      const resolved = await resolveExternalRefs(spec)
      const code = await generateCode(resolved)
      const formatted = await formatCode(code, expectedFile)
      const checkedIn = readFileSync(expectedFile, 'utf-8')
      expect(formatted).toBe(checkedIn)
    })
  }
})
