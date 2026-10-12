import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { curatedLlmsTxt, mergeLlmsTxt } from '../src/integrations/curated-llms-txt'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const rootLlmsTxt = path.resolve(testDir, '../../../llms.txt')
const builtLlmsTxt = path.resolve(testDir, '../dist/llms.txt')

const generated = '# Site Documentation\n\n- https://randsum.dev/roller/introduction/\n'

describe('curated llms.txt', () => {
  test('the repo-root source documents the HTTP roll endpoint', () => {
    expect(fs.readFileSync(rootLlmsTxt, 'utf-8')).toContain('/api/roll')
  })

  test('curated text leads and the generated page list follows under one H1', () => {
    const merged = mergeLlmsTxt('# RANDSUM\n\nPOST /api/roll\n', generated)
    expect(merged).toBe(
      '# RANDSUM\n\nPOST /api/roll\n\n## Documentation Pages\n\n- https://randsum.dev/roller/introduction/\n'
    )
    expect(merged.match(/^# /gm)).toHaveLength(1)
  })

  test('with nothing generated, the curated text stands alone', () => {
    expect(mergeLlmsTxt('# RANDSUM\n\n', undefined)).toBe('# RANDSUM\n')
  })

  test('the build:done hook rewrites the generated file in place', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llms-txt-'))
    fs.writeFileSync(path.join(dir, 'llms.txt'), generated)
    const hook = curatedLlmsTxt(rootLlmsTxt).hooks['astro:build:done']
    if (hook === undefined) throw new Error('missing astro:build:done hook')
    // The hook reads only `dir`; the rest of the build context is irrelevant here.
    void hook({ dir: pathToFileURL(`${dir}/`) } as Parameters<typeof hook>[0])
    const written = fs.readFileSync(path.join(dir, 'llms.txt'), 'utf-8')
    expect(written).toContain('/api/roll')
    expect(written).toContain('- https://randsum.dev/roller/introduction/')
    fs.rmSync(dir, { recursive: true })
  })

  // Catches the integration being moved ahead of starlight(), where
  // starlight-page-actions would overwrite it again. Runs after `bun run build`.
  test.skipIf(!fs.existsSync(builtLlmsTxt))('the built llms.txt carries /api/roll', () => {
    expect(fs.readFileSync(builtLlmsTxt, 'utf-8')).toContain('/api/roll')
  })
})
