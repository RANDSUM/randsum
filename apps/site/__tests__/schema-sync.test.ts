import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The games meta-schema is authored once at packages/games/randsum.json and
// hosted at its declared `$id` (https://randsum.dev/schemas/v1/randsum.json).
// The checked-in public/ copy (served by `astro dev`) must never drift from the
// source of truth. Production also gets a fresh copy at build time via the
// copy-schema-to-dist integration, but this test guards the dev/public copy.
const testDir = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.resolve(testDir, '../../../packages/games/randsum.json')
const hostedPath = path.resolve(testDir, '../public/schemas/v1/randsum.json')

describe('games meta-schema hosting', () => {
  test('source of truth exists and declares the hosted $id', () => {
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf-8')) as { $id?: string }
    expect(source.$id).toBe('https://randsum.dev/schemas/v1/randsum.json')
  })

  test('checked-in public copy is byte-identical to the source', () => {
    const source = fs.readFileSync(sourcePath, 'utf-8')
    const hosted = fs.readFileSync(hostedPath, 'utf-8')
    expect(hosted).toBe(source)
  })
})
