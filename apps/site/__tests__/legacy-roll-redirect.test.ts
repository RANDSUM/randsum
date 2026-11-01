import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const redirects = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/_redirects'),
  'utf-8'
)

describe('retired randsum.dev/api/roll', () => {
  test('both spellings 308 to the RANDSUM API, keeping the method and body', () => {
    for (const from of ['/api/roll', '/api/roll/']) {
      const rule = redirects.split('\n').find(line => line.split(/\s+/)[0] === from)
      expect(rule?.split(/\s+/).slice(1)).toEqual(['https://api.randsum.dev/v1/roll', '308'])
    }
  })

  test('no Worker script is left to serve it', () => {
    const config = fs.readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../wrangler.jsonc'),
      'utf-8'
    )
    expect(config).not.toContain('"main"')
    expect(config).not.toContain('run_worker_first')
  })
})
