#!/usr/bin/env bun
/**
 * CLI: generate TypeScript roll functions from a .randsum.json spec.
 *
 * Usage:
 *   bun scripts/codegen.ts <spec-path> [output-dir]
 *
 * If output-dir is omitted, writes to the current directory.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { generateCode } from '../src/codegen'
import type { RandSumSpec } from '../src/types'

const [specPath, outputDir] = process.argv.slice(2)

if (!specPath) {
  console.error('Usage: bun scripts/codegen.ts <spec.randsum.json> [output-dir]')
  process.exit(1)
}

const spec = JSON.parse(readFileSync(resolve(process.cwd(), specPath), 'utf-8')) as RandSumSpec
const code = await generateCode(spec)
const dir = resolve(process.cwd(), outputDir ?? '.')
mkdirSync(dir, { recursive: true })
const filepath = join(dir, `${spec.shortcode}.generated.ts`)
writeFileSync(filepath, code, 'utf-8')
console.error(`Generated: ${filepath}`)
