import { describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const TMP_DIR = resolve(import.meta.dir, '../.tmp-test-build')
const SPEC_PATH = resolve(import.meta.dir, './fixtures/test.randsum.json')

describe('bin-build CLI integration', () => {
  test(
    'generates a .ts file from a valid spec',
    async () => {
      mkdirSync(TMP_DIR, { recursive: true })
      try {
        const result = await Bun.spawn([
          'bun',
          'run',
          resolve(import.meta.dir, '../../src/lib/bin-build.ts'),
          SPEC_PATH,
          '--out',
          TMP_DIR
        ]).exited
        expect(result).toBe(0)
        expect(existsSync(resolve(TMP_DIR, 'test.generated.ts'))).toBe(true)
      } finally {
        rmSync(TMP_DIR, { recursive: true, force: true })
      }
    },
    { timeout: 30_000 }
  )
})
